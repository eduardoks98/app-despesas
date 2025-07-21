import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  FAB,
  ActivityIndicator,
  Menu,
  Divider,
  IconButton,
  Button,
  TextInput,
  SegmentedButtons,
  HelperText,
  Portal,
  Dialog,
  List,
  Searchbar,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatCurrency, formatDate, CATEGORIES, getCategoryIcon, getCategoryColor } from '../utils/formatters';
import ExpenseCard from '../components/ExpenseCard';

const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, deleteExpense, markAsPaid } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterByStatus, setFilterByStatus] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState<Date | null>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = state.expenses;

    // Filtro por categoria
    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Filtro por status
    if (filterByStatus === 'paid') {
      filtered = filtered.filter(expense => expense.isPaid);
    } else if (filterByStatus === 'unpaid') {
      filtered = filtered.filter(expense => !expense.isPaid);
    }

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (expense.description && expense.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [state.expenses, searchQuery, selectedCategory, sortBy, sortOrder, filterByStatus]);

  const handleDeleteExpense = (expenseId: string, expenseTitle: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir "${expenseTitle}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteExpense(expenseId),
        },
      ]
    );
  };

  const handleTogglePaid = async (expenseId: string, expenseTitle: string, isPaid: boolean) => {
    if (isPaid) {
      // Se não está pago, perguntar se quer marcar como pago
      setSelectedExpense({ id: expenseId, title: expenseTitle });
      setModalVisible(true);
    } else {
      // Se já está pago, perguntar se quer marcar como não pago
      Alert.alert(
        'Alterar Status',
        `Deseja marcar "${expenseTitle}" como não pago?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sim',
            onPress: async () => {
              try {
                await markAsPaid(expenseId, false);
              } catch (error) {
                Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao alterar status');
              }
            },
          },
        ]
      );
    }
  };

  const handleConfirmPayment = async () => {
    if (selectedExpense && paymentDate) {
      try {
        await markAsPaid(selectedExpense.id, true, paymentDate.toISOString());
        setModalVisible(false);
        setSelectedExpense(null);
        setPaymentDate(null);
      } catch (error) {
        Alert.alert('Erro', error instanceof Error ? error.message : 'Erro ao marcar como pago');
      }
    }
  };

  const canMarkInstallmentAsPaid = (expense: any): { canMark: boolean; warning?: string } => {
    if (!expense.installments || expense.installments <= 1 || !expense.currentInstallment || expense.currentInstallment <= 1) {
      return { canMark: true };
    }

    // Verificar se a parcela anterior foi paga
    const baseTitle = expense.title.replace(/\s*\(\d+\/\d+\)$/, '');
    const previousInstallment = expense.currentInstallment - 1;
    const previousExpense = state.expenses.find(e => 
      e.title.replace(/\s*\(\d+\/\d+\)$/, '') === baseTitle &&
      e.currentInstallment === previousInstallment &&
      e.installments === expense.installments
    );
    
    if (previousExpense && !previousExpense.isPaid) {
      return { 
        canMark: false, 
        warning: `Parcela anterior (${previousInstallment}/${expense.installments}) não foi paga` 
      };
    }
    
    return { canMark: true };
  };

  const renderExpenseItem = ({ item }: { item: any }) => {
    const installmentCheck = canMarkInstallmentAsPaid(item);
    
    return (
      <ExpenseCard
        expense={item}
        onEdit={() => navigation.navigate('EditExpense' as never, { expense: item } as any)}
        onDelete={() => handleDeleteExpense(item.id!, item.title)}
        onTogglePaid={() => handleTogglePaid(item.id!, item.title, item.isPaid || false)}
        variant="default"
        canMarkAsPaid={installmentCheck.canMark}
        installmentWarning={installmentCheck.warning || undefined}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#ccc" />
      <Title style={styles.emptyTitle}>Nenhuma despesa encontrada</Title>
      <Paragraph style={styles.emptyText}>
        {searchQuery || selectedCategory !== 'Todas' || filterByStatus !== 'all'
          ? 'Tente ajustar os filtros de busca'
          : 'Adicione sua primeira despesa para começar'}
      </Paragraph>
    </View>
  );

  const renderActiveFilters = () => {
    const activeFilters = [];
    
    if (selectedCategory !== 'Todas') {
      activeFilters.push(selectedCategory);
    }
    if (filterByStatus !== 'all') {
      activeFilters.push(filterByStatus === 'paid' ? 'Pagas' : 'Pendentes');
    }
    if (searchQuery) {
      activeFilters.push(`"${searchQuery}"`);
    }
    
    return activeFilters;
  };

  const renderFiltersSummary = () => {
    const activeFilters = renderActiveFilters();
    
    return (
      <Card style={styles.filtersCard}>
        <Card.Content>
          <View style={styles.filtersSummary}>
            <View style={styles.filtersSummaryContent}>
              <Ionicons name="funnel" size={20} color="#2196F3" />
              <Text style={styles.filtersSummaryText}>
                {activeFilters.length > 0 
                  ? `Filtros: ${activeFilters.join(', ')}`
                  : 'Todos os filtros'
                }
              </Text>
            </View>
            <TouchableOpacity
              style={styles.filterActionButton}
              onPress={() => setShowFiltersModal(true)}
            >
              <Ionicons name="options" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Paragraph style={styles.loadingText}>Carregando...</Paragraph>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Despesas</Title>
        <Paragraph style={styles.headerSubtitle}>
          Gerencie todas as suas despesas
        </Paragraph>
      </View>

      <Searchbar
        placeholder="Buscar despesas..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      {renderFiltersSummary()}

      <FlatList
        data={filteredAndSortedExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id!}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Modal de filtros avançados */}
      <Portal>
        <Dialog visible={showFiltersModal} onDismiss={() => setShowFiltersModal(false)}>
          <Dialog.Title>Filtros Avançados</Dialog.Title>
          <Dialog.Content>
            <View style={styles.modalFilterSection}>
              <Text style={styles.modalFilterLabel}>Categoria</Text>
              <ScrollView style={styles.categoryModalList}>
                <TouchableOpacity
                  style={styles.categoryModalItem}
                  onPress={() => {
                    setSelectedCategory('Todas');
                    setShowFiltersModal(false);
                  }}
                >
                  <Ionicons name="list" size={24} color="#666" />
                  <Text style={styles.categoryModalText}>Todas as Categorias</Text>
                  {selectedCategory === 'Todas' && (
                    <Ionicons name="checkmark" size={20} color="#2196F3" />
                  )}
                </TouchableOpacity>
                
                {CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={styles.categoryModalItem}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowFiltersModal(false);
                    }}
                  >
                    <Ionicons 
                      name={getCategoryIcon(category) as any} 
                      size={24} 
                      color={getCategoryColor(category)} 
                    />
                    <Text style={styles.categoryModalText}>{category}</Text>
                    {selectedCategory === category && (
                      <Ionicons name="checkmark" size={20} color="#2196F3" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.modalFilterSection}>
              <Text style={styles.modalFilterLabel}>Status</Text>
              <SegmentedButtons
                value={filterByStatus}
                onValueChange={setFilterByStatus as any}
                buttons={[
                  { value: 'all', label: 'Todas' },
                  { value: 'unpaid', label: 'Pendentes' },
                  { value: 'paid', label: 'Pagas' },
                ]}
                style={styles.modalSegmentedButtons}
              />
            </View>

            <View style={styles.modalFilterSection}>
              <Text style={styles.modalFilterLabel}>Ordenação</Text>
              <SegmentedButtons
                value={sortBy}
                onValueChange={setSortBy as any}
                buttons={[
                  { value: 'date', label: 'Data' },
                  { value: 'amount', label: 'Valor' },
                  { value: 'title', label: 'Nome' },
                ]}
                style={styles.modalSegmentedButtons}
              />
              <View style={styles.modalSortOrder}>
                <Text style={styles.modalFilterLabel}>Ordem:</Text>
                <TouchableOpacity
                  style={styles.sortOrderButton}
                  onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                >
                  <Ionicons 
                    name={sortOrder === 'desc' ? 'arrow-down' : 'arrow-up'} 
                    size={20} 
                    color="#2196F3" 
                  />
                  <Text style={styles.sortOrderText}>
                    {sortOrder === 'desc' ? 'Decrescente' : 'Crescente'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => {
              setSelectedCategory('Todas');
              setFilterByStatus('all');
              setSortBy('date');
              setSortOrder('desc');
              setSearchQuery('');
            }}>Limpar</Button>
            <Button onPress={() => setShowFiltersModal(false)}>Aplicar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Modal de confirmação de pagamento */}
      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Confirmar Pagamento</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Deseja marcar "{selectedExpense?.title}" como pago?
            </Paragraph>
            <TextInput
              label="Data do pagamento (opcional)"
              value={paymentDate ? formatDate(paymentDate.toISOString()) : ''}
              mode="outlined"
              style={styles.dateInput}
              right={<TextInput.Icon icon="calendar" />}
              onPressIn={() => {
                // Abrir date picker
                const now = new Date();
                setPaymentDate(now);
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancelar</Button>
            <Button onPress={handleConfirmPayment}>Confirmar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddExpense' as never)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 90,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    paddingTop: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 16,
    marginTop: 4,
  },
  searchbar: {
    marginBottom: 16,
  },
  filtersCard: {
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  filtersSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersSummaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtersSummaryText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  filterActionButton: {
    marginLeft: 10,
  },
  listContainer: {
    padding: 16,
  },
  categoryModalList: {
    maxHeight: 200,
  },
  categoryModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryModalText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  dateInput: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 90,
    backgroundColor: '#2196F3',
    elevation: 8,
    zIndex: 1000,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  modalFilterSection: {
    marginBottom: 16,
  },
  modalFilterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  modalSegmentedButtons: {
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalSortOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  sortOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  sortOrderText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 5,
  },
});

export default ExpensesScreen; 