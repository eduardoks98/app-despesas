import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  Searchbar,
  SegmentedButtons,
  FAB,
  ActivityIndicator,
  Menu,
  Divider,
  Modal,
  Portal,
  Button,
  List,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFinance, Expense } from '../context/FinanceContext';
import { formatCurrencyFromReais, getCategoryIcon, getCategoryColor } from '../utils/formatters';

const MasterRecordsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, deleteExpense, updateExpense } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'recurring' | 'installments'>('all');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Agrupar despesas por título base (removendo sufixos de parcela)
  const masterRecords = useMemo(() => {
    const records: { [key: string]: Expense[] } = {};
    
    console.log('Processando despesas para registros mestres:', state.expenses.length);
    
    state.expenses.forEach(expense => {
      if (expense.isRecurring || expense.installments) {
        // Remover sufixos como "(1/12)", "(2/12)", etc.
        const baseTitle = expense.title.replace(/\s*\(\d+\/\d+\)$/, '');
        
        console.log('Despesa:', expense.title, '→ Título base:', baseTitle);
        
        if (!records[baseTitle]) {
          records[baseTitle] = [];
        }
        records[baseTitle].push(expense);
      }
    });

    console.log('Registros mestres encontrados:', Object.keys(records));

    // Converter para array e filtrar
    let result = Object.entries(records).map(([title, expenses]) => {
      const firstExpense = expenses[0];
      if (!firstExpense) return null;
      
      let totalAmount: number;
      
      if (firstExpense.installments && firstExpense.installments > 1) {
        // Para despesas parceladas: valor total = valor de uma parcela × número de parcelas
        const installmentAmount = firstExpense.amount; // Valor já está em centavos
        totalAmount = (installmentAmount * firstExpense.installments) / 100; // Converter para reais
        console.log(`Despesa parcelada "${title}": valor parcela=${installmentAmount}, parcelas=${firstExpense.installments}, total=${totalAmount}`);
      } else {
        // Para despesas recorrentes: valor total = valor de cada parcela
        totalAmount = firstExpense.amount / 100; // Converter de centavos para reais
        console.log(`Despesa recorrente "${title}": valor=${totalAmount}`);
      }
      
      return {
        title,
        expenses,
        totalAmount,
        isRecurring: firstExpense.isRecurring,
        isInstallment: !!firstExpense.installments,
        category: firstExpense.category,
        recurrenceType: firstExpense.recurrenceType,
        installments: firstExpense.installments,
      };
    }).filter((record): record is NonNullable<typeof record> => record !== null); // Remove entradas null

    // Filtrar por tipo
    if (selectedType === 'recurring') {
      result = result.filter(record => record.isRecurring && !record.isInstallment);
    } else if (selectedType === 'installments') {
      result = result.filter(record => record.isInstallment);
    }

    // Filtrar por busca
    if (searchQuery) {
      result = result.filter(record =>
        record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    console.log('Resultado final:', result.length, 'registros mestres');
    return result;
  }, [state.expenses, searchQuery, selectedType]);

  const handleDeleteMasterRecord = (record: any) => {
    const type = record.isInstallment ? 'parcelas' : 'mensalidades';
    const count = record.expenses.length;
    
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir todas as ${count} ${type} de "${record.title}"?\n\nEsta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Todas',
          style: 'destructive',
          onPress: () => {
            record.expenses.forEach((expense: Expense) => {
              deleteExpense(expense.id!);
            });
          },
        },
      ]
    );
  };

  const handleEditMasterRecord = (record: any) => {
    console.log('Editando registro mestre:', record.title);
    console.log('Despesas disponíveis:', record.expenses.length);
    
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const getEditOptions = (record: any) => {
    if (!record) return [];
    
    const totalExpenses = record.expenses.length;
    const currentDate = new Date();
    
    // Encontrar a parcela atual (baseada na data)
    const currentExpenseIndex = record.expenses.findIndex((expense: any) => 
      new Date(expense.date) >= currentDate
    );
    
    const futureExpenses = currentExpenseIndex >= 0 
      ? totalExpenses - currentExpenseIndex 
      : 0;
    
    const pastExpenses = currentExpenseIndex >= 0 
      ? currentExpenseIndex 
      : totalExpenses;

    return [
      {
        id: 'single',
        title: 'Editar apenas esta parcela',
        description: `Modificar apenas a parcela selecionada (1 ${record.isInstallment ? 'parcela' : 'registro'})`,
        icon: 'pencil',
        count: 1
      },
      {
        id: 'future',
        title: 'Editar parcelas futuras',
        description: `Modificar esta e todas as parcelas futuras (${futureExpenses} ${record.isInstallment ? 'parcelas' : 'registros'})`,
        icon: 'calendar',
        count: futureExpenses
      },
      {
        id: 'all',
        title: 'Editar todas as parcelas',
        description: `Modificar todas as parcelas (${totalExpenses} ${record.isInstallment ? 'parcelas' : 'registros'})`,
        icon: 'layers',
        count: totalExpenses
      },
      {
        id: 'all_including_past',
        title: 'Recrear todas as parcelas',
        description: `Excluir todas e criar novas parcelas (${totalExpenses} ${record.isInstallment ? 'parcelas' : 'registros'})`,
        icon: 'refresh',
        count: totalExpenses
      }
    ];
  };

  const handleEditOption = (editMode: string) => {
    if (!selectedRecord) return;
    
    console.log('Navegando para edição com modo:', editMode);
    
    // Criar um objeto que representa a despesa mestre com o valor total
    const firstExpense = selectedRecord.expenses[0];
    const masterExpense = {
      ...firstExpense,
      // Para despesas parceladas, usar o valor total em vez do valor da parcela
      amount: selectedRecord.isInstallment 
        ? Math.round(selectedRecord.totalAmount * 100) // Converter de volta para centavos
        : firstExpense.amount,
    };
    
    console.log('Master expense para edição:', {
      originalAmount: firstExpense.amount,
      totalAmount: selectedRecord.totalAmount,
      masterAmount: masterExpense.amount
    });
    
    navigation.navigate('EditExpense' as never, { 
      expense: masterExpense,
      editMode: editMode
    } as any);
    
    setShowEditModal(false);
    setSelectedRecord(null);
  };

  const renderMasterRecord = ({ item }: { item: any }) => (
    <Card style={styles.recordCard}>
      <Card.Content>
        <View style={styles.recordHeader}>
          <View style={styles.recordInfo}>
            <Ionicons
              name={getCategoryIcon(item.category) as any}
              size={24}
              color={getCategoryColor(item.category)}
            />
            <View style={styles.recordDetails}>
              <Title style={styles.recordTitle}>{item.title}</Title>
              <Text style={styles.recordCategory}>
                {item.category}
              </Text>
              <View style={styles.recordTags}>
                {item.isInstallment ? (
                  <Chip icon="layers" style={styles.tag}>
                    {item.installments} parcelas
                  </Chip>
                ) : (
                  <Chip icon="refresh" style={styles.tag}>
                    {item.recurrenceType === 'monthly' ? 'Mensal' :
                     item.recurrenceType === 'weekly' ? 'Semanal' : 'Anual'}
                  </Chip>
                )}
                <Chip icon="calendar" style={styles.tag}>
                  {item.expenses.length} registros
                </Chip>
              </View>
            </View>
          </View>
          <View style={styles.recordAmount}>
            <Title style={styles.amountText}>
              {formatCurrencyFromReais(item.totalAmount)}
            </Title>
            <Text style={styles.amountPerUnit}>
              {item.isInstallment 
                ? `${formatCurrencyFromReais(item.totalAmount / (item.installments || 1))} por parcela`
                : `${formatCurrencyFromReais(item.totalAmount)} por ${item.recurrenceType === 'monthly' ? 'mês' : 
                   item.recurrenceType === 'weekly' ? 'semana' : 'ano'}`
              }
            </Text>
          </View>
        </View>

        <View style={styles.recordActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditMasterRecord(item)}
          >
            <Ionicons name="pencil" size={20} color="#2196F3" />
            <Text style={styles.actionText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteMasterRecord(item)}
          >
            <Ionicons name="trash" size={20} color="#d32f2f" />
            <Text style={[styles.actionText, { color: '#d32f2f' }]}>
              Excluir Todas
            </Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color="#ccc" />
      <Title style={styles.emptyTitle}>Nenhum registro mestre encontrado</Title>
      <Text style={styles.emptyText}>
        {searchQuery || selectedType !== 'all'
          ? 'Tente ajustar os filtros de busca'
          : 'Adicione despesas recorrentes ou parceladas para começar'}
      </Text>
    </View>
  );

  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Registros Mestres</Title>
        <Text style={styles.headerSubtitle}>
          Gerencie despesas recorrentes e parceladas
        </Text>
      </View>

      <Searchbar
        placeholder="Buscar registros..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <Card style={styles.filtersCard}>
        <Card.Content>
          <SegmentedButtons
            value={selectedType}
            onValueChange={setSelectedType as any}
            buttons={[
              { value: 'all', label: 'Todas' },
              { value: 'recurring', label: 'Recorrentes' },
              { value: 'installments', label: 'Parceladas' },
            ]}
            style={styles.segmentedButtons}
          />
        </Card.Content>
      </Card>

      <FlatList
        data={masterRecords}
        renderItem={renderMasterRecord}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyState}
      />

      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => setShowEditModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>Editar Registro Mestre</Title>
          <Text style={styles.modalSubtitle}>
            Como você gostaria de editar "{selectedRecord?.title}"?
          </Text>
          
          {getEditOptions(selectedRecord).map((option: any) => (
            <List.Item
              key={option.id}
              title={option.title}
              description={option.description}
              left={(props) => <List.Icon {...props} icon={option.icon as any} />}
              onPress={() => handleEditOption(option.id)}
              style={styles.modalItem}
            />
          ))}
          
          <View style={styles.modalActions}>
            <Button onPress={() => setShowEditModal(false)}>Cancelar</Button>
          </View>
        </Modal>
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
    color: '#666',
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
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 4,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listContainer: {
    padding: 16,
  },
  recordCard: {
    marginBottom: 16,
    elevation: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  recordInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  recordDetails: {
    marginLeft: 12,
    flex: 1,
  },
  recordTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recordCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  recordTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    marginRight: 8,
    marginBottom: 4,
  },
  recordAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  amountPerUnit: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  recordActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
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
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalItem: {
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
});

export default MasterRecordsScreen; 