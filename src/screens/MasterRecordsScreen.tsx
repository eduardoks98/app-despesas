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

const MasterRecordsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state, deleteExpense, updateExpense } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'recurring' | 'installments'>('all');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
    let result = Object.entries(records).map(([title, expenses]) => ({
      title,
      expenses,
      totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      isRecurring: expenses[0].isRecurring,
      isInstallment: !!expenses[0].installments,
      category: expenses[0].category,
      recurrenceType: expenses[0].recurrenceType,
      installments: expenses[0].installments,
    }));

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

  const handleEditOption = (editMode: string) => {
    if (!selectedRecord) return;
    
    console.log('Navegando para edição com modo:', editMode);
    
    navigation.navigate('EditExpense' as never, { 
      expense: selectedRecord.expenses[0],
      editMode: editMode
    } as never);
    
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
              color="#2196F3"
            />
            <View style={styles.recordDetails}>
              <Title style={styles.recordTitle}>{item.title}</Title>
              <Paragraph style={styles.recordCategory}>
                {item.category}
              </Paragraph>
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
              {formatCurrency(item.totalAmount)}
            </Title>
            <Paragraph style={styles.amountPerUnit}>
              {formatCurrency(item.totalAmount / item.expenses.length)} cada
            </Paragraph>
          </View>
        </View>

        <View style={styles.recordActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditMasterRecord(item)}
          >
            <Ionicons name="pencil" size={20} color="#2196F3" />
            <Paragraph style={styles.actionText}>Editar</Paragraph>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteMasterRecord(item)}
          >
            <Ionicons name="trash" size={20} color="#d32f2f" />
            <Paragraph style={[styles.actionText, { color: '#d32f2f' }]}>
              Excluir Todas
            </Paragraph>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="list-outline" size={64} color="#ccc" />
      <Title style={styles.emptyTitle}>Nenhum registro mestre encontrado</Title>
      <Paragraph style={styles.emptyText}>
        {searchQuery || selectedType !== 'all'
          ? 'Tente ajustar os filtros de busca'
          : 'Adicione despesas recorrentes ou parceladas para começar'}
      </Paragraph>
    </View>
  );

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
        <Title style={styles.headerTitle}>Registros Mestres</Title>
        <Paragraph style={styles.headerSubtitle}>
          Gerencie despesas recorrentes e parceladas
        </Paragraph>
      </View>

      <Searchbar
        placeholder="Buscar registros..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchbar}
      />

      <View style={styles.filtersContainer}>
        <Chip
          selected={selectedType === 'all'}
          onPress={() => setSelectedType('all')}
          style={styles.filterChip}
          mode={selectedType === 'all' ? 'flat' : 'outlined'}
        >
          Todas
        </Chip>
        <Chip
          selected={selectedType === 'recurring'}
          onPress={() => setSelectedType('recurring')}
          style={styles.filterChip}
          mode={selectedType === 'recurring' ? 'flat' : 'outlined'}
        >
          Recorrentes
        </Chip>
        <Chip
          selected={selectedType === 'installments'}
          onPress={() => setSelectedType('installments')}
          style={styles.filterChip}
          mode={selectedType === 'installments' ? 'flat' : 'outlined'}
        >
          Parceladas
        </Chip>
      </View>

      <FlatList
        data={masterRecords}
        renderItem={renderMasterRecord}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Modal de Opções de Edição */}
      <Portal>
        <Modal
          visible={showEditModal}
          onDismiss={() => {
            setShowEditModal(false);
            setSelectedRecord(null);
          }}
          contentContainerStyle={styles.modalContainer}
        >
          <Title style={styles.modalTitle}>
            Editar "{selectedRecord?.title}"
          </Title>
          
          <Paragraph style={styles.modalDescription}>
            Como deseja editar este registro?
          </Paragraph>

          <List.Item
            title="Apenas esta"
            description="Edita apenas a despesa selecionada"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            onPress={() => handleEditOption('single')}
            style={styles.modalItem}
          />

          <List.Item
            title={`Próximas (${selectedRecord?.expenses ? selectedRecord.expenses.filter((exp: Expense) => 
              new Date(exp.date) >= new Date()
            ).length : 0})`}
            description="Edita despesas futuras (a partir de hoje)"
            left={(props) => <List.Icon {...props} icon="calendar-arrow-right" />}
            onPress={() => handleEditOption('future')}
            style={styles.modalItem}
          />

          <List.Item
            title={`Todas as parcelas (${selectedRecord?.expenses.length || 0})`}
            description="Edita TODAS as parcelas (passadas, atuais e futuras)"
            left={(props) => <List.Icon {...props} icon="layers" />}
            onPress={() => handleEditOption('all_including_past')}
            style={styles.modalItem}
          />

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={() => {
                setShowEditModal(false);
                setSelectedRecord(null);
              }}
              style={styles.modalButton}
            >
              Cancelar
            </Button>
          </View>
        </Modal>
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
    padding: 20,
    backgroundColor: '#2196F3',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  searchbar: {
    margin: 16,
    elevation: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
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
  },
  modalContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    marginBottom: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  modalButton: {
    width: '45%',
  },
});

export default MasterRecordsScreen; 