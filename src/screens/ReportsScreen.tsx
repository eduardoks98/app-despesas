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
} from 'react-native-paper';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';

const { width } = Dimensions.get('window');

const ReportsScreen: React.FC = () => {
  const { state } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()} de ${['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][date.getMonth()]} de ${date.getFullYear()}`;
  };

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
      r: '8',
      strokeWidth: '3',
      stroke: '#2196F3',
      fill: '#ffffff',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e0e0e0',
      strokeWidth: 1,
    },
    fillShadowGradient: '#2196F3',
    fillShadowGradientOpacity: 0.1,
  };

  const pieChartData = getExpensesByCategory.map(([category, amount], index) => ({
    name: category,
    amount,
    color: [
      '#FF6384',
      '#36A2EB',
      '#FFCE56',
      '#4BC0C0',
      '#9966FF',
      '#FF9F40',
      '#FF6384',
      '#C9CBCF',
      '#4BC0C0',
    ][index % 9],
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Controles de Período */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Período do Relatório</Title>
            
            <SegmentedButtons
              value={selectedPeriod}
              onValueChange={setSelectedPeriod}
              buttons={[
                { value: 'current', label: 'Mês Atual' },
                { value: 'custom', label: 'Personalizado' },
              ]}
              style={styles.periodSelector}
            />

            {selectedPeriod === 'custom' && (
              <View style={styles.customPeriodContainer}>
                <View style={styles.periodRow}>
                  <Paragraph style={styles.periodLabel}>Ano:</Paragraph>
                  <View style={styles.yearButtonsContainer}>
                    {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.yearButton,
                          selectedYear === year && styles.selectedYearButton
                        ]}
                        onPress={() => setSelectedYear(year)}
                      >
                        <Paragraph style={[
                          styles.yearButtonText,
                          selectedYear === year && styles.selectedYearButtonText
                        ]}>
                          {year}
                        </Paragraph>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.periodRow}>
                  <Paragraph style={styles.periodLabel}>Mês:</Paragraph>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    style={styles.monthScrollContainer}
                    contentContainerStyle={styles.monthScrollContent}
                  >
                    {[
                      { value: 0, label: 'Jan' },
                      { value: 1, label: 'Fev' },
                      { value: 2, label: 'Mar' },
                      { value: 3, label: 'Abr' },
                      { value: 4, label: 'Mai' },
                      { value: 5, label: 'Jun' },
                      { value: 6, label: 'Jul' },
                      { value: 7, label: 'Ago' },
                      { value: 8, label: 'Set' },
                      { value: 9, label: 'Out' },
                      { value: 10, label: 'Nov' },
                      { value: 11, label: 'Dez' }
                    ].map((month) => (
                      <TouchableOpacity
                        key={month.value}
                        style={[
                          styles.monthButton,
                          selectedMonth === month.value && styles.selectedMonthButton
                        ]}
                        onPress={() => setSelectedMonth(month.value)}
                      >
                        <Paragraph style={[
                          styles.monthButtonText,
                          selectedMonth === month.value && styles.selectedMonthButtonText
                        ]}>
                          {month.label}
                        </Paragraph>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Obrigações do Mês */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>
              Despesas Pendentes do Mês
              {selectedPeriod === 'custom' && (
                <Paragraph style={styles.periodInfo}>
                  {['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][selectedMonth]} {selectedYear}
                </Paragraph>
              )}
            </Title>
            <View style={styles.obligationsHeader}>
              <Ionicons name="alert-circle" size={24} color="#d32f2f" />
              <Title style={styles.obligationsTotal}>
                {formatCurrency(getCurrentMonthObligations.totalObligations)}
              </Title>
            </View>
            <Paragraph style={styles.obligationsSubtitle}>
              Total de despesas pendentes para este mês
            </Paragraph>
            
            {getCurrentMonthObligations.obligations.length > 0 ? (
              getCurrentMonthObligations.obligations.map((obligation, index) => (
                <View key={index} style={styles.obligationItem}>
                  <View style={styles.obligationInfo}>
                    <Ionicons 
                      name={
                        obligation.type === 'recurring' ? 'refresh' : 
                        obligation.type === 'financing' ? 'trending-down' : 
                        'card'
                      } 
                      size={20} 
                      color={
                        obligation.type === 'recurring' ? '#FF9800' : 
                        obligation.type === 'financing' ? '#9C27B0' : 
                        '#2196F3'
                      } 
                    />
                    <View style={styles.obligationDetails}>
                      <Paragraph style={styles.obligationTitle}>{obligation.title}</Paragraph>
                      <Paragraph style={styles.obligationCategory}>{obligation.category}</Paragraph>
                    </View>
                  </View>
                  <View style={styles.obligationAmount}>
                    <Title style={styles.obligationValue}>
                      {formatCurrency(obligation.amount)}
                    </Title>
                    <Chip style={styles.obligationChip}>
                      {obligation.type === 'recurring' ? 'Recorrente' : 
                       obligation.type === 'financing' ? 'Financiamento' : 
                       'Regular'}
                    </Chip>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Paragraph style={styles.emptyText}>
                  Nenhuma despesa pendente para este mês! 🎉
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Resumo Geral */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Resumo Geral</Title>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Ionicons name="wallet" size={24} color="#2196F3" />
                <Paragraph style={styles.summaryLabel}>Total Geral</Paragraph>
                <Title style={styles.summaryValue}>
                  {formatCurrency(state.totalExpenses)}
                </Title>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={24} color="#4CAF50" />
                <Paragraph style={styles.summaryLabel}>Este Mês</Paragraph>
                <Title style={styles.summaryValue}>
                  {formatCurrency(state.monthlyExpenses)}
                </Title>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="refresh" size={24} color="#FF9800" />
                <Paragraph style={styles.summaryLabel}>Recorrentes</Paragraph>
                <Title style={styles.summaryValue}>
                  {formatCurrency(getTotalRecurring)}
                </Title>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="trending-down" size={24} color="#9C27B0" />
                <Paragraph style={styles.summaryLabel}>Financiamentos</Paragraph>
                <Title style={styles.summaryValue}>
                  {formatCurrency(getTotalFinancing)}
                </Title>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Gráfico de Despesas por Mês */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>
              Despesas Pendentes por Mês - {selectedYear}
              {getMonthlyExpenses.totalYear > 0 && (
                <Paragraph style={styles.chartSubtitle}>
                  Total pendente do ano: {formatCurrency(getMonthlyExpenses.totalYear)}
                </Paragraph>
              )}
            </Title>
            
            {getMonthlyExpenses.maxValue > 0 ? (
              <>
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
                    <Ionicons name="trending-up" size={16} color="#4CAF50" />
                    <Paragraph style={styles.statLabel}>Maior:</Paragraph>
                    <Paragraph style={styles.statValue}>
                      {formatCurrency(getMonthlyExpenses.maxValue)}
                    </Paragraph>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="trending-down" size={16} color="#d32f2f" />
                    <Paragraph style={styles.statLabel}>Menor:</Paragraph>
                    <Paragraph style={styles.statValue}>
                      {formatCurrency(getMonthlyExpenses.minValue)}
                    </Paragraph>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="analytics" size={16} color="#2196F3" />
                    <Paragraph style={styles.statLabel}>Média:</Paragraph>
                    <Paragraph style={styles.statValue}>
                      {formatCurrency(getMonthlyExpenses.totalYear / 12)}
                    </Paragraph>
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.emptyChart}>
                <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
                <Paragraph style={styles.emptyChartText}>
                  Nenhuma despesa pendente registrada em {selectedYear}
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Gráfico de Pizza - Despesas por Categoria */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Despesas Pendentes por Categoria</Title>
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
          </Card.Content>
        </Card>

        {/* Top Categorias */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Top Categorias Pendentes</Title>
            {getExpensesByCategory.slice(0, 5).map(([category, amount], index) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.categoryColor, { backgroundColor: pieChartData[index]?.color }]} />
                  <Paragraph style={styles.categoryName}>{category}</Paragraph>
                </View>
                <View style={styles.categoryAmount}>
                  <Title style={styles.categoryValue}>
                    {formatCurrency(amount)}
                  </Title>
                  <Paragraph style={styles.categoryPercentage}>
                    {((amount / state.totalExpenses) * 100).toFixed(1)}%
                  </Paragraph>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Despesas Recorrentes */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Despesas Recorrentes Pendentes</Title>
            {getRecurringExpenses.length > 0 ? (
              getRecurringExpenses.map((expense) => (
                <View key={expense.id} style={styles.recurringItem}>
                  <View style={styles.recurringInfo}>
                    <Ionicons name="refresh" size={20} color="#FF9800" />
                    <Paragraph style={styles.recurringTitle}>{expense.title}</Paragraph>
                  </View>
                  <View style={styles.recurringDetails}>
                    <Paragraph style={styles.recurringAmount}>
                      {formatCurrency(expense.amount)}
                    </Paragraph>
                    <Chip style={styles.recurringChip}>
                      {expense.recurrenceType === 'monthly' ? 'Mensal' :
                       expense.recurrenceType === 'weekly' ? 'Semanal' : 'Anual'}
                    </Chip>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="refresh-outline" size={48} color="#ccc" />
                <Paragraph style={styles.emptyText}>
                  Nenhuma despesa recorrente registrada
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Financiamentos */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Financiamentos</Title>
            {getFinancingExpenses.length > 0 ? (
              getFinancingExpenses.map((expense) => (
                <View key={expense.id} style={styles.financingItem}>
                  <View style={styles.financingInfo}>
                    <Ionicons name="trending-down" size={20} color="#9C27B0" />
                    <Paragraph style={styles.financingTitle}>{expense.title}</Paragraph>
                  </View>
                  <View style={styles.financingDetails}>
                    <Paragraph style={styles.financingAmount}>
                      {formatCurrency(expense.amount)}
                    </Paragraph>
                    <Chip style={styles.financingChip}>
                      {expense.interestRate}% juros
                    </Chip>
                  </View>
                  {expense.monthlyAdjustment && (
                    <Paragraph style={styles.adjustmentText}>
                      Reajuste: {expense.monthlyAdjustment}% ao mês
                    </Paragraph>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trending-down-outline" size={48} color="#ccc" />
                <Paragraph style={styles.emptyText}>
                  Nenhum financiamento registrado
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Histórico de Pagamentos */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>📅 Histórico de Pagamentos</Title>
            <Paragraph style={styles.cardSubtitle}>
              Despesas pagas no período selecionado
            </Paragraph>
            
            {paidExpenses.length > 0 ? (
              <View style={styles.paymentHistory}>
                {paidExpenses.slice(0, 5).map((expense) => (
                  <View key={expense.id} style={styles.paymentItem}>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.paymentTitle}>{expense.title}</Text>
                      <Text style={styles.paymentDate}>
                        Pago em: {formatDate(expense.paidAt || '')}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(expense.amount)}
                    </Text>
                  </View>
                ))}
                {paidExpenses.length > 5 && (
                  <Text style={styles.moreItems}>
                    +{paidExpenses.length - 5} pagamentos adicionais
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.noData}>Nenhum pagamento registrado no período</Text>
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
  card: {
    margin: 16,
    marginTop: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 16,
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
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
    flex: 1,
  },
  categoryColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  categoryValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
  },
  recurringItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recurringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recurringTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  recurringDetails: {
    alignItems: 'flex-end',
  },
  recurringAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  recurringChip: {
    marginTop: 4,
  },
  financingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  financingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  financingTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  financingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financingAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#9C27B0',
  },
  financingChip: {
    marginLeft: 8,
  },
  adjustmentText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
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
  obligationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  obligationsTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginLeft: 8,
  },
  obligationsSubtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
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
    marginLeft: 8,
    flex: 1,
  },
  obligationTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  obligationCategory: {
    fontSize: 12,
    color: '#666',
  },
  obligationAmount: {
    alignItems: 'flex-end',
  },
  obligationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  obligationChip: {
    marginTop: 4,
  },
  periodSelector: {
    marginBottom: 16,
  },
  customPeriodContainer: {
    marginTop: 16,
  },
  periodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
    minWidth: 50,
  },
  yearButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
  },
  yearButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  yearButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedYearButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  selectedYearButtonText: {
    color: '#fff',
  },
  monthButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
  },
  monthButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 4,
    minWidth: 50,
    alignItems: 'center',
  },
  monthButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  selectedMonthButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  selectedMonthButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  monthScrollContainer: {
    flex: 1,
    height: 40,
  },
  monthScrollContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  periodInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
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
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  paymentHistory: {
    marginTop: 16,
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  moreItems: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  noData: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default ReportsScreen; 