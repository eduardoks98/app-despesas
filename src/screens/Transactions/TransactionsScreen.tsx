import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView
} from 'react-native';
import { Container } from '../../components/common/Container';
import { TransactionList } from '../../components/transactions/TransactionList';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MoneyText } from '../../components/common/MoneyText';
import { StorageService } from '../../services/storage/StorageService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { HapticService } from '../../services/haptic/HapticService';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { useRefresh } from '../../hooks/useRefresh';
import { TransactionSkeleton } from '../../components/common/Skeleton';
import { Transaction } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface TransactionsScreenProps {
  navigation: any;
}

type FilterType = 'all' | 'income' | 'expense' | 'installments';
type SortType = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export const TransactionsScreen: React.FC<TransactionsScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('date_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);
  const { refreshing, onRefresh } = useRefresh({ onRefresh: () => loadTransactions(true) });

  // Estatísticas
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [installmentTransactions, setInstallmentTransactions] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTransactions();
    });

    loadTransactions();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [transactions, searchText, filterType, sortType]);

  const loadTransactions = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    }
    
    const data = await ErrorHandler.withErrorHandling(
      'carregar transações',
      async () => {
        const transactions = await StorageService.getTransactions();
        setTransactions(transactions);
        
        // Calcular estatísticas
        const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const installments = transactions.filter(t => t.installmentId).length;
        
        setTotalIncome(income);
        setTotalExpenses(expenses);
        setInstallmentTransactions(installments);
        
        return transactions;
      },
      false
    );
    
    // Se falhou, manter estado atual mas limpar estatísticas
    if (!data) {
      setTotalIncome(0);
      setTotalExpenses(0);
      setInstallmentTransactions(0);
      if (!isRefresh) {
        setErrorState('Não foi possível carregar as transações');
      }
    } else {
      if (!isRefresh) {
        stopLoading();
      }
    }
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

    // Aplicar filtros
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
    // Se a transação tem installmentId, é uma transação de parcela
    if (transaction.installmentId) {
      navigation.navigate('InstallmentDetail', { 
        installmentId: transaction.installmentId 
      });
    } else {
      // Transação normal - navegar para edição
      navigation.navigate('EditTransaction', { 
        transactionId: transaction.id 
      });
    }
  };

  const handleTransactionLongPress = async (transaction: Transaction) => {
    await HapticService.longPress();
    Alert.alert(
      'Opções',
      `O que deseja fazer com "${transaction.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: () => handleDeleteTransaction(transaction)
        }
      ]
    );
  };

  const handleDeleteTransaction = async (transaction: Transaction) => {
    await HapticService.destructive();
    
    const result = await ErrorHandler.withErrorHandling(
      'excluir transação',
      async () => {
        const allTransactions = await StorageService.getTransactions();
        const filtered = allTransactions.filter(t => t.id !== transaction.id);
        await StorageService.setTransactions(filtered);
        return true;
      }
    );
    
    if (result) {
      await HapticService.success();
      loadTransactions();
      Alert.alert('Sucesso', 'Transação excluída com sucesso');
    } else {
      await HapticService.error();
    }
  };

  const getFilterButtonStyle = (type: FilterType) => [
    styles.filterButton,
    filterType === type && styles.filterButtonActive
  ];

  const getFilterTextStyle = (type: FilterType) => [
    styles.filterButtonText,
    filterType === type && styles.filterButtonTextActive
  ];

  const renderTransactionSkeleton = () => (
    <View>
      {Array.from({ length: 6 }).map((_, index) => (
        <TransactionSkeleton key={index} />
      ))}
    </View>
  );

  return (
    <Container>
      {/* Header com estatísticas */}
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>
        <Text style={styles.subtitle}>Interface melhorada!</Text>
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="trending-up" size={16} color={colors.success} />
            </View>
            <View>
              <Text style={styles.statLabel}>Receitas</Text>
              <MoneyText value={totalIncome} size="small" style={styles.incomeText} showSign={false} />
            </View>
          </View>
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Ionicons name="trending-down" size={16} color={colors.danger} />
            </View>
            <View>
              <Text style={styles.statLabel}>Despesas</Text>
              <MoneyText value={totalExpenses} size="small" showSign={false} />
            </View>
          </View>
        </View>
      </View>

      {/* Barra de busca e filtros */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por descrição ou categoria..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={async () => {
              await HapticService.buttonPress();
              setSearchText('');
            }}>
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.filterToggle, showFilters && styles.filterToggleActive]}
          onPress={async () => {
            await HapticService.buttonPress();
            setShowFilters(!showFilters);
          }}
        >
          <Ionicons 
            name={showFilters ? "options" : "options-outline"} 
            size={20} 
            color={showFilters ? colors.white : colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      {showFilters && (
        <Card style={styles.filtersCard}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filtros</Text>
            <TouchableOpacity 
              onPress={async () => {
                await HapticService.buttonPress();
                setFilterType('all');
                setSortType('date_desc');
              }}
              style={styles.clearFiltersButton}
            >
              <Text style={styles.clearFiltersText}>Limpar</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Tipo:</Text>
            <View style={styles.filterButtons}>
              <TouchableOpacity 
                style={getFilterButtonStyle('all')}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setFilterType('all');
                }}
              >
                <Ionicons name="list" size={16} color={filterType === 'all' ? colors.white : colors.textSecondary} />
                <Text style={getFilterTextStyle('all')}>Todas</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={getFilterButtonStyle('income')}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setFilterType('income');
                }}
              >
                <Ionicons name="trending-up" size={16} color={filterType === 'income' ? colors.white : colors.success} />
                <Text style={getFilterTextStyle('income')}>Receitas</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={getFilterButtonStyle('expense')}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setFilterType('expense');
                }}
              >
                <Ionicons name="trending-down" size={16} color={filterType === 'expense' ? colors.white : colors.danger} />
                <Text style={getFilterTextStyle('expense')}>Despesas</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={getFilterButtonStyle('installments')}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setFilterType('installments');
                }}
              >
                <Ionicons name="card" size={16} color={filterType === 'installments' ? colors.white : colors.primary} />
                <Text style={getFilterTextStyle('installments')}>Parcelas</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Ordenar por:</Text>
            <View style={styles.sortButtons}>
              <TouchableOpacity 
                style={[styles.sortButton, sortType === 'date_desc' && styles.sortButtonActive]}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setSortType('date_desc');
                }}
              >
                <Ionicons name="calendar" size={16} color={sortType === 'date_desc' ? colors.white : colors.primary} />
                <Text style={[styles.sortButtonText, sortType === 'date_desc' && styles.sortButtonTextActive]}>
                  Mais recente
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sortButton, sortType === 'date_asc' && styles.sortButtonActive]}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setSortType('date_asc');
                }}
              >
                <Ionicons name="calendar-outline" size={16} color={sortType === 'date_asc' ? colors.white : colors.primary} />
                <Text style={[styles.sortButtonText, sortType === 'date_asc' && styles.sortButtonTextActive]}>
                  Mais antigo
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sortButton, sortType === 'amount_desc' && styles.sortButtonActive]}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setSortType('amount_desc');
                }}
              >
                <Ionicons name="arrow-down" size={16} color={sortType === 'amount_desc' ? colors.white : colors.primary} />
                <Text style={[styles.sortButtonText, sortType === 'amount_desc' && styles.sortButtonTextActive]}>
                  Maior valor
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.sortButton, sortType === 'amount_asc' && styles.sortButtonActive]}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setSortType('amount_asc');
                }}
              >
                <Ionicons name="arrow-up" size={16} color={sortType === 'amount_asc' ? colors.white : colors.primary} />
                <Text style={[styles.sortButtonText, sortType === 'amount_asc' && styles.sortButtonTextActive]}>
                  Menor valor
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      )}

      {/* Lista de transações */}
      <View style={styles.listContainer}>
        <LoadingWrapper
          loading={loading}
          error={error}
          retry={loadTransactions}
          empty={!loading && !error && filteredTransactions.length === 0}
          emptyTitle="Nenhuma transação encontrada"
          emptyMessage={
            searchText || filterType !== 'all' 
              ? "Nenhuma transação encontrada com os filtros aplicados"
              : "Nenhuma transação ainda.\nComece adicionando uma nova transação!"
          }
          emptyIcon="receipt"
          skeleton={renderTransactionSkeleton()}
        >
          <TransactionList
            transactions={filteredTransactions}
            onTransactionPress={handleTransactionPress}
            onTransactionLongPress={handleTransactionLongPress}
            refreshing={refreshing}
            onRefresh={onRefresh}
            emptyMessage={
              searchText || filterType !== 'all' 
                ? "Nenhuma transação encontrada com os filtros aplicados"
                : "Nenhuma transação ainda.\nComece adicionando uma nova transação!"
            }
          />
        </LoadingWrapper>
      </View>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={async () => {
          await HapticService.buttonPress();
          navigation.navigate('AddTransaction');
        }}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      {/* Modal de detalhes da transação */}
      <Modal
        visible={showTransactionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTransactionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTransaction && (
              <>
                <Text style={styles.modalTitle}>Detalhes da Transação</Text>
                
                <View style={styles.transactionDetail}>
                  <Text style={styles.detailLabel}>Descrição:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                </View>
                
                <View style={styles.transactionDetail}>
                  <Text style={styles.detailLabel}>Valor:</Text>
                  <MoneyText 
                    value={selectedTransaction.type === 'income' ? selectedTransaction.amount : -selectedTransaction.amount}
                    size="medium"
                  />
                </View>
                
                <View style={styles.transactionDetail}>
                  <Text style={styles.detailLabel}>Categoria:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.category}</Text>
                </View>
                
                <View style={styles.transactionDetail}>
                  <Text style={styles.detailLabel}>Data:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedTransaction.date).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                
                {selectedTransaction.paymentMethod && (
                  <View style={styles.transactionDetail}>
                    <Text style={styles.detailLabel}>Método:</Text>
                    <Text style={styles.detailValue}>
                      {selectedTransaction.paymentMethod === 'cash' ? 'Dinheiro' :
                       selectedTransaction.paymentMethod === 'debit' ? 'Débito' :
                       selectedTransaction.paymentMethod === 'credit' ? 'Crédito' :
                       selectedTransaction.paymentMethod === 'pix' ? 'PIX' : 'Outro'}
                    </Text>
                  </View>
                )}
                
                {selectedTransaction.installmentNumber && (
                  <View style={styles.transactionDetail}>
                    <Text style={styles.detailLabel}>Parcela:</Text>
                    <Text style={styles.detailValue}>
                      {selectedTransaction.installmentNumber}ª parcela
                    </Text>
                  </View>
                )}

                <Button
                  title="Fechar"
                  onPress={() => setShowTransactionModal(false)}
                  style={styles.modalButton}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.primary + '10',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary + '20',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary + '30',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  incomeText: {
    color: colors.success,
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
  filterToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filtersCard: {
    marginTop: 8,
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  clearFiltersText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: '23%',
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
  listContainer: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  transactionDetail: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: colors.text,
  },
  modalButton: {
    marginTop: 20,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    minWidth: '48%',
    justifyContent: 'center',
  },
  sortButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: colors.white,
  },
});