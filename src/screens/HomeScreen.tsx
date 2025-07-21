import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Text,
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
import { formatCurrency, formatDate, getCategoryIcon, getCategoryColor } from '../utils/formatters';
import ExpenseCard from '../components/ExpenseCard';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state } = useFinance();

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

        {/* Ações rápidas */}
        <Card style={styles.quickActionsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Ações Rápidas</Title>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('AddExpense' as never)}
              >
                <Ionicons name="add-circle" size={32} color="#2196F3" />
                <Text style={styles.quickActionText}>Nova Despesa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Expenses' as never)}
              >
                <Ionicons name="list" size={32} color="#4CAF50" />
                <Text style={styles.quickActionText}>Ver Todas</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Reports' as never)}
              >
                <Ionicons name="analytics" size={32} color="#FF9800" />
                <Text style={styles.quickActionText}>Relatórios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('MasterRecords' as never)}
              >
                <Ionicons name="layers" size={32} color="#9C27B0" />
                <Text style={styles.quickActionText}>Registros Mestres</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Top categorias */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Top Categorias</Title>
            {getCategoryTotals().map(([category, total]) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <Ionicons 
                    name={getCategoryIcon(category) as any} 
                    size={24} 
                    color={getCategoryColor(category)} 
                  />
                  <Text style={styles.categoryName}>{category}</Text>
                </View>
                <Title style={styles.categoryAmount}>
                  {formatCurrency(total)}
                </Title>
              </View>
            ))}
            {getCategoryTotals().length === 0 && (
              <Paragraph style={styles.emptyText}>
                Nenhuma despesa registrada ainda
              </Paragraph>
            )}
          </Card.Content>
        </Card>

        {/* Despesas recentes */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.recentHeader}>
              <Title style={styles.cardTitle}>Despesas Recentes</Title>
              <TouchableOpacity
                onPress={() => navigation.navigate('Expenses' as never)}
              >
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
            
            {getRecentExpenses().map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                variant="compact"
                showActions={false}
                onPress={() => navigation.navigate('EditExpense' as never, { expense } as any)}
              />
            ))}
            
            {getRecentExpenses().length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>
                  Nenhuma despesa recente
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Resumo de status */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Status das Despesas</Title>
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <Chip icon="clock" style={styles.pendingChip}>
                  Pendentes
                </Chip>
                <Title style={styles.statusCount}>
                  {state.expenses.filter(e => !e.isPaid).length}
                </Title>
              </View>
              <View style={styles.statusItem}>
                <Chip icon="checkmark-circle" style={styles.paidChip}>
                  Pagas
                </Chip>
                <Title style={styles.statusCount}>
                  {state.expenses.filter(e => e.isPaid).length}
                </Title>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    alignItems: 'center',
    paddingTop: 50,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  quickActionsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#333',
  },
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2196F3',
    textDecorationLine: 'underline',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statusItem: {
    alignItems: 'center',
  },
  pendingChip: {
    backgroundColor: '#FFEB3B',
    color: '#333',
  },
  paidChip: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  statusCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default HomeScreen; 