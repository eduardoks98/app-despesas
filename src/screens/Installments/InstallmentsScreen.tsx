import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Modal,
  Alert
} from 'react-native';
import { Container } from '../../components/common/Container';
import { InstallmentCard } from '../../components/installments/InstallmentCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MoneyText } from '../../components/common/MoneyText';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { InstallmentSkeleton } from '../../components/common/Skeleton';
import { StorageService } from '../../services/storage/StorageService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { InstallmentCalculations } from '../../services/calculations/InstallmentCalculations';
import { Installment, Transaction } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface InstallmentsScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'active' | 'completed' | 'overdue';
type SortType = 'name' | 'store' | 'value' | 'date' | 'remaining';

export const InstallmentsScreen: React.FC<InstallmentsScreenProps> = ({ navigation }) => {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredInstallments, setFilteredInstallments] = useState<Installment[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);

  // Estatísticas
  const [stats, setStats] = useState({
    totalActive: 0,
    totalCompleted: 0,
    monthlyPayment: 0,
    totalDebt: 0,
    overdueCount: 0,
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });

    loadData();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    applyFiltersAndSort();
    calculateStats();
  }, [installments, transactions, searchText, filterType, sortType]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    } else {
      setRefreshing(true);
    }
    
    const result = await ErrorHandler.withErrorHandling(
      'carregar parcelamentos',
      async () => {
        const [installmentsData, transactionsData] = await Promise.all([
          StorageService.getInstallments(),
          StorageService.getTransactions()
        ]);
        
        setInstallments(installmentsData);
        setTransactions(transactionsData);
        
        return { installmentsData, transactionsData };
      },
      false
    );
    
    if (!result) {
      setInstallments([]);
      setTransactions([]);
      if (!isRefresh) {
        setErrorState('Não foi possível carregar os parcelamentos');
      }
    } else {
      if (!isRefresh) {
        stopLoading();
      }
    }
    
    if (isRefresh) {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const applyFiltersAndSort = () => {
    let filtered = [...installments];

    // Aplicar busca
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(installment =>
        installment.description.toLowerCase().includes(searchLower) ||
        installment.store.toLowerCase().includes(searchLower) ||
        installment.category.toLowerCase().includes(searchLower)
      );
    }

    // Aplicar filtros
    const overdueInstallments = InstallmentCalculations.getOverdueInstallments(installments, transactions);
    
    switch (filterType) {
      case 'active':
        filtered = filtered.filter(i => i.status === 'active');
        break;
      case 'completed':
        filtered = filtered.filter(i => i.status === 'completed');
        break;
      case 'overdue':
        const overdueIds = overdueInstallments.map(o => o.installmentId);
        filtered = filtered.filter(i => overdueIds.includes(i.id));
        break;
    }

    // Aplicar ordenação
    switch (sortType) {
      case 'name':
        filtered.sort((a, b) => a.description.localeCompare(b.description));
        break;
      case 'store':
        filtered.sort((a, b) => a.store.localeCompare(b.store));
        break;
      case 'value':
        filtered.sort((a, b) => b.installmentValue - a.installmentValue);
        break;
      case 'date':
        filtered.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        break;
      case 'remaining':
        filtered.sort((a, b) => {
          const aRemaining = a.totalInstallments - a.paidInstallments.length;
          const bRemaining = b.totalInstallments - b.paidInstallments.length;
          return bRemaining - aRemaining;
        });
        break;
    }

    setFilteredInstallments(filtered);
  };

  const calculateStats = () => {
    const summary = InstallmentCalculations.getInstallmentSummary(installments, transactions);
    const overdueInstallments = InstallmentCalculations.getOverdueInstallments(installments, transactions);
    
    setStats({
      totalActive: summary.totalActive,
      totalCompleted: summary.totalCompleted,
      monthlyPayment: summary.monthlyPayment,
      totalDebt: summary.totalDebt,
      overdueCount: overdueInstallments.length,
    });
  };

  const getFilterButtonStyle = (type: FilterType) => [
    styles.filterButton,
    filterType === type && styles.filterButtonActive
  ];

  const getFilterTextStyle = (type: FilterType) => [
    styles.filterButtonText,
    filterType === type && styles.filterButtonTextActive
  ];

  const renderInstallmentsSkeleton = () => (
    <View>
      {Array.from({ length: 4 }).map((_, index) => (
        <InstallmentSkeleton key={index} />
      ))}
    </View>
  );

  return (
    <Container>
      {/* Header com estatísticas */}
      <View style={styles.header}>
        <Text style={styles.title}>Parcelamentos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AddInstallment')}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalActive}</Text>
          <Text style={styles.statLabel}>Ativos</Text>
        </View>
        <View style={styles.statItem}>
          <MoneyText value={stats.monthlyPayment} size="small" showSign={false} />
          <Text style={styles.statLabel}>Mensal</Text>
        </View>
        <View style={styles.statItem}>
          <MoneyText value={stats.totalDebt} size="small" showSign={false} />
          <Text style={styles.statLabel}>Total</Text>
        </View>
        {stats.overdueCount > 0 && (
          <View style={[styles.statItem, styles.overdueStatItem]}>
            <Text style={[styles.statValue, styles.overdueStatValue]}>{stats.overdueCount}</Text>
            <Text style={[styles.statLabel, styles.overdueStatLabel]}>Atraso</Text>
          </View>
        )}
      </View>

      {/* Barra de busca e filtros */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome, loja ou categoria..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons 
            name={showFilters ? "options" : "options-outline"} 
            size={20} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {showFilters && (
        <Card style={styles.filtersCard}>
          <Text style={styles.filtersTitle}>Filtros e Ordenação</Text>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Status:</Text>
            <View style={styles.filterButtons}>
              {[
                { key: 'all', label: 'Todos' },
                { key: 'active', label: 'Ativos' },
                { key: 'completed', label: 'Concluídos' },
                { key: 'overdue', label: 'Em Atraso' }
              ].map(filter => (
                <TouchableOpacity 
                  key={filter.key}
                  style={getFilterButtonStyle(filter.key as FilterType)}
                  onPress={() => setFilterType(filter.key as FilterType)}
                >
                  <Text style={getFilterTextStyle(filter.key as FilterType)}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Ordenar por:</Text>
            <View style={styles.filterButtons}>
              {[
                { key: 'date', label: 'Data' },
                { key: 'name', label: 'Nome' },
                { key: 'value', label: 'Valor' },
                { key: 'remaining', label: 'Restante' }
              ].map(sort => (
                <TouchableOpacity 
                  key={sort.key}
                  style={[styles.filterButton, sortType === sort.key && styles.filterButtonActive]}
                  onPress={() => setSortType(sort.key as SortType)}
                >
                  <Text style={[
                    styles.filterButtonText, 
                    sortType === sort.key && styles.filterButtonTextActive
                  ]}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>
      )}

      {/* Lista de parcelamentos */}
      <View style={styles.listContainer}>
        <LoadingWrapper
          loading={loading}
          error={error}
          retry={loadData}
          empty={!loading && !error && filteredInstallments.length === 0}
          emptyTitle="Nenhum parcelamento encontrado"
          emptyMessage={
            searchText || filterType !== 'all' 
              ? "Nenhum parcelamento encontrado com os filtros aplicados"
              : "Nenhum parcelamento ainda.\nComece adicionando um novo parcelamento!"
          }
          emptyIcon="card"
          skeleton={renderInstallmentsSkeleton()}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {filteredInstallments.map(installment => (
              <InstallmentCard
                key={installment.id}
                installment={installment}
                onPress={() => navigation.navigate('InstallmentDetail', { 
                  installmentId: installment.id 
                })}
              />
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </LoadingWrapper>
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  overdueStatItem: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overdueStatValue: {
    color: colors.danger,
  },
  overdueStatLabel: {
    color: colors.danger,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterToggle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtersCard: {
    marginTop: 8,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  bottomSpacer: {
    height: 100,
  },
});