import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Dimensions, TouchableOpacity, Modal, Animated } from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { CardHeader } from '../../components/common/CardHeader';
import { TabSelector } from '../../components/common/TabSelector';
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
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [monthlyData, setMonthlyData] = useState<MonthData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [incomeCategoryData, setIncomeCategoryData] = useState<CategoryData[]>([]);
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
    generateIncomeCategoryData();
  };

  const generateMonthlyData = () => {
    const monthsData: MonthData[] = [];
    
    // Gerar 7 meses: 3 anteriores, atual, 3 futuros
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      const month = date.toLocaleDateString('pt-BR', { month: 'short' });
      const year = date.getFullYear();
      const monthKey = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const now = new Date();
      const isFuture = date > now || (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear());
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === date.getMonth() && tDate.getFullYear() === year;
      });
      
      let income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular apenas despesas diretas (não pagamentos de parcelamentos/assinaturas)
      let expenses = monthTransactions
        .filter(t => t.type === 'expense' && !t.installmentId && !t.subscriptionId)
        .reduce((sum, t) => sum + t.amount, 0);
      
      // Calcular apenas PAGAMENTOS efetivos de parcelamentos no mês
      let monthInstallmentValue = installments
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
      let monthSubscriptionValue = monthTransactions
        .filter(t => t.subscriptionId && t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Para meses futuros ou atual, adicionar previsões
      if (isFuture) {
        // Adicionar parcelamentos não pagos
        const futureInstallments = installments
          .filter(inst => inst.status === 'active')
          .reduce((sum, inst) => {
            const startDate = new Date(inst.startDate);
            let installmentSum = 0;
            
            for (let j = 1; j <= inst.totalInstallments; j++) {
              if (!inst.paidInstallments.includes(j)) {
                const dueDate = new Date(startDate);
                dueDate.setMonth(dueDate.getMonth() + j - 1);
                
                if (dueDate.getMonth() === date.getMonth() && 
                    dueDate.getFullYear() === year) {
                  installmentSum += inst.installmentValue;
                }
              }
            }
            
            return sum + installmentSum;
          }, 0);
        
        // Adicionar assinaturas ativas não pagas
        const futureSubscriptions = subscriptions
          .filter(sub => sub.status === 'active')
          .reduce((sum, sub) => {
            const monthPaid = monthTransactions.some(t => 
              t.subscriptionId === sub.id && 
              new Date(t.date).getMonth() === date.getMonth() &&
              new Date(t.date).getFullYear() === year
            );
            return sum + (monthPaid ? 0 : sub.amount);
          }, 0);
        
        monthInstallmentValue += futureInstallments;
        monthSubscriptionValue += futureSubscriptions;
      }
      
      // Total de despesas incluindo apenas pagamentos efetivos
      const totalExpenses = expenses + monthInstallmentValue + monthSubscriptionValue;
      
      monthsData.push({
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
    
    setMonthlyData(monthsData);
  };

  const generateCategoryData = () => {
    const categoryMap = new Map<string, {
      amount: number;
      transactions: number;
      type: 'income' | 'expense';
    }>();

    const now = new Date();
    const isCurrentOrFuture = currentMonth >= now || 
      (selectedPeriod === 'month' && currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear());

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
      // Usar a categoria original da transação
      let category = transaction.category || 'Outros';
      
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

    // Adicionar previsões de parcelamentos futuros por categoria
    if (isCurrentOrFuture) {
      installments
        .filter(inst => inst.status === 'active')
        .forEach(inst => {
          const startDate = new Date(inst.startDate);
          
          for (let i = 1; i <= inst.totalInstallments; i++) {
            if (!inst.paidInstallments.includes(i)) {
              const dueDate = new Date(startDate);
              dueDate.setMonth(dueDate.getMonth() + i - 1);
              
              // Verificar se a parcela está no período analisado
              let isInPeriod = false;
              switch (selectedPeriod) {
                case 'month':
                  isInPeriod = dueDate.getMonth() === currentMonth.getMonth() && 
                              dueDate.getFullYear() === currentMonth.getFullYear();
                  break;
                case 'quarter':
                  const selectedQuarter = Math.floor(currentMonth.getMonth() / 3);
                  const dueQuarter = Math.floor(dueDate.getMonth() / 3);
                  isInPeriod = dueQuarter === selectedQuarter && 
                              dueDate.getFullYear() === currentMonth.getFullYear();
                  break;
                case 'year':
                  isInPeriod = dueDate.getFullYear() === currentMonth.getFullYear();
                  break;
                case 'custom':
                  isInPeriod = dueDate >= customStartDate && dueDate <= customEndDate;
                  break;
              }
              
              if (isInPeriod) {
                const category = inst.category || 'Parcelamentos';
                const existing = categoryMap.get(category) || {
                  amount: 0,
                  transactions: 0,
                  type: 'expense' as const
                };
                
                categoryMap.set(category, {
                  amount: existing.amount + inst.installmentValue,
                  transactions: existing.transactions + 1,
                  type: 'expense'
                });
              }
            }
          }
        });

      // Adicionar previsões de assinaturas futuras por categoria
      subscriptions
        .filter(sub => sub.status === 'active')
        .forEach(sub => {
          let subscriptionAmount = 0;
          let subscriptionCount = 0;
          
          switch (selectedPeriod) {
            case 'month':
              // Verificar se já foi pago neste mês
              const monthPaid = periodTransactions.some(t => 
                t.subscriptionId === sub.id && 
                new Date(t.date).getMonth() === currentMonth.getMonth() &&
                new Date(t.date).getFullYear() === currentMonth.getFullYear()
              );
              if (!monthPaid) {
                subscriptionAmount = sub.amount;
                subscriptionCount = 1;
              }
              break;
            case 'quarter':
              // Para trimestre, contar 3 meses
              subscriptionAmount = sub.amount * 3;
              subscriptionCount = 3;
              // Subtrair os já pagos
              const quarterPaid = periodTransactions
                .filter(t => t.subscriptionId === sub.id)
                .length;
              subscriptionAmount -= quarterPaid * sub.amount;
              subscriptionCount -= quarterPaid;
              break;
            case 'year':
              // Para ano, contar 12 meses
              subscriptionAmount = sub.amount * 12;
              subscriptionCount = 12;
              // Subtrair os já pagos
              const yearPaid = periodTransactions
                .filter(t => t.subscriptionId === sub.id)
                .length;
              subscriptionAmount -= yearPaid * sub.amount;
              subscriptionCount -= yearPaid;
              break;
          }
          
          if (subscriptionAmount > 0) {
            const category = sub.category || 'Assinaturas';
            const existing = categoryMap.get(category) || {
              amount: 0,
              transactions: 0,
              type: 'expense' as const
            };
            
            categoryMap.set(category, {
              amount: existing.amount + subscriptionAmount,
              transactions: existing.transactions + subscriptionCount,
              type: 'expense'
            });
          }
        });
    }

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
      'Alimentação': 'restaurant',
      'Transporte': 'car',
      'Moradia': 'home',
      'Saúde': 'medical',
      'Educação': 'school',
      'Lazer': 'game-controller',
      'Compras': 'bag',
      'Roupas': 'shirt',
      'Tecnologia': 'phone-portrait',
      'Beleza': 'flower',
      'Pets': 'pawprint',
      'Viagem': 'airplane',
      'Combustível': 'gas-station',
      'Contas': 'receipt',
      'Farmácia': 'medical',
      'Supermercado': 'storefront',
      'Assinaturas': 'repeat',
      'Parcelamentos': 'card',
      'Outros': 'folder'
    };

    const categoryArray: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data], index) => ({
        name,
        amount: data.amount,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
        transactions: data.transactions,
        color: specificCategoryColors[name] || categoryColors[index % categoryColors.length] || '#96CEB4',
        icon: categoryIcons[name as keyof typeof categoryIcons] || 'folder'
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categorias

    setCategoryData(categoryArray);
  };

  const generateIncomeCategoryData = () => {
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

    // Agrupar por categoria (apenas receitas)
    const incomeTransactions = periodTransactions.filter(t => t.type === 'income');
    
    incomeTransactions.forEach(transaction => {
      // Usar a categoria original da transação
      let category = transaction.category || 'Outros';
      
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

    const totalIncome = Array.from(categoryMap.values())
      .reduce((sum, cat) => sum + cat.amount, 0);

    const categoryColors = [
      '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#9C88FF', 
      '#74B9FF', '#A29BFE', '#00B894', '#00CECA', '#6C5CE7'
    ];

    const categoryIcons = {
      'Salário': 'briefcase',
      'Freelance': 'laptop',
      'Investimentos': 'trending-up',
      'Vendas': 'storefront',
      'Presente': 'gift',
      'Prêmio': 'trophy',
      'Rendimentos': 'stats-chart',
      'Comissão': 'handshake',
      'Bonificação': 'star',
      'Aluguel': 'home',
      'Outros': 'cash'
    };

    const categoryArray: CategoryData[] = Array.from(categoryMap.entries())
      .map(([name, data], index) => ({
        name,
        amount: data.amount,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
        transactions: data.transactions,
        color: categoryColors[index % categoryColors.length] || '#96CEB4',
        icon: categoryIcons[name as keyof typeof categoryIcons] || 'cash'
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6); // Top 6 categorias

    setIncomeCategoryData(categoryArray);
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
    
    const now = new Date();
    const isCurrentOrFuture = currentMonth >= now || 
      (selectedPeriod === 'month' && currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear());
    
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
    let periodInstallments = periodTransactions
      .filter(t => t.installmentId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calcular apenas PAGAMENTOS de assinaturas efetivamente pagos no período (através das transações)
    let periodSubscriptions = periodTransactions
      .filter(t => t.subscriptionId && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Se é um período futuro, adicionar previsões
    if (isCurrentOrFuture) {
      // Adicionar previsão de parcelamentos não pagos
      const futureInstallments = installments
        .filter(inst => inst.status === 'active')
        .reduce((sum, inst) => {
          const startDate = new Date(inst.startDate);
          let installmentSum = 0;
          
          for (let i = 1; i <= inst.totalInstallments; i++) {
            if (!inst.paidInstallments.includes(i)) {
              const dueDate = new Date(startDate);
              dueDate.setMonth(dueDate.getMonth() + i - 1);
              
              // Verificar se a parcela está no período analisado
              let isInPeriod = false;
              switch (selectedPeriod) {
                case 'month':
                  isInPeriod = dueDate.getMonth() === currentMonth.getMonth() && 
                              dueDate.getFullYear() === currentMonth.getFullYear();
                  break;
                case 'quarter':
                  const selectedQuarter = Math.floor(currentMonth.getMonth() / 3);
                  const dueQuarter = Math.floor(dueDate.getMonth() / 3);
                  isInPeriod = dueQuarter === selectedQuarter && 
                              dueDate.getFullYear() === currentMonth.getFullYear();
                  break;
                case 'year':
                  isInPeriod = dueDate.getFullYear() === currentMonth.getFullYear();
                  break;
                case 'custom':
                  isInPeriod = dueDate >= customStartDate && dueDate <= customEndDate;
                  break;
              }
              
              if (isInPeriod) {
                installmentSum += inst.installmentValue;
              }
            }
          }
          
          return sum + installmentSum;
        }, 0);
      
      // Adicionar previsão de assinaturas ativas
      const futureSubscriptions = subscriptions
        .filter(sub => sub.status === 'active')
        .reduce((sum, sub) => {
          // Calcular quantos pagamentos de assinatura cairiam no período
          let subscriptionSum = 0;
          
          switch (selectedPeriod) {
            case 'month':
              // Verificar se já foi pago neste mês
              const monthPaid = periodTransactions.some(t => 
                t.subscriptionId === sub.id && 
                new Date(t.date).getMonth() === currentMonth.getMonth() &&
                new Date(t.date).getFullYear() === currentMonth.getFullYear()
              );
              if (!monthPaid) {
                subscriptionSum = sub.amount;
              }
              break;
            case 'quarter':
              // Para trimestre, contar 3 meses
              subscriptionSum = sub.amount * 3;
              // Subtrair os já pagos
              const quarterPaid = periodTransactions
                .filter(t => t.subscriptionId === sub.id)
                .length;
              subscriptionSum -= quarterPaid * sub.amount;
              break;
            case 'year':
              // Para ano, contar 12 meses
              subscriptionSum = sub.amount * 12;
              // Subtrair os já pagos
              const yearPaid = periodTransactions
                .filter(t => t.subscriptionId === sub.id)
                .length;
              subscriptionSum -= yearPaid * sub.amount;
              break;
          }
          
          return sum + Math.max(0, subscriptionSum);
        }, 0);
      
      periodInstallments += futureInstallments;
      periodSubscriptions += futureSubscriptions;
    }

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
    const chartWidth = Dimensions.get('window').width - 32;
    const barWidth = (chartWidth - 60) / data.length;

    const handleBarPress = async (item: MonthData, index: number) => {
      await HapticService.buttonPress();
      
      // Calcular qual mês foi clicado baseado no índice (centro é atual)
      const monthOffset = index - 3; // -3, -2, -1, 0, 1, 2, 3
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + monthOffset);
      
      setSelectedPeriod('month');
      setCurrentMonth(targetDate);
    };

    return (
      <View style={styles.chartContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          <View style={styles.chart}>
            {data.map((item, index) => {
              const incomeHeight = maxValue > 0 ? (item.income / maxValue) * chartHeight : 0;
              const expenseHeight = maxValue > 0 ? (item.expenses / maxValue) * chartHeight : 0;
              
              // Verificar se é o mês atual selecionado
              const monthOffset = index - 3;
              const targetDate = new Date();
              targetDate.setMonth(targetDate.getMonth() + monthOffset);
              const isCurrentMonth = selectedPeriod === 'month' && 
                currentMonth.getMonth() === targetDate.getMonth() && 
                currentMonth.getFullYear() === targetDate.getFullYear();

              return (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.barGroup, 
                    { width: Math.max(barWidth, 60) },
                    isCurrentMonth && styles.barGroupSelected
                  ]}
                  onPress={() => handleBarPress(item, index)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bars}>
                    <View
                      style={[
                        styles.bar,
                        styles.incomeBar,
                        { height: incomeHeight },
                        isCurrentMonth && styles.barSelected
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        styles.expenseBar,
                        { height: expenseHeight },
                        isCurrentMonth && styles.barSelected
                      ]}
                    />
                  </View>
                  <Text style={[
                    styles.barLabel,
                    isCurrentMonth && styles.barLabelSelected
                  ]}>
                    {item.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
        
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
        <View style={styles.emptyTimelineContainer}>
          <Text style={styles.emptyTimelineText}>Nenhuma despesa no período</Text>
        </View>
      );
    }

    return (
      <>
        {categoryData.map((category, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.timelineItemCompact,
              index !== categoryData.length - 1 && styles.timelineItemBorder
            ]}
            onPress={async () => {
              await HapticService.buttonPress();
              navigation.navigate('Transactions', {
                filterByCategory: category.name,
                filterByType: 'expense'
              });
            }}
          >
            <View style={[
              styles.timelineIcon,
              { backgroundColor: category.color + '20' }
            ]}>
              <Ionicons 
                name={(category.icon as any) || 'folder'} 
                size={16} 
                color={category.color} 
              />
            </View>
            
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{category.name}</Text>
              <Text style={styles.timelineDate}>
                {category.transactions} item{category.transactions === 1 ? '' : 's'} • {category.percentage.toFixed(1)}%
              </Text>
            </View>
            
            <MoneyText 
              value={-category.amount} 
              size="small" 
              showSign={false}
              style={[styles.timelineAmount, { color: category.color }]}
            />
          </TouchableOpacity>
        ))}
      </>
    );
  };

  const renderIncomeCategoryChart = () => {
    if (incomeCategoryData.length === 0) {
      return (
        <View style={styles.emptyTimelineContainer}>
          <Text style={styles.emptyTimelineText}>Nenhuma receita no período</Text>
        </View>
      );
    }

    return (
      <>
        {incomeCategoryData.map((category, index) => (
          <TouchableOpacity 
            key={index} 
            style={[
              styles.timelineItemCompact,
              index !== incomeCategoryData.length - 1 && styles.timelineItemBorder
            ]}
            onPress={async () => {
              await HapticService.buttonPress();
              navigation.navigate('Transactions', {
                filterByCategory: category.name,
                filterByType: 'income'
              });
            }}
          >
            <View style={[
              styles.timelineIcon,
              { backgroundColor: category.color + '20' }
            ]}>
              <Ionicons 
                name={(category.icon as any) || 'folder'} 
                size={16} 
                color={category.color} 
              />
            </View>
            
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{category.name}</Text>
              <Text style={styles.timelineDate}>
                {category.transactions} item{category.transactions === 1 ? '' : 's'} • {category.percentage.toFixed(1)}%
              </Text>
            </View>
            
            <MoneyText 
              value={category.amount} 
              size="small" 
              showSign={false}
              style={[styles.timelineAmount, { color: colors.success }]}
            />
          </TouchableOpacity>
        ))}
      </>
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
          <View style={styles.headerTop}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.title}>Relatórios</Text>
              <Text style={styles.subtitle}>{getPeriodLabel()}</Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.filterButton}
                onPress={async () => {
                  await HapticService.buttonPress();
                  setShowFiltersModal(true);
                }}
              >
                <Ionicons 
                  name="options" 
                  size={20} 
                  color={colors.white} 
                />
                {(selectedPeriod !== 'month' || !isCurrentPeriod()) && (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>1</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.exportButton}
                onPress={async () => {
                  await HapticService.buttonPress();
                  navigation.navigate('Export');
                }}
              >
                <Ionicons name="download" size={20} color={colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Resumo do período atual */}
        <View style={styles.summaryContainer}>
          <Card style={styles.summaryCardItem}>
            <Text style={styles.summaryLabel}>Receitas</Text>
            <MoneyText 
              value={currentPeriodData.income} 
              size="large" 
              style={styles.incomeText}
              showSign={false}
            />
          </Card>
          
          <Card style={styles.summaryCardItem}>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <MoneyText 
              value={-currentPeriodData.expenses} 
              size="large"
              showSign={false}
            />
          </Card>
        </View>

        {/* Gráfico mensal */}
        <View style={styles.cardContainer}>
          <CardHeader 
            title="Últimos 6 meses" 
            icon="bar-chart"
          />
          <View style={styles.cardBody}>
            {renderSimpleChart(monthlyData)}
          </View>
        </View>

        {/* Gráfico de receitas por categoria */}
        <View style={styles.cardContainer}>
          <CardHeader 
            title="Receitas por categoria" 
            subtitle={`${incomeCategoryData.length} categoria${incomeCategoryData.length !== 1 ? 's' : ''}`}
            icon="trending-up"
            action={() => navigation.navigate('Transactions', { filterByType: 'income' })}
          />
          <View style={styles.cardBody}>
            {renderIncomeCategoryChart()}
          </View>
        </View>

        {/* Gráfico de despesas por categoria */}
        <View style={styles.cardContainer}>
          <CardHeader 
            title="Despesas por categoria" 
            subtitle={`${categoryData.length} categoria${categoryData.length !== 1 ? 's' : ''}`}
            icon="pie-chart"
            action={() => navigation.navigate('Transactions', { filterByType: 'expense' })}
          />
          <View style={styles.cardBody}>
            {renderCategoryChart()}
          </View>
        </View>


          <View style={styles.bottomSpacer} />
        </ScrollView>



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
                  <View style={styles.periodOptions}>
                    <TouchableOpacity 
                      style={[styles.periodCard, selectedPeriod === 'month' && styles.periodCardActive]}
                      onPress={async () => {
                        await HapticService.buttonPress();
                        setSelectedPeriod('month');
                      }}
                    >
                      <View style={styles.periodCardLeft}>
                        <View style={[styles.periodIcon, selectedPeriod === 'month' && styles.periodIconActive]}>
                          <Ionicons name="calendar" size={20} color={selectedPeriod === 'month' ? colors.white : colors.primary} />
                        </View>
                        <View>
                          <Text style={[styles.periodCardTitle, selectedPeriod === 'month' && styles.periodCardTitleActive]}>
                            Mês
                          </Text>
                          <Text style={styles.periodCardSubtitle}>Visualizar por mês</Text>
                        </View>
                      </View>
                      {selectedPeriod === 'month' && <Ionicons name="checkmark" size={20} color={colors.white} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.periodCard, selectedPeriod === 'quarter' && styles.periodCardActive]}
                      onPress={async () => {
                        await HapticService.buttonPress();
                        setSelectedPeriod('quarter');
                      }}
                    >
                      <View style={styles.periodCardLeft}>
                        <View style={[styles.periodIcon, selectedPeriod === 'quarter' && styles.periodIconActive]}>
                          <Ionicons name="calendar-outline" size={20} color={selectedPeriod === 'quarter' ? colors.white : colors.primary} />
                        </View>
                        <View>
                          <Text style={[styles.periodCardTitle, selectedPeriod === 'quarter' && styles.periodCardTitleActive]}>
                            Trimestre  
                          </Text>
                          <Text style={styles.periodCardSubtitle}>Visualizar por trimestre</Text>
                        </View>
                      </View>
                      {selectedPeriod === 'quarter' && <Ionicons name="checkmark" size={20} color={colors.white} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.periodCard, selectedPeriod === 'year' && styles.periodCardActive]}
                      onPress={async () => {
                        await HapticService.buttonPress();
                        setSelectedPeriod('year');
                      }}
                    >
                      <View style={styles.periodCardLeft}>
                        <View style={[styles.periodIcon, selectedPeriod === 'year' && styles.periodIconActive]}>
                          <Ionicons name="calendar-number" size={20} color={selectedPeriod === 'year' ? colors.white : colors.primary} />
                        </View>
                        <View>
                          <Text style={[styles.periodCardTitle, selectedPeriod === 'year' && styles.periodCardTitleActive]}>
                            Ano
                          </Text>
                          <Text style={styles.periodCardSubtitle}>Visualizar por ano</Text>
                        </View>
                      </View>
                      {selectedPeriod === 'year' && <Ionicons name="checkmark" size={20} color={colors.white} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.periodCard, selectedPeriod === 'custom' && styles.periodCardActive]}
                      onPress={async () => {
                        await HapticService.buttonPress();
                        setSelectedPeriod('custom');
                      }}
                    >
                      <View style={styles.periodCardLeft}>
                        <View style={[styles.periodIcon, selectedPeriod === 'custom' && styles.periodIconActive]}>
                          <Ionicons name="settings" size={20} color={selectedPeriod === 'custom' ? colors.white : colors.primary} />
                        </View>
                        <View>
                          <Text style={[styles.periodCardTitle, selectedPeriod === 'custom' && styles.periodCardTitleActive]}>
                            Personalizado
                          </Text>
                          <Text style={styles.periodCardSubtitle}>Período específico</Text>
                        </View>
                      </View>
                      {selectedPeriod === 'custom' && <Ionicons name="checkmark" size={20} color={colors.white} />}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Seleção de datas personalizadas */}
                {selectedPeriod === 'custom' && (
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>Escolher período:</Text>
                    <View style={styles.customDateSection}>
                      <View style={styles.datePickerContainer}>
                        <Text style={styles.dateLabel}>De:</Text>
                        <DatePicker
                          value={customStartDate}
                          onChange={setCustomStartDate}
                          compact={true}
                          style={styles.inlineDatePicker}
                        />
                      </View>
                      
                      <View style={styles.datePickerContainer}>
                        <Text style={styles.dateLabel}>Até:</Text>
                        <DatePicker
                          value={customEndDate}
                          onChange={setCustomEndDate}
                          compact={true}
                          style={styles.inlineDatePicker}
                        />
                      </View>
                    </View>
                  </View>
                )}

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
    paddingBottom: 12,
    backgroundColor: colors.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold',
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
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryContent: {
    padding: 16,
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
  cardContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardBody: {
    padding: 0,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: -16,
    marginBottom: 16,
  },
  summaryCardItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  periodLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  periodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
    minWidth: '47%',
    flex: 1,
  },
  periodButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  periodButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    padding: 16,
  },
  chartScrollContainer: {
    paddingHorizontal: 16,
    minWidth: '100%',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
    justifyContent: 'center',
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
  barGroupSelected: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    marginHorizontal: -2,
    paddingHorizontal: 2,
    transform: [{ scaleY: 1.05 }],
  },
  barSelected: {
    opacity: 1,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  barLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
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
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timelineContainer: {
    backgroundColor: colors.white,
  },
  timelineItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  timelineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  timelineAmount: {
    fontWeight: '700',
  },
  emptyTimelineContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyTimelineText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryChart: {
    gap: 12,
  },
  categoryItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 12,
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
    marginBottom: 8,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 1,
  },
  categoryTransactions: {
    fontSize: 11,
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
    maxHeight: '90%',
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
  periodOptions: {
    flexDirection: 'column',
    gap: 8,
  },
  periodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  periodCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  periodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodIconActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  periodCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  periodCardTitleActive: {
    color: colors.white,
  },
  periodCardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  customDateSection: {
    flexDirection: 'row',
    gap: 8,
  },
  datePickerContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  inlineDatePicker: {
    backgroundColor: 'transparent',
  },
});