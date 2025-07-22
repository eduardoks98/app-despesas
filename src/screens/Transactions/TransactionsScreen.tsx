import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { FAB } from '../../components/common/FAB';
import { MoneyText } from '../../components/common/MoneyText';
import { StorageService } from '../../services/storage/StorageService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { HapticService } from '../../services/haptic/HapticService';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { useRefresh } from '../../hooks/useRefresh';
import { Transaction } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '../../styles/responsive';

interface TransactionsScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'income' | 'expense' | 'installments' | 'subscriptions';
type SortType = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';
type MonthFilterType = 'all' | string; // string será no formato 'YYYY-MM'

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [monthFilter, setMonthFilter] = useState<MonthFilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date_desc');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);
  const { refreshing, onRefresh } = useRefresh({ onRefresh: () => loadTransactions(true) });

  // Estatísticas
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTransactions();
    });

    loadTransactions();
    return unsubscribe;
  }, [navigation]);

  const calculateFilteredStats = () => {
    let filtered = [...transactions];

    // Aplicar busca
    if (searchText) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Aplicar filtro por mês
    if (monthFilter !== 'all') {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === monthFilter;
      });
    }

    // Aplicar filtros por tipo
    switch (filterType) {
      case 'income':
        filtered = filtered.filter(t => t.type === 'income');
        break;
      case 'expense':
        filtered = filtered.filter(t => t.type === 'expense');
        break;
      case 'installments':
        filtered = filtered.filter(t => t.installmentId);
        break;
      case 'subscriptions':
        filtered = filtered.filter(t => t.subscriptionId);
        break;
    }

    // Calcular estatísticas dos dados filtrados
    const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    setTotalIncome(income);
    setTotalExpenses(expenses);
  };

  useEffect(() => {
    applyFiltersAndSort();
    calculateFilteredStats();
  }, [transactions, searchText, filterType, monthFilter, sortType]);

  const loadTransactions = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    }
    
    const data = await ErrorHandler.withErrorHandling(
      'carregar transações',
      async () => {
        const transactions = await StorageService.getTransactions();
        setTransactions(transactions);
        
        // As estatísticas serão calculadas após aplicar os filtros
        
        return transactions;
      },
      false
    );
    
    if (!data) {
      setTotalIncome(0);
      setTotalExpenses(0);
      if (!isRefresh) {
        setErrorState('Não foi possível carregar as transações');
      }
    } else {
      if (!isRefresh) {
        stopLoading();
      }
    }
  };

  // Gerar lista de meses disponíveis
  const getAvailableMonths = () => {
    const months = new Set<string>();
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    return Array.from(months).sort((a, b) => b.localeCompare(a)); // Mais recentes primeiro
  };

  const formatMonthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { 
      month: 'short', 
      year: 'numeric' 
    }).replace('.', '');
  };

  const applyFiltersAndSort = () => {
    let filtered = [...transactions];

    // Aplicar busca
    if (searchText) {
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Aplicar filtro por mês
    if (monthFilter !== 'all') {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const monthKey = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`;
        return monthKey === monthFilter;
      });
    }

    // Aplicar filtros por tipo
    switch (filterType) {
      case 'income':
        filtered = filtered.filter(t => t.type === 'income');
        break;
      case 'expense':
        filtered = filtered.filter(t => t.type === 'expense');
        break;
      case 'installments':
        filtered = filtered.filter(t => t.installmentId);
        break;
      case 'subscriptions':
        filtered = filtered.filter(t => t.subscriptionId);
        break;
    }

    // Aplicar ordenação
    switch (sortType) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'amount_desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount_asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
    }

    setFilteredTransactions(filtered);
  };

  const handleTransactionPress = (transaction: Transaction) => {
    if (transaction.installmentId) {
      navigation.navigate('InstallmentDetail', { 
        installmentId: transaction.installmentId 
      });
    } else {
      navigation.navigate('EditTransaction', { 
        transactionId: transaction.id 
      });
    }
  };

  const handleTransactionLongPress = async (transaction: Transaction) => {
    await HapticService.longPress();
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.installmentId) return 'card';
    if (transaction.subscriptionId) return 'repeat';
    return transaction.type === 'income' ? 'trending-up' : 'trending-down';
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.installmentId) return colors.warning;
    if (transaction.subscriptionId) return colors.info;
    return transaction.type === 'income' ? colors.success : colors.danger;
  };

  const getTransactionTitle = (transaction: Transaction) => {
    return transaction.description;
  };

  const getTransactionDate = (transaction: Transaction) => {
    const date = new Date(transaction.date);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderTransactionCard = (transaction: Transaction, index: number) => (
    <TouchableOpacity 
      key={transaction.id}
      style={[
        styles.timelineItemCompact,
        index !== filteredTransactions.length - 1 && styles.timelineItemBorder
      ]}
      onPress={() => handleTransactionPress(transaction)}
      onLongPress={() => handleTransactionLongPress(transaction)}
    >
      <View style={[
        styles.timelineIcon,
        { backgroundColor: getTransactionColor(transaction) + '20' }
      ]}>
        <Ionicons name={getTransactionIcon(transaction) as any} size={16} color={getTransactionColor(transaction)} />
      </View>
      
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{getTransactionTitle(transaction)}</Text>
        <Text style={styles.timelineDate}>
          {getTransactionDate(transaction)}
        </Text>
        {transaction.category && (
          <Text style={styles.timelineCategory}>{transaction.category}</Text>
        )}
      </View>
      
      <MoneyText 
        value={transaction.type === 'income' ? transaction.amount : -transaction.amount} 
        size="small" 
        style={[styles.timelineAmount, { color: getTransactionColor(transaction) }]}
      />
    </TouchableOpacity>
  );

  const clearFilters = async () => {
    await HapticService.buttonPress();
    setFilterType('all');
    setMonthFilter('all');
    setSortType('date_desc');
    setSearchText('');
  };

  const getFilterButtonStyle = (type: FilterType) => [
    styles.filterButton,
    filterType === type && styles.filterButtonActive
  ];

  const getFilterTextStyle = (type: FilterType) => [
    styles.filterButtonText,
    filterType === type && styles.filterButtonTextActive
  ];

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filterType !== 'all') count++;
    if (monthFilter !== 'all') count++;
    if (sortType !== 'date_desc') count++;
    if (searchText.length > 0) count++;
    return count;
  };

  return (
    <Container>
      <LoadingWrapper
        loading={loading}
        error={error}
        retry={loadTransactions}
        empty={!loading && !error && transactions.length === 0}
        emptyTitle="Nenhuma transação encontrada"
        emptyMessage="Adicione algumas transações para visualizá-las aqui!"
        emptyIcon="receipt-outline"
      >
        <FlatList
          data={[{ key: 'content' }]}
          renderItem={() => (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTop}>
                  <View>
                    <Text style={styles.title}>Transações</Text>
                    <Text style={styles.subtitle}>
                      {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transação' : 'transações'}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={[styles.filterButton, getActiveFiltersCount() > 0 && styles.filterButtonWithFilters]}
                    onPress={async () => {
                      await HapticService.buttonPress();
                      setShowFiltersModal(true);
                    }}
                  >
                    <Ionicons 
                      name="options" 
                      size={20} 
                      color={getActiveFiltersCount() > 0 ? colors.white : colors.primary} 
                    />
                    {getActiveFiltersCount() > 0 && (
                      <View style={styles.filterBadge}>
                        <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Cards de Resumo */}
              <View style={styles.summaryCards}>
                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Receitas</Text>
                  <MoneyText 
                    value={totalIncome} 
                    size="medium" 
                    showSign={false}
                    style={styles.incomeText}
                  />
                </Card>

                <Card style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>Despesas</Text>
                  <MoneyText 
                    value={totalExpenses} 
                    size="medium" 
                    showSign={false}
                    style={styles.expenseText}
                  />
                </Card>
              </View>

              {/* Lista de transações */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={styles.sectionTitle}>Todas as Transações</Text>
                    {getActiveFiltersCount() > 0 && (
                      <Text style={styles.sectionSubtitle}>
                        {getActiveFiltersCount()} filtro{getActiveFiltersCount() > 1 ? 's' : ''} aplicado{getActiveFiltersCount() > 1 ? 's' : ''}
                      </Text>
                    )}
                  </View>
                </View>
                
{filteredTransactions.length > 0 ? (
                  <View style={styles.timelineContainer}>
                    {filteredTransactions.map((transaction, index) => renderTransactionCard(transaction, index))}
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconContainer}>
                      <Ionicons name="receipt-outline" size={64} color={colors.textSecondary} />
                    </View>
                    <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
                    <Text style={styles.emptyMessage}>
                      {searchText || filterType !== 'all' || monthFilter !== 'all'
                        ? "Nenhuma transação encontrada com os filtros aplicados"
                        : "Nenhuma transação ainda.\nComece adicionando uma nova transação!"}
                    </Text>
                  </View>
                )}
              </View>
            </>
          )}
          keyExtractor={(item) => item.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
        />

        {/* FAB */}
        <FAB
          icon="add"
          onPress={() => navigation.navigate('AddTransaction')}
        />

        {/* Modal de Filtros */}
        <Modal
          visible={showFiltersModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFiltersModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtros e Busca</Text>
                <TouchableOpacity 
                  onPress={() => setShowFiltersModal(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Busca */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Buscar:</Text>
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Descrição ou categoria..."
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
                </View>

                {/* Filtro por Tipo */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Tipo:</Text>
                  <View style={styles.filterButtons}>
                    <TouchableOpacity 
                      style={getFilterButtonStyle('all')}
                      onPress={() => setFilterType('all')}
                    >
                      <Ionicons name="list" size={16} color={filterType === 'all' ? colors.white : colors.textSecondary} />
                      <Text style={getFilterTextStyle('all')}>Todas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={getFilterButtonStyle('income')}
                      onPress={() => setFilterType('income')}
                    >
                      <Ionicons name="trending-up" size={16} color={filterType === 'income' ? colors.white : colors.success} />
                      <Text style={getFilterTextStyle('income')}>Receitas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={getFilterButtonStyle('expense')}
                      onPress={() => setFilterType('expense')}
                    >
                      <Ionicons name="trending-down" size={16} color={filterType === 'expense' ? colors.white : colors.danger} />
                      <Text style={getFilterTextStyle('expense')}>Despesas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={getFilterButtonStyle('installments')}
                      onPress={() => setFilterType('installments')}
                    >
                      <Ionicons name="card" size={16} color={filterType === 'installments' ? colors.white : colors.warning} />
                      <Text style={getFilterTextStyle('installments')}>Parcelas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={getFilterButtonStyle('subscriptions')}
                      onPress={() => setFilterType('subscriptions')}
                    >
                      <Ionicons name="repeat" size={16} color={filterType === 'subscriptions' ? colors.white : colors.info} />
                      <Text style={getFilterTextStyle('subscriptions')}>Assinaturas</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Filtro por Mês */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Mês:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScrollView}>
                    <View style={styles.monthButtons}>
                      <TouchableOpacity 
                        style={[styles.monthButton, monthFilter === 'all' && styles.monthButtonActive]}
                        onPress={() => setMonthFilter('all')}
                      >
                        <Text style={[styles.monthButtonText, monthFilter === 'all' && styles.monthButtonTextActive]}>
                          Todos
                        </Text>
                      </TouchableOpacity>
                      {getAvailableMonths().map((month) => (
                        <TouchableOpacity 
                          key={month}
                          style={[styles.monthButton, monthFilter === month && styles.monthButtonActive]}
                          onPress={() => setMonthFilter(month)}
                        >
                          <Text style={[styles.monthButtonText, monthFilter === month && styles.monthButtonTextActive]}>
                            {formatMonthLabel(month)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Ordenação */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Ordenar por:</Text>
                  <View style={styles.sortButtons}>
                    <TouchableOpacity 
                      style={[styles.sortButton, sortType === 'date_desc' && styles.sortButtonActive]}
                      onPress={() => setSortType('date_desc')}
                    >
                      <Ionicons name="calendar" size={16} color={sortType === 'date_desc' ? colors.white : colors.primary} />
                      <Text style={[styles.sortButtonText, sortType === 'date_desc' && styles.sortButtonTextActive]}>
                        Mais recente
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.sortButton, sortType === 'amount_desc' && styles.sortButtonActive]}
                      onPress={() => setSortType('amount_desc')}
                    >
                      <Ionicons name="arrow-down" size={16} color={sortType === 'amount_desc' ? colors.white : colors.primary} />
                      <Text style={[styles.sortButtonText, sortType === 'amount_desc' && styles.sortButtonTextActive]}>
                        Maior valor
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.clearFiltersButton}
                  onPress={clearFilters}
                >
                  <Text style={styles.clearFiltersText}>Limpar Filtros</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyFiltersButton}
                  onPress={() => setShowFiltersModal(false)}
                >
                  <Text style={styles.applyFiltersText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LoadingWrapper>
    </Container>
  );
};

const styles = StyleSheet.create({
  flatListContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    backgroundColor: colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonWithFilters: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
  },
  summaryCards: {
    flexDirection: 'row',
    marginTop: -16,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: SPACING.xs / 2,
    textAlign: 'center',
  },
  incomeText: {
    color: colors.success,
    textAlign: 'center',
    flexShrink: 1,
  },
  expenseText: {
    color: colors.danger,
    textAlign: 'center',
    flexShrink: 1,
  },
  section: {
    marginTop: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
    flexWrap: 'wrap',
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1,
  },
  sectionSubtitle: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timelineContainer: {
    backgroundColor: colors.white,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  timelineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 1,
  },
  timelineDate: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  timelineCategory: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timelineAmount: {
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
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
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '18%',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  monthScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  monthButtons: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 20,
  },
  monthButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 60,
    alignItems: 'center',
  },
  monthButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  monthButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  monthButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    justifyContent: 'center',
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  applyFiltersButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },
});