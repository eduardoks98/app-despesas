import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useFinance } from '../context/FinanceContext';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state } = useFinance();

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

  const getRecentExpenses = () => {
    return state.expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  };

  const getCategoryTotals = () => {
    const categoryMap: { [key: string]: number } = {};
    state.expenses.forEach(expense => {
      categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount;
    });
    return Object.entries(categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header com resumo */}
        <LinearGradient
          colors={['#2196F3', '#1976D2']}
          style={styles.header}
        >
          <Title style={styles.headerTitle}>Controle Financeiro</Title>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Paragraph style={styles.summaryLabel}>Total Geral</Paragraph>
              <Title style={styles.summaryValue}>
                {formatCurrency(state.totalExpenses)}
              </Title>
            </View>
            <View style={styles.summaryItem}>
              <Paragraph style={styles.summaryLabel}>Este Mês</Paragraph>
              <Title style={styles.summaryValue}>
                {formatCurrency(state.monthlyExpenses)}
              </Title>
            </View>
          </View>
        </LinearGradient>

        {/* Categorias principais */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Principais Categorias</Title>
            <View style={styles.categoriesContainer}>
              {getCategoryTotals().map(([category, total]) => (
                <Chip
                  key={category}
                  icon={() => (
                    <Ionicons
                      name={getCategoryIcon(category) as any}
                      size={16}
                      color="#2196F3"
                    />
                  )}
                  style={styles.categoryChip}
                >
                  {category}: {formatCurrency(total)}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Despesas recentes */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Despesas Recentes</Title>
            {getRecentExpenses().length > 0 ? (
              getRecentExpenses().map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  style={styles.expenseItem}
                  onPress={() => {
                    Alert.alert(
                      expense.title,
                      `${expense.description || 'Sem descrição'}\n\nValor: ${formatCurrency(expense.amount)}\nData: ${formatDate(expense.date)}\nCategoria: ${expense.category}${expense.isRecurring ? '\nRecorrente: Sim' : ''}${expense.isFinancing ? '\nFinanciamento: Sim' : ''}`,
                      [
                        { text: 'OK', style: 'default' },
                        { text: 'Editar', onPress: () => {/* TODO: Implementar edição */} },
                      ]
                    );
                  }}
                >
                  <View style={styles.expenseInfo}>
                    <Ionicons
                      name={getCategoryIcon(expense.category) as any}
                      size={24}
                      color="#2196F3"
                    />
                    <View style={styles.expenseDetails}>
                      <Paragraph style={styles.expenseTitle}>
                        {expense.title}
                      </Paragraph>
                      <Paragraph style={styles.expenseCategory}>
                        {expense.category}
                      </Paragraph>
                    </View>
                  </View>
                  <View style={styles.expenseAmount}>
                    <Paragraph style={styles.amountText}>
                      {formatCurrency(expense.amount)}
                    </Paragraph>
                    {expense.isRecurring && (
                      <Ionicons name="refresh" size={16} color="#FF9800" />
                    )}
                    {expense.isFinancing && (
                      <Ionicons name="trending-down" size={16} color="#4CAF50" />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color="#ccc" />
                <Paragraph style={styles.emptyText}>
                  Nenhuma despesa registrada ainda
                </Paragraph>
                <Button
                  mode="contained"
                  onPress={() => navigation.navigate('AddExpense' as never)}
                  style={styles.addFirstButton}
                >
                  Adicionar Primeira Despesa
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* FAB para adicionar despesa */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddExpense' as never)}
        color="white"
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
    padding: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  summaryValue: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    marginBottom: 8,
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  expenseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  expenseDetails: {
    marginLeft: 12,
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  addFirstButton: {
    marginTop: 8,
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
});

export default HomeScreen; 