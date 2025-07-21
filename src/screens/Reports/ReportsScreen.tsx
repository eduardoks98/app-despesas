import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity } from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { StorageService } from '../../services/storage/StorageService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { HapticService } from '../../services/haptic/HapticService';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { ChartSkeleton, CategorySkeleton, StatCardSkeleton } from '../../components/common/Skeleton';
import { Transaction, Installment } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface ReportsScreenProps {
  navigation: any;
}

interface MonthData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  transactions: number;
  installmentValue: number;
}

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
  transactions: number;
  color: string;
  icon: string;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      generateReports();
    }
  }, [transactions, installments, selectedPeriod, currentMonth]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    } else {
      setRefreshing(true);
    }
    
    const result = await ErrorHandler.withErrorHandling(
      'carregar dados para relatórios',
      async () => {
        const [transactionsData, installmentsData] = await Promise.all([
          StorageService.getTransactions(),
          StorageService.getInstallments()
        ]);
        
        setTransactions(transactionsData);
        setInstallments(installmentsData);
        
        return { transactionsData, installmentsData };
      },
      false // Não mostrar erro para o usuário - apenas loggar
    );
    
    // Se falhou, manter arrays vazios para não quebrar os cálculos
    if (!result) {
      setTransactions([]);
      setInstallments([]);
      if (!isRefresh) {
        setErrorState('Não foi possível carregar os dados dos relatórios');
      }
    } else {
      if (!isRefresh) {
        stopLoading();
      }
    }
    
    if (isRefresh) {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const generateReports = () => {
    generateMonthlyData();
    generateCategoryData();
  };

  const generateMonthlyData = () => {
    const last6Months: MonthData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const month = date.toLocaleDateString('pt-BR', { month: 'short' });
      const year = date.getFullYear();
      const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === year;
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular valor de parcelamentos para o mês
      const monthInstallmentValue = installments
        .filter(inst => inst.status === 'active')
        .reduce((sum, inst) => sum + inst.installmentValue, 0);
      
      last6Months.push({
        month,
        year,
        income,
        expenses,
        balance: income - expenses,
        transactions: monthTransactions.length,
        installmentValue: monthInstallmentValue,
      });
    }
    
    setMonthlyData(last6Months);
  };

  const generateCategoryData = () => {
    const categoryMap = new Map<string, {
      amount: number;
      transactions: number;
      type: 'income' | 'expense';
    }>();

    // Filtrar transações do período selecionado
    const currentDate = new Date();
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      
      switch (selectedPeriod) {
        case 'month':
          return tDate.getMonth() === currentDate.getMonth() && 
                 tDate.getFullYear() === currentDate.getFullYear();
        case 'quarter':
          const currentQuarter = Math.floor(currentDate.getMonth() / 3);
          const tQuarter = Math.floor(tDate.getMonth() / 3);
          return tQuarter === currentQuarter && tDate.getFullYear() === currentDate.getFullYear();
        case 'year':
          return tDate.getFullYear() === currentDate.getFullYear();
        default:
          return true;
      }
    });

    // Agrupar por categoria (apenas despesas para o gráfico)
    const expenseTransactions = periodTransactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(transaction => {
      const existing = categoryMap.get(transaction.category) || {
        amount: 0,
        transactions: 0,
        type: transaction.type
      };
      
      categoryMap.set(transaction.category, {
        amount: existing.amount + transaction.amount,
        transactions: existing.transactions + 1,
        type: transaction.type
      });
    });

    const totalExpenses = Array.from(categoryMap.values())
      .reduce((sum, cat) => sum + cat.amount, 0);

    const categoryColors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#9C88FF', '#FD79A8', '#6C5CE7', '#A29BFE', '#74B9FF'
    ];

    const categoryIcons = {
      'Alimentação': '🍔',
      'Transporte': '🚗',
      'Moradia': '🏠',
      'Saúde': '💊',
      'Educação': '📚',
      'Lazer': '🎮',
      'Compras': '🛍️',
      'Outros': '📂'
    };

    const categoryArray: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data], index) => ({
        name,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        transactions: data.transactions,
        color: categoryColors[index % categoryColors.length],
        icon: categoryIcons[name as keyof typeof categoryIcons] || '📂'
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categorias

    setCategoryData(categoryArray);
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'month':
        return currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(currentMonth.getMonth() / 3) + 1;
        return `${quarter}º Trimestre ${currentMonth.getFullYear()}`;
      case 'year':
        return currentMonth.getFullYear().toString();
      default:
        return '';
    }
  };

  const getCurrentPeriodData = () => {
    const currentDate = new Date();
    
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      
      switch (selectedPeriod) {
        case 'month':
          return tDate.getMonth() === currentDate.getMonth() && 
                 tDate.getFullYear() === currentDate.getFullYear();
        case 'quarter':
          const currentQuarter = Math.floor(currentDate.getMonth() / 3);
          const tQuarter = Math.floor(tDate.getMonth() / 3);
          return tQuarter === currentQuarter && tDate.getFullYear() === currentDate.getFullYear();
        case 'year':
          return tDate.getFullYear() === currentDate.getFullYear();
        default:
          return true;
      }
    });

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { income, expenses, balance: income - expenses, transactions: periodTransactions.length };
  };

  const renderSimpleChart = (data: MonthData[]) => {
    const maxValue = Math.max(...data.map(d => Math.max(d.income, d.expenses)));
    const chartHeight = 120;
    const chartWidth = Dimensions.get('window').width - 64;
    const barWidth = (chartWidth - 48) / data.length;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {data.map((item, index) => {
            const incomeHeight = maxValue > 0 ? (item.income / maxValue) * chartHeight : 0;
            const expenseHeight = maxValue > 0 ? (item.expenses / maxValue) * chartHeight : 0;

            return (
              <View key={index} style={[styles.barGroup, { width: barWidth }]}>
                <View style={styles.bars}>
                  <View
                    style={[
                      styles.bar,
                      styles.incomeBar,
                      { height: incomeHeight }
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.expenseBar,
                      { height: expenseHeight }
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.month}</Text>
              </View>
            );
          })}
        </View>
        
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
            <Text style={styles.legendText}>Receitas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Despesas</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryChart = () => {
    if (categoryData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>Nenhuma despesa no período</Text>
        </View>
      );
    }

    return (
      <View style={styles.categoryChart}>
        {categoryData.map((category, index) => (
          <View key={index} style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <View style={styles.categoryDetails}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryTransactions}>
                  {category.transactions} transaç{category.transactions === 1 ? 'ão' : 'ões'}
                </Text>
              </View>
            </View>
            
            <View style={styles.categoryValue}>
              <MoneyText value={category.amount} size="small" showSign={false} />
              <Text style={styles.categoryPercentage}>
                {category.percentage.toFixed(1)}%
              </Text>
            </View>
            
            <View style={styles.categoryBarContainer}>
              <View
                style={[
                  styles.categoryBar,
                  { 
                    width: `${category.percentage}%`,
                    backgroundColor: category.color
                  }
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const currentPeriodData = getCurrentPeriodData();

  const renderReportsSkeleton = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <StatCardSkeleton />
      </View>
      <Card>
        <ChartSkeleton />
      </Card>
      <Card>
        <CategorySkeleton />
        <CategorySkeleton />
        <CategorySkeleton />
      </Card>
    </ScrollView>
  );

  return (
    <Container>
      <LoadingWrapper
        loading={loading}
        error={error}
        retry={loadData}
        empty={!loading && !error && transactions.length === 0}
        emptyTitle="Nenhum dado para relatórios"
        emptyMessage="Adicione algumas transações para ver seus relatórios financeiros!"
        emptyIcon="bar-chart"
        skeleton={renderReportsSkeleton()}
      >
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Relatórios</Text>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={async () => {
                await HapticService.buttonPress();
                navigation.navigate('Export');
              }}
            >
              <Ionicons name="download" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {/* Seletor de período */}
          <View style={styles.periodSelector}>
            {[
              { key: 'month', label: 'Mês' },
              { key: 'quarter', label: 'Trimestre' },
              { key: 'year', label: 'Ano' }
            ].map(period => (
              <TouchableOpacity
                key={period.key}
                style={[
                  styles.periodButton,
                  selectedPeriod === period.key && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period.key as any)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive
                ]}>
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Resumo do período atual */}
        <Card style={styles.summaryCard}>
          <Text style={styles.periodTitle}>{getPeriodLabel()}</Text>
          
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Receitas</Text>
              <MoneyText 
                value={currentPeriodData.income} 
                size="medium" 
                style={styles.incomeText}
                showSign={false}
              />
            </View>
            
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Despesas</Text>
              <MoneyText 
                value={currentPeriodData.expenses} 
                size="medium"
                showSign={false}
              />
            </View>
          </View>
          
          <View style={styles.balanceSummary}>
            <Text style={styles.summaryLabel}>Saldo</Text>
            <MoneyText 
              value={currentPeriodData.balance} 
              size="large"
            />
          </View>
          
          <Text style={styles.transactionCount}>
            {currentPeriodData.transactions} transaç{currentPeriodData.transactions === 1 ? 'ão' : 'ões'}
          </Text>
        </Card>

        {/* Gráfico mensal */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Últimos 6 meses</Text>
            <Ionicons name="bar-chart" size={20} color={colors.primary} />
          </View>
          {renderSimpleChart(monthlyData)}
        </Card>

        {/* Gráfico de categorias */}
        <Card>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Despesas por categoria</Text>
            <Ionicons name="pie-chart" size={20} color={colors.primary} />
          </View>
          {renderCategoryChart()}
        </Card>

        {/* Insights de parcelamentos */}
        {installments.length > 0 && (
          <Card>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Parcelamentos</Text>
              <Ionicons name="card" size={20} color={colors.primary} />
            </View>
            
            <View style={styles.installmentStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {installments.filter(i => i.status === 'active').length}
                </Text>
                <Text style={styles.statLabel}>Ativos</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {installments.filter(i => i.status === 'completed').length}
                </Text>
                <Text style={styles.statLabel}>Concluídos</Text>
              </View>
              
              <View style={styles.statItem}>
                <MoneyText 
                  value={installments
                    .filter(i => i.status === 'active')
                    .reduce((sum, i) => sum + i.installmentValue, 0)
                  }
                  size="small"
                  showSign={false}
                  style={styles.statValue}
                />
                <Text style={styles.statLabel}>Mensal</Text>
              </View>
            </View>
          </Card>
        )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </LoadingWrapper>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  summaryCard: {
    marginTop: 16,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  incomeText: {
    color: colors.success,
  },
  balanceSummary: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  transactionCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  barGroup: {
    alignItems: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    gap: 2,
  },
  bar: {
    width: 8,
    borderRadius: 4,
  },
  incomeBar: {
    backgroundColor: colors.success,
  },
  expenseBar: {
    backgroundColor: colors.danger,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyChartText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryChart: {
    gap: 12,
  },
  categoryItem: {
    gap: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  categoryTransactions: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryValue: {
    alignItems: 'flex-end',
  },
  categoryPercentage: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryBarContainer: {
    height: 4,
    backgroundColor: colors.background,
    borderRadius: 2,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 2,
  },
  installmentStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: 100,
  },
});