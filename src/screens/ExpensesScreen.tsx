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
  Searchbar,
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
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatCurrency, formatDate } from '../utils/formatters';

const CATEGORIES = [
  'Todas',
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Financiamento',
  'Outros',
];

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'Alimentação': 'food-fork-drink',
      'Transporte': 'car',
      'Moradia': 'home',
      'Saúde': 'medical-bag',
      'Educação': 'school',
      'Lazer': 'gamepad-variant',
      'Vestuário': 'tshirt-crew',
      'Financiamento': 'credit-card',
      'Outros': 'dots-horizontal',
    };
    return icons[category] || 'dots-horizontal';
  };

  const filteredAndSortedExpenses = useMemo(() => {
    let filtered = state.expenses;

    // Filtro por categoria
    if (selectedCategory !== 'Todas') {
      filtered = filtered.filter(expense => expense.category === selectedCategory);
    }

    // Filtro por status de pagamento
    if (filterByStatus === 'paid') {
      filtered = filtered.filter(expense => expense.isPaid);
    } else if (filterByStatus === 'unpaid') {
      filtered = filtered.filter(expense => !expense.isPaid);
    }

    // Filtro por busca
    if (searchQuery) {
      filtered = filtered.filter(expense =>
        expense.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleTogglePaid = (expenseId: string, expenseTitle: string, isPaid: boolean) => {
    if (!isPaid) {
      // Se está marcando como pago, mostrar modal para escolher data
      setSelectedExpense({ id: expenseId, title: expenseTitle });
      setPaymentDate(new Date());
      setModalVisible(true);
    } else {
      // Se está desmarcando como pago, confirmar
      Alert.alert(
        'Marcar como Pendente',
        `Deseja marcar "${expenseTitle}" como pendente?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Confirmar',
            onPress: () => markAsPaid(expenseId, false),
          },
        ]
      );
    }
  };

  const handleConfirmPayment = () => {
    if (selectedExpense && paymentDate) {
      markAsPaid(selectedExpense.id, true, paymentDate.toISOString());
      setModalVisible(false);
      setSelectedExpense(null);
      setPaymentDate(null);
    }
  };

  const renderExpenseItem = ({ item }: { item: any }) => (
    <Card style={[
      styles.expenseCard,
      item.isPaid && styles.paidExpenseCard
    ]}>
      <Card.Content>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseInfo}>
            <Ionicons
              name={getCategoryIcon(item.category) as any}
              size={24}
              color={item.isPaid ? "#4CAF50" : "#2196F3"}
            />
            <View style={styles.expenseDetails}>
              <Title style={[
                styles.expenseTitle,
                item.isPaid && styles.paidExpenseTitle
              ]}>
                {item.title}
              </Title>
              <Paragraph style={styles.expenseCategory}>
                {item.category}
              </Paragraph>
              <Paragraph style={styles.expenseDate}>
                {formatDate(item.date)}
              </Paragraph>
              {item.isPaid && item.paidAt && (
                <Paragraph style={styles.paidDate}>
                  Pago em: {formatDate(item.paidAt)}
                </Paragraph>
              )}
            </View>
          </View>
          <View style={styles.expenseAmount}>
            <Title style={[
              styles.amountText,
              item.isPaid && styles.paidAmountText
            ]}>
              {formatCurrency(item.amount)}
            </Title>
            <View style={styles.expenseIcons}>
              {item.isRecurring && (
                <Ionicons name="refresh" size={16} color="#FF9800" />
              )}
              {item.isFinancing && (
                <Ionicons name="trending-down" size={16} color="#9C27B0" />
              )}
              {item.isPaid && (
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              )}
            </View>
          </View>
        </View>

        {item.description && (
          <Paragraph style={styles.expenseDescription}>
            {item.description}
          </Paragraph>
        )}

        <View style={styles.expenseTags}>
          {item.isRecurring && (
            <Chip icon="refresh" style={styles.tag}>
              {item.recurrenceType === 'monthly' ? 'Mensal' :
               item.recurrenceType === 'weekly' ? 'Semanal' : 'Anual'}
            </Chip>
          )}
          {item.installments && (
            <Chip icon="layers" style={styles.tag}>
              {item.currentInstallment}/{item.installments}
            </Chip>
          )}
          {item.isFinancing && (
            <Chip icon="percent" style={styles.tag}>
              {item.interestRate}% juros
            </Chip>
          )}
          <Chip 
            icon={item.isPaid ? "checkmark-circle" : "time"} 
            style={[
              styles.tag,
              item.isPaid ? styles.paidTag : styles.unpaidTag
            ]}
          >
            {item.isPaid ? 'Pago' : 'Pendente'}
          </Chip>
        </View>

        <View style={styles.expenseActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleTogglePaid(item.id!, item.title, item.isPaid || false)}
          >
            <Ionicons 
              name={item.isPaid ? "close-circle" : "checkmark-circle"} 
              size={20} 
              color={item.isPaid ? "#d32f2f" : "#4CAF50"} 
            />
            <Paragraph style={[
              styles.actionText,
              { color: item.isPaid ? "#d32f2f" : "#4CAF50" }
            ]}>
              {item.isPaid ? 'Marcar Não Pago' : 'Marcar Pago'}
            </Paragraph>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('EditExpense' as never, { expense: item } as never)}
          >
            <Ionicons name="pencil" size={20} color="#2196F3" />
            <Paragraph style={styles.actionText}>Editar</Paragraph>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteExpense(item.id!, item.title)}
          >
            <Ionicons name="trash" size={20} color="#d32f2f" />
            <Paragraph style={[styles.actionText, { color: '#d32f2f' }]}>
              Excluir
            </Paragraph>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color="#ccc" />
      <Title style={styles.emptyTitle}>Nenhuma despesa encontrada</Title>
      <Paragraph style={styles.emptyText}>
        {searchQuery || selectedCategory !== 'Todas'
          ? 'Tente ajustar os filtros de busca'
          : 'Adicione sua primeira despesa para começar'}
      </Paragraph>
      {!searchQuery && selectedCategory === 'Todas' && (
        <TouchableOpacity
          style={styles.addFirstButton}
          onPress={() => navigation.navigate('AddExpense' as never)}
        >
          <Ionicons name="add" size={24} color="white" />
          <Paragraph style={styles.addFirstButtonText}>
            Adicionar Despesa
          </Paragraph>
        </TouchableOpacity>
      )}
    </View>
  );

  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Paragraph style={styles.loadingText}>Carregando despesas...</Paragraph>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header com busca e filtros */}
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Despesas</Title>
        <TouchableOpacity
          style={styles.masterRecordsButton}
          onPress={() => navigation.navigate('MasterRecords' as never)}
        >
          <Ionicons name="layers" size={20} color="white" />
          <Paragraph style={styles.masterRecordsText}>Registros Mestres</Paragraph>
        </TouchableOpacity>
        <Searchbar
          placeholder="Buscar despesas..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((cat) => (
              <Chip
                key={cat}
                selected={selectedCategory === cat}
                onPress={() => setSelectedCategory(cat)}
                style={styles.filterChip}
                mode={selectedCategory === cat ? 'flat' : 'outlined'}
              >
                {cat}
              </Chip>
            ))}
          </ScrollView>
        </View>

        <View style={styles.statusFiltersContainer}>
          <Chip
            selected={filterByStatus === 'all'}
            onPress={() => setFilterByStatus('all')}
            style={styles.statusFilterChip}
            mode={filterByStatus === 'all' ? 'flat' : 'outlined'}
            icon="format-list-bulleted"
          >
            Todas
          </Chip>
          <Chip
            selected={filterByStatus === 'unpaid'}
            onPress={() => setFilterByStatus('unpaid')}
            style={styles.statusFilterChip}
            mode={filterByStatus === 'unpaid' ? 'flat' : 'outlined'}
            icon="clock-outline"
          >
            Pendentes
          </Chip>
          <Chip
            selected={filterByStatus === 'paid'}
            onPress={() => setFilterByStatus('paid')}
            style={styles.statusFilterChip}
            mode={filterByStatus === 'paid' ? 'flat' : 'outlined'}
            icon="check-circle"
          >
            Pagas
          </Chip>
        </View>

        <View style={styles.sortContainer}>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => setMenuVisible(true)}
              >
                <Ionicons name="funnel" size={20} color="#2196F3" />
                <Paragraph style={styles.sortButtonText}>
                  Ordenar: {sortBy === 'date' ? 'Data' : sortBy === 'amount' ? 'Valor' : 'Título'}
                </Paragraph>
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color="#2196F3"
                />
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => {
                setSortBy('date');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setMenuVisible(false);
              }}
              title="Por Data"
              leadingIcon="calendar"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('amount');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setMenuVisible(false);
              }}
              title="Por Valor"
              leadingIcon="currency-brl"
            />
            <Menu.Item
              onPress={() => {
                setSortBy('title');
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setMenuVisible(false);
              }}
              title="Por Título"
              leadingIcon="text"
            />
          </Menu>
        </View>
      </View>

      {/* Lista de despesas */}
      <FlatList
        data={filteredAndSortedExpenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* FAB para adicionar despesa */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddExpense' as never)}
        color="white"
      />

      {/* Modal para escolher data de pagamento */}
      <Portal>
        <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
          <Dialog.Title>Data do Pagamento</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.modalText}>
              Quando você pagou "{selectedExpense?.title}"?
            </Text>
            {paymentDate && (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={paymentDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      setPaymentDate(selectedDate);
                    }
                  }}
                />
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setModalVisible(false)}>Cancelar</Button>
            <Button onPress={handleConfirmPayment}>Confirmar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    backgroundColor: 'white',
    padding: 16,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  masterRecordsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  masterRecordsText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchbar: {
    marginBottom: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filterChip: {
    marginRight: 8,
  },
  statusFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statusFilterChip: {
    backgroundColor: '#e0e0e0',
    borderColor: '#bdbdbd',
    borderWidth: 1,
  },
  sortContainer: {
    alignItems: 'flex-end',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  sortButtonText: {
    marginHorizontal: 8,
    color: '#2196F3',
  },
  listContainer: {
    padding: 16,
  },
  expenseCard: {
    marginBottom: 16,
    elevation: 2,
  },
  paidExpenseCard: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  expenseInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  expenseDetails: {
    marginLeft: 12,
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paidExpenseTitle: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666',
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  paidDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  paidAmountText: {
    color: '#4CAF50',
  },
  expenseIcons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  expenseDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  expenseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    marginRight: 8,
  },
  paidTag: {
    backgroundColor: '#e8f5e9',
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  unpaidTag: {
    backgroundColor: '#ffebee',
    borderColor: '#d32f2f',
    borderWidth: 1,
  },
  expenseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    color: '#666',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
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
  modalText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  datePickerContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
});

export default ExpensesScreen; 