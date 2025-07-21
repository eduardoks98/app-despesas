import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Card,
  Title,
  Paragraph,
  Chip,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDate, CATEGORIES, getCategoryIcon, getCategoryColor } from '../utils/formatters';

const { width } = Dimensions.get('window');

const ReportsScreen: React.FC = () => {
  const { state } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const getExpensesByCategory = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    state.expenses
      .filter(expense => !expense.isPaid) // Apenas despesas não pagas
      .forEach(expense => {
        categoryMap[expense.category] = (categoryMap[expense.category] || 0) + expense.amount;
      });
    return Object.entries(categoryMap)
      .sort(([, a], [, b]) => (b || 0) - (a || 0));
  }, [state.expenses]);

  const getMonthlyExpenses = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    // Inicializa todos os meses com 0
    months.forEach((month, index) => {
      monthlyData[month] = 0;
    });

    // Filtra despesas pelo ano selecionado e apenas não pagas
    const filteredExpenses = state.expenses.filter(expense => {
      const date = new Date(expense.date);
      return date.getFullYear() === selectedYear && !expense.isPaid;
    });

    // Calcula totais por mês
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthName = months[date.getMonth()];
      if (monthName && monthlyData[monthName] !== undefined) {
        monthlyData[monthName] += expense.amount;
      }
    });

    // Encontra o valor máximo para normalização
    const maxValue = Math.max(...Object.values(monthlyData));
    const minValue = Math.min(...Object.values(monthlyData).filter(v => v > 0));

    return {
      labels: months,
      datasets: [{
        data: months.map(month => monthlyData[month] || 0),
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
        strokeWidth: 3,
      }],
      maxValue,
      minValue,
      totalYear: Object.values(monthlyData).reduce((sum, value) => sum + value, 0),
    };
  }, [state.expenses, selectedYear]);

  const getRecurringExpenses = useMemo(() => {
    return state.expenses.filter(expense => expense.isRecurring && !expense.isPaid);
  }, [state.expenses]);

  const getFinancingExpenses = useMemo(() => {
    return state.expenses.filter(expense => expense.isFinancing && !expense.isPaid);
  }, [state.expenses]);

  const getTotalRecurring = useMemo(() => {
    return getRecurringExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [getRecurringExpenses]);

  const getTotalFinancing = useMemo(() => {
    return getFinancingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [getFinancingExpenses]);

  // Calcula o que você deve no mês selecionado
  const getCurrentMonthObligations = useMemo(() => {
    const targetMonth = selectedPeriod === 'current' ? new Date().getMonth() : selectedMonth;
    const targetYear = selectedPeriod === 'current' ? new Date().getFullYear() : selectedYear;
    
    let totalObligations = 0;
    const obligations: Array<{
      title: string;
      amount: number;
      type: 'recurring' | 'financing' | 'regular';
      category: string;
    }> = [];

    // TODAS as despesas NÃO PAGAS do mês selecionado
    state.expenses
      .filter(expense => !expense.isPaid) // Apenas despesas não pagas
      .forEach(expense => {
        const expenseDate = new Date(expense.date);
        if (expenseDate.getMonth() === targetMonth && expenseDate.getFullYear() === targetYear) {
          let currentAmount = expense.amount;
          let type: 'recurring' | 'financing' | 'regular' = 'regular';
          
          // Se é despesa recorrente
          if (expense.isRecurring) {
            type = 'recurring';
          }
          // Se é financiamento, calcula o valor atual
          else if (expense.isFinancing) {
            type = 'financing';
            
            // Se tem ajuste mensal, calcula o valor atual
            if (expense.monthlyAdjustment && expense.currentInstallment) {
              const months = expense.currentInstallment;
              const adjustment = expense.monthlyAdjustment / 100;
              
              // Calcula prestação inicial
              const principal = expense.amount;
              const rate = (expense.interestRate || 0) / 100;
              const periods = expense.installments || 1;
              
              let monthlyPayment = principal;
              if (rate > 0) {
                monthlyPayment = principal * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1);
              } else {
                monthlyPayment = principal / periods;
              }
              
              // Aplica redução mensal
              for (let i = 0; i < months; i++) {
                monthlyPayment = monthlyPayment * (1 - adjustment);
              }
              
              currentAmount = monthlyPayment;
            }
          }
          
          totalObligations += currentAmount;
          obligations.push({
            title: expense.title,
            amount: currentAmount,
            type,
            category: expense.category,
          });
        }
      });

    return { totalObligations, obligations };
  }, [state.expenses, selectedPeriod, selectedMonth, selectedYear]);

  const paidExpenses = useMemo(() => {
    return state.expenses.filter(expense => {
      if (!expense.isPaid || !expense.paidAt) return false;
      
      const paidDate = new Date(expense.paidAt);
      const selectedDate = new Date(selectedYear, selectedMonth - 1);
      
      return paidDate.getFullYear() === selectedYear && 
             paidDate.getMonth() === selectedMonth - 1;
    });
  }, [state.expenses, selectedYear, selectedMonth]);

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#2196F3',
    },
  };

  const pieChartData = getExpensesByCategory.map(([category, amount], index) => ({
    name: category,
    amount,
    color: getCategoryColor(category),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  if (state.loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Paragraph style={styles.loadingText}>Carregando relatórios...</Paragraph>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Title style={styles.headerTitle}>Relatórios</Title>
        <Paragraph style={styles.headerSubtitle}>
          Análise detalhada dos seus gastos
        </Paragraph>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Seletor de Período */}
        <Card style={styles.periodCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Período de Análise</Title>
            <SegmentedButtons
              value={selectedPeriod}
              onValueChange={setSelectedPeriod as any}
              buttons={[
                { value: 'current', label: 'Mês Atual' },
                { value: 'custom', label: 'Personalizado' },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Resumo Geral */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Resumo Geral</Title>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Ionicons name="wallet" size={24} color="#2196F3" />
                <Text style={styles.summaryLabel}>Total Pendente</Text>
                <Title style={styles.summaryValue}>
                  {formatCurrency(state.totalExpenses)}
                </Title>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="refresh" size={24} color="#FF9800" />
                <Text style={styles.summaryLabel}>Recorrentes</Text>
                <Title style={styles.summaryValue}>
                  {formatCurrency(getTotalRecurring)}
                </Title>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="trending-down" size={24} color="#9C27B0" />
                <Text style={styles.summaryLabel}>Financiamentos</Text>
                <Title style={styles.summaryValue}>
                  {formatCurrency(getTotalFinancing)}
                </Title>
              </View>
              
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.summaryLabel}>Pagas Este Mês</Text>
                <Title style={styles.summaryValue}>
                  {formatCurrency(paidExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                </Title>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Gráfico de Gastos por Categoria */}
        {getExpensesByCategory.length > 0 && (
          <Card style={styles.chartCard}>
            <Card.Content>
              <Title style={styles.cardTitle}>Gastos por Categoria</Title>
              <PieChart
                data={pieChartData}
                width={width - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
              <View style={styles.categoryLegend}>
                {getExpensesByCategory.slice(0, 5).map(([category, amount]) => (
                  <View key={category} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: getCategoryColor(category) }]} />
                    <Text style={styles.legendText}>{category}</Text>
                    <Text style={styles.legendAmount}>{formatCurrency(amount)}</Text>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Gráfico de Gastos Mensais */}
        <Card style={styles.chartCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Evolução Mensal ({selectedYear})</Title>
            <LineChart
              data={getMonthlyExpenses}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
            <View style={styles.chartStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total do Ano</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(getMonthlyExpenses.totalYear)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Média Mensal</Text>
                <Text style={styles.statValue}>
                  {formatCurrency(getMonthlyExpenses.totalYear / 12)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Obrigações do Mês */}
        <Card style={styles.obligationsCard}>
          <Card.Content>
            <Title style={styles.cardTitle}>Obrigações do Mês</Title>
            <Title style={styles.totalObligations}>
              {formatCurrency(getCurrentMonthObligations.totalObligations)}
            </Title>
            
            {getCurrentMonthObligations.obligations.map((obligation, index) => (
              <View key={index} style={styles.obligationItem}>
                <View style={styles.obligationInfo}>
                  <Ionicons 
                    name={getCategoryIcon(obligation.category) as any} 
                    size={20} 
                    color={getCategoryColor(obligation.category)} 
                  />
                  <View style={styles.obligationDetails}>
                    <Text style={styles.obligationTitle}>{obligation.title}</Text>
                    <Text style={styles.obligationCategory}>{obligation.category}</Text>
                  </View>
                </View>
                <View style={styles.obligationAmount}>
                  <Text style={styles.obligationValue}>
                    {formatCurrency(obligation.amount)}
                  </Text>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.obligationType,
                      { 
                        borderColor: obligation.type === 'recurring' ? '#FF9800' : 
                                    obligation.type === 'financing' ? '#9C27B0' : '#2196F3' 
                      }
                    ]}
                    textStyle={{ 
                      color: obligation.type === 'recurring' ? '#FF9800' : 
                             obligation.type === 'financing' ? '#9C27B0' : '#2196F3' 
                    }}
                  >
                    {obligation.type === 'recurring' ? 'Recorrente' : 
                     obligation.type === 'financing' ? 'Financiamento' : 'Regular'}
                  </Chip>
                </View>
              </View>
            ))}
            
            {getCurrentMonthObligations.obligations.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.emptyText}>Nenhuma obrigação pendente!</Text>
              </View>
            )}
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
    paddingBottom: 90,
  },
  header: {
    padding: 16,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    paddingTop: 50, // Adjust for safe area
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  periodCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  segmentedButtons: {
    marginTop: 16,
  },
  summaryCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  chartCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#333',
    marginRight: 8,
  },
  legendAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  obligationsCard: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  totalObligations: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
    textAlign: 'center',
  },
  obligationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  obligationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  obligationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  obligationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  obligationCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  obligationAmount: {
    alignItems: 'flex-end',
  },
  obligationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  obligationType: {
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
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
  chartStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
});

export default ReportsScreen; 