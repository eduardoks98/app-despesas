import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Modal, Animated } from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MoneyText } from '../../components/common/MoneyText';
import { DatePicker } from '../../components/common/DatePicker';
import { StorageService } from '../../services/storage/StorageService';
import { ErrorHandler } from '../../services/error/ErrorHandler';
import { HapticService } from '../../services/haptic/HapticService';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { ChartSkeleton, CategorySkeleton, StatCardSkeleton } from '../../components/common/Skeleton';
import { Transaction, Installment, Subscription } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, isSameMonth, isSameYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  subscriptionValue: number;
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [showFilters, setShowFilters] = useState(true);
  const filterAnimation = useRef(new Animated.Value(1)).current;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showCustomPeriodModal, setShowCustomPeriodModal] = useState(false);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [showEndDateModal, setShowEndDateModal] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      console.log('🔄 Gerando relatórios para período:', selectedPeriod, 'data:', currentMonth.toISOString());
      generateReports();
    }
  }, [transactions, installments, subscriptions, selectedPeriod, currentMonth, customStartDate, customEndDate]);

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    } else {
      setRefreshing(true);
    }
    
    const result = await ErrorHandler.withErrorHandling(
      'carregar dados para relatórios',
      async () => {
        const [transactionsData, installmentsData, subscriptionsData] = await Promise.all([
          StorageService.getTransactions(),
          StorageService.getInstallments(),
          StorageService.getSubscriptions()
        ]);
        
        setTransactions(transactionsData);
        setInstallments(installmentsData);
        setSubscriptions(subscriptionsData);
        
        return { transactionsData, installmentsData, subscriptionsData };
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

  const navigatePeriod = (direction: 'next' | 'prev') => {
    const multiplier = direction === 'next' ? 1 : -1;
    
    switch (selectedPeriod) {
      case 'month':
        setCurrentMonth(addMonths(currentMonth, multiplier));
        break;
      case 'quarter':
        setCurrentMonth(addMonths(currentMonth, multiplier * 3));
        break;
      case 'year':
        setCurrentMonth(addMonths(currentMonth, multiplier * 12));
        break;
      case 'custom':
        // Para período customizado, ajustar as datas
        setCustomStartDate(addMonths(customStartDate, multiplier));
        setCustomEndDate(addMonths(customEndDate, multiplier));
        break;
    }
  };

  const openCustomPeriodModal = () => {
    setShowCustomPeriodModal(true);
  };

  const closeCustomPeriodModal = () => {
    setShowCustomPeriodModal(false);
  };

  const confirmCustomPeriod = () => {
    setSelectedPeriod('custom');
    closeCustomPeriodModal();
  };

  const isCurrentPeriod = () => {
    const now = new Date();
    
    switch (selectedPeriod) {
      case 'month':
        return isSameMonth(currentMonth, now) && isSameYear(currentMonth, now);
      case 'quarter':
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const selectedQuarter = Math.floor(currentMonth.getMonth() / 3);
        return selectedQuarter === currentQuarter && isSameYear(currentMonth, now);
      case 'year':
        return isSameYear(currentMonth, now);
      case 'custom':
        return false; // Período customizado nunca é "atual"
      default:
        return false;
    }
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
      
      // Calcular apenas despesas diretas (não pagamentos de parcelamentos/assinaturas)
      const expenses = monthTransactions
        .filter(t => t.type === 'expense' && !t.installmentId && !t.subscriptionId)
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular apenas PAGAMENTOS efetivos de parcelamentos no mês
      const monthInstallmentValue = installments
        .reduce((sum, inst) => {
          const startDate = new Date(inst.startDate);
          
          // Para cada parcela paga, verificar se foi paga neste mês
          return sum + inst.paidInstallments.reduce((paidSum, paidNumber) => {
            const paidDate = new Date(startDate);
            paidDate.setMonth(paidDate.getMonth() + paidNumber - 1);
            
            // Se a parcela foi paga neste mês específico
            if (paidDate.getMonth() === date.getMonth() && 
                paidDate.getFullYear() === year) {
              return paidSum + inst.installmentValue;
            }
            return paidSum;
          }, 0);
        }, 0);
      
      // Adicionar pagamentos de assinaturas do mês (se registradas como transações)
      const monthSubscriptionValue = monthTransactions
        .filter(t => t.subscriptionId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Total de despesas incluindo apenas pagamentos efetivos
      const totalExpenses = expenses + monthInstallmentValue + monthSubscriptionValue;
      
      last6Months.push({
        month,
        year,
        income,
        expenses: totalExpenses,
        balance: income - totalExpenses,
        transactions: monthTransactions.length,
        installmentValue: monthInstallmentValue,
        subscriptionValue: monthSubscriptionValue,
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
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      
      switch (selectedPeriod) {
        case 'month':
          return tDate.getMonth() === currentMonth.getMonth() && 
                 tDate.getFullYear() === currentMonth.getFullYear();
        case 'quarter':
          const selectedQuarter = Math.floor(currentMonth.getMonth() / 3);
          const tQuarter = Math.floor(tDate.getMonth() / 3);
          return tQuarter === selectedQuarter && tDate.getFullYear() === currentMonth.getFullYear();
        case 'year':
          return tDate.getFullYear() === currentMonth.getFullYear();
        case 'custom':
          return tDate >= customStartDate && tDate <= customEndDate;
        default:
          return true;
      }
    });

    // Agrupar por categoria (apenas despesas para o gráfico)
    const expenseTransactions = periodTransactions.filter(t => t.type === 'expense');
    
    expenseTransactions.forEach(transaction => {
      // Determinar a categoria correta
      let category = transaction.category;
      
      // Se é transação de parcelamento, agrupar como "Parcelamentos"
      if (transaction.installmentId) {
        category = 'Parcelamentos';
      }
      // Se é transação de assinatura, agrupar como "Assinaturas" 
      else if (transaction.subscriptionId) {
        category = 'Assinaturas';
      }
      
      const existing = categoryMap.get(category) || {
        amount: 0,
        transactions: 0,
        type: transaction.type
      };
      
      categoryMap.set(category, {
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

    // Cores específicas para categorias
    const specificCategoryColors: Record<string, string> = {
      'Assinaturas': '#74B9FF', // Azul para assinaturas
      'Parcelamentos': '#FD79A8', // Rosa para parcelamentos
    };

    const categoryIcons = {
      'Alimentação': '🍔',
      'Transporte': '🚗',
      'Moradia': '🏠',
      'Saúde': '💊',
      'Educação': '📚',
      'Lazer': '🎮',
      'Compras': 'cart',
      'Assinaturas': 'repeat',
      'Parcelamentos': 'card',
      'Outros': '📂'
    };

    const categoryArray: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data], index) => ({
        name,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        transactions: data.transactions,
        color: specificCategoryColors[name] || categoryColors[index % categoryColors.length] || '#96CEB4',
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
      case 'custom':
        return `${format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} - ${format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}`;
      default:
        return '';
    }
  };

  const getCurrentPeriodData = () => {
    console.log('📊 Calculando dados do período:', selectedPeriod, 'data:', currentMonth.toISOString());
    
    const periodTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      
      switch (selectedPeriod) {
        case 'month':
          return tDate.getMonth() === currentMonth.getMonth() && 
                 tDate.getFullYear() === currentMonth.getFullYear();
        case 'quarter':
          const selectedQuarter = Math.floor(currentMonth.getMonth() / 3);
          const tQuarter = Math.floor(tDate.getMonth() / 3);
          return tQuarter === selectedQuarter && tDate.getFullYear() === currentMonth.getFullYear();
        case 'year':
          return tDate.getFullYear() === currentMonth.getFullYear();
        case 'custom':
          return tDate >= customStartDate && tDate <= customEndDate;
        default:
          return true;
      }
    });
    
    console.log('📈 Transações filtradas:', periodTransactions.length);

    const income = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calcular despesas regulares (excluindo pagamentos de parcelamentos e assinaturas para evitar dupla contagem)
    const regularExpenses = periodTransactions
      .filter(t => t.type === 'expense' && !t.installmentId && !t.subscriptionId)
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular apenas PAGAMENTOS de parcelamentos efetivamente pagos no período (através das transações)
    const periodInstallments = periodTransactions
      .filter(t => t.installmentId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular apenas PAGAMENTOS de assinaturas efetivamente pagos no período (através das transações)
    const periodSubscriptions = periodTransactions
      .filter(t => t.subscriptionId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = regularExpenses + periodInstallments + periodSubscriptions;

    console.log('💰 Resultados do período:', {
      income,
      expenses: totalExpenses,
      balance: income - totalExpenses,
      transactions: periodTransactions.length,
      installmentExpenses: periodInstallments,
      subscriptionExpenses: periodSubscriptions
    });

    return { 
      income, 
      expenses: totalExpenses,
      regularExpenses,
      balance: income - totalExpenses, 
      transactions: periodTransactions.length,
      installmentExpenses: periodInstallments,
      subscriptionExpenses: periodSubscriptions
    };
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
            <View style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View style={[
                  styles.categoryIconContainer,
                  { backgroundColor: category.color + '20' }
                ]}>
                  {category.name === 'Assinaturas' || category.name === 'Parcelamentos' || category.name === 'Compras' ? (
                    <Ionicons 
                      name={category.icon as any} 
                      size={20} 
                      color={category.color} 
                    />
                  ) : (
                    <Text style={[styles.categoryIcon, { color: category.color }]}>{category.icon}</Text>
                  )}
                </View>
                <View style={styles.categoryDetails}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryTransactions}>
                    {category.transactions} item{category.transactions === 1 ? '' : 's'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.categoryValue}>
                <MoneyText value={-category.amount} size="medium" showSign={false} style={styles.categoryAmount} />
                <Text style={[styles.categoryPercentage, { color: category.color }]}>
                  {category.percentage.toFixed(1)}%
                </Text>
              </View>
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
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.filterToggleButton}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setShowFiltersModal(true);
                }}
              >
                <Ionicons 
                  name="filter" 
                  size={20} 
                  color={colors.primary} 
                />
              </TouchableOpacity>
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
                value={-currentPeriodData.expenses} 
                size="medium"
                showSign={false}
              />
            </View>
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


          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Modal de Período Personalizado */}
        <Modal
          visible={showCustomPeriodModal}
          transparent
          animationType="slide"
          onRequestClose={closeCustomPeriodModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Período Personalizado</Text>
                <TouchableOpacity onPress={() => closeCustomPeriodModal()}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDateModal(true)}
                >
                  <Text style={styles.datePickerLabel}>Data Inicial</Text>
                  <Text style={styles.datePickerValue}>
                    {format(customStartDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDateModal(true)}
                >
                  <Text style={styles.datePickerLabel}>Data Final</Text>
                  <Text style={styles.datePickerValue}>
                    {format(customEndDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <View style={styles.periodPreview}>
                  <Text style={styles.periodPreviewLabel}>Período Selecionado:</Text>
                  <Text style={styles.periodPreviewText}>
                    {format(customStartDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} - {format(customEndDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <Button
                    title="Cancelar"
                    onPress={() => closeCustomPeriodModal()}
                    variant="outline"
                    style={styles.modalButton}
                  />
                  <Button
                    title="Confirmar"
                    onPress={() => confirmCustomPeriod()}
                    style={styles.modalButton}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Modal de Data Inicial */}
        <Modal
          visible={showStartDateModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowStartDateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Data Inicial</Text>
                <TouchableOpacity onPress={() => setShowStartDateModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalScrollView}>
                <DatePicker
                  value={customStartDate}
                  onChange={(date) => {
                    setCustomStartDate(date);
                    setShowStartDateModal(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Data Final */}
        <Modal
          visible={showEndDateModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEndDateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Selecionar Data Final</Text>
                <TouchableOpacity onPress={() => setShowEndDateModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalScrollView}>
                <DatePicker
                  value={customEndDate}
                  onChange={(date) => {
                    setCustomEndDate(date);
                    setShowEndDateModal(false);
                  }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Filtros */}
        <Modal
          visible={showFiltersModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFiltersModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filtros de Relatório</Text>
                <TouchableOpacity onPress={() => setShowFiltersModal(false)}>
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalScrollView}>
                <View style={styles.filtersHeader}>
                  <Text style={styles.filtersTitle}>Período dos Relatórios</Text>
                  <TouchableOpacity 
                    onPress={async () => {
                      await HapticService.buttonPress();
                      setSelectedPeriod('month');
                      setCurrentMonth(new Date());
                    }}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>Resetar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Selecione o período:</Text>
                  <View style={styles.periodSelector}>
                    {[
                      { key: 'month', label: 'Mês' },
                      { key: 'quarter', label: 'Trimestre' },
                      { key: 'year', label: 'Ano' },
                      { key: 'custom', label: 'Personalizado' }
                    ].map(period => (
                      <TouchableOpacity
                        key={period.key}
                        style={[
                          styles.periodButton,
                          selectedPeriod === period.key && styles.periodButtonActive
                        ]}
                        onPress={async () => {
                          await HapticService.buttonPress();
                          if (period.key === 'custom') {
                            setShowFiltersModal(false);
                            openCustomPeriodModal();
                          } else {
                            setSelectedPeriod(period.key as any);
                          }
                        }}
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

                {/* Controles de navegação */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Navegar período:</Text>
                  <View style={styles.navigationControls}>
                    <TouchableOpacity 
                      style={styles.navButton}
                      onPress={async () => {
                        await HapticService.buttonPress();
                        navigatePeriod('prev');
                      }}
                    >
                      <Ionicons name="chevron-back" size={20} color={colors.primary} />
                    </TouchableOpacity>
                    
                    <View style={styles.periodDisplay}>
                      <Text style={styles.periodDisplayText} numberOfLines={1} adjustsFontSizeToFit>
                        {getPeriodLabel()}
                      </Text>
                      {isCurrentPeriod() && (
                        <View style={styles.currentPeriodBadge}>
                          <Text style={styles.currentPeriodText}>Atual</Text>
                        </View>
                      )}
                    </View>
                    
                    <TouchableOpacity 
                      style={styles.navButton}
                      onPress={async () => {
                        await HapticService.buttonPress();
                        navigatePeriod('next');
                      }}
                    >
                      <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <Button
                    title="Aplicar Filtros"
                    onPress={() => setShowFiltersModal(false)}
                    style={styles.modalButton}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
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
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  clearButtonText: {
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
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 2,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  periodButtonText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
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
    gap: 16,
  },
  categoryItem: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  categoryTransactions: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  categoryValue: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontWeight: '700',
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  categoryBarContainer: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  categoryBar: {
    height: '100%',
    borderRadius: 3,
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
  navigationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  periodDisplay: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  periodDisplayText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    numberOfLines: 1,
    adjustsFontSizeToFit: true,
    minimumFontScale: 0.7,
    textTransform: 'capitalize',
  },
  currentPeriodBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
  },
  currentPeriodText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 20,
  },
  modalButton: {
    flex: 1,
  },
  modalScrollView: {
    padding: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  datePickerValue: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
    marginLeft: 12,
  },
  periodPreview: {
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  periodPreviewLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  periodPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});