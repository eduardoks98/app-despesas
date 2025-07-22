import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SPACING, FONT_SIZES, LAYOUT } from '../../styles/responsive';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../../services/storage/StorageService';
import { Installment, Transaction, Subscription } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { format, parseISO, isToday, isTomorrow, isThisWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HomeScreenProps {
  navigation: any;
}

interface TimelineItem {
  id: string;
  type: 'transaction' | 'installment' | 'subscription';
  title: string;
  amount: number;
  date: Date;
  category?: string;
  icon: string;
  color: string;
  originalData: Transaction | Installment | Subscription;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [upcomingItems, setUpcomingItems] = useState<TimelineItem[]>([]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });

    loadDashboardData();
    return unsubscribe;
  }, [navigation]);

  const loadDashboardData = async () => {
    try {
      // Carregar todos os dados
      const [transactions, installments, subscriptions] = await Promise.all([
        StorageService.getTransactions(),
        StorageService.getInstallments(),
        StorageService.getSubscriptions()
      ]);

      // Calcular resumo financeiro mensal
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      let income = 0;
      let expenses = 0;

      // Calcular transações do mês atual
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
          if (transaction.type === 'income') {
            income += transaction.amount;
          } else {
            expenses += transaction.amount;
          }
        }
      });

      // Adicionar parcelamentos e assinaturas do mês
      const activeInstallments = installments.filter(inst => inst.status === 'active');
      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
      
      const monthlyInstallmentValue = activeInstallments.reduce((total, inst) => total + inst.installmentValue, 0);
      const subscriptionTotal = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);
      const totalMonthlyExpenses = expenses + monthlyInstallmentValue + subscriptionTotal;
      
      setMonthlyIncome(income);
      setMonthlyExpenses(totalMonthlyExpenses);
      setBalance(income - totalMonthlyExpenses);

      // Criar timeline unificada
      const timeline = createTimeline(transactions, activeInstallments, activeSubscriptions);
      setTimelineItems(timeline.recent);
      setUpcomingItems(timeline.upcoming);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const createTimeline = (transactions: Transaction[], installments: Installment[], subscriptions: Subscription[]) => {
    const items: TimelineItem[] = [];
    const now = new Date();
    const thirtyDaysAgo = addDays(now, -30);
    const thirtyDaysAhead = addDays(now, 30);

    // Adicionar transações recentes
    transactions
      .filter(t => new Date(t.date) >= thirtyDaysAgo)
      .forEach(transaction => {
        items.push({
          id: transaction.id,
          type: 'transaction',
          title: transaction.description,
          amount: transaction.type === 'income' ? transaction.amount : -transaction.amount,
          date: new Date(transaction.date),
          category: transaction.category,
          icon: transaction.type === 'income' ? 'trending-up' : 'trending-down',
          color: transaction.type === 'income' ? colors.success : colors.danger,
          originalData: transaction
        });
      });

    // Adicionar parcelas (próximas e recentes)
    installments.forEach(installment => {
      // Calcular próximas parcelas
      const startDate = new Date(installment.startDate);
      for (let i = installment.currentInstallment; i <= installment.totalInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i - 1);
        
        if (dueDate >= thirtyDaysAgo && dueDate <= thirtyDaysAhead) {
          items.push({
            id: `${installment.id}_${i}`,
            type: 'installment',
            title: `${installment.description} (${i}/${installment.totalInstallments})`,
            amount: -installment.installmentValue,
            date: dueDate,
            category: installment.category,
            icon: 'card',
            color: colors.warning,
            originalData: installment
          });
        }
      }
    });

    // Adicionar assinaturas (próximos vencimentos)
    subscriptions.forEach(subscription => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Próximo vencimento deste mês
      const thisMonthDue = new Date(currentYear, currentMonth, subscription.billingDay);
      if (thisMonthDue >= thirtyDaysAgo && thisMonthDue <= thirtyDaysAhead) {
        items.push({
          id: `${subscription.id}_${currentYear}_${currentMonth}`,
          type: 'subscription',
          title: subscription.name,
          amount: -subscription.amount,
          date: thisMonthDue,
          category: subscription.category,
          icon: 'repeat',
          color: colors.info,
          originalData: subscription
        });
      }
      
      // Próximo mês também
      const nextMonthDue = new Date(currentYear, currentMonth + 1, subscription.billingDay);
      if (nextMonthDue <= thirtyDaysAhead) {
        items.push({
          id: `${subscription.id}_${nextMonthDue.getFullYear()}_${nextMonthDue.getMonth()}`,
          type: 'subscription',
          title: subscription.name,
          amount: -subscription.amount,
          date: nextMonthDue,
          category: subscription.category,
          icon: 'repeat',
          color: colors.info,
          originalData: subscription
        });
      }
    });

    // Ordenar por data (mais recente primeiro)
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Separar em recentes (últimos 7 dias) e próximos (próximos 15 dias)
    const recent = items.filter(item => item.date <= now).slice(0, 10);
    const upcoming = items
      .filter(item => item.date > now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);

    return { recent, upcoming };
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) {
      return 'Hoje';
    } else if (isTomorrow(date)) {
      return 'Amanhã';
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: ptBR });
    } else {
      return format(date, 'dd/MM', { locale: ptBR });
    }
  };

  const handleTimelineItemPress = (item: TimelineItem) => {
    switch (item.type) {
      case 'transaction':
        const transaction = item.originalData as Transaction;
        if (transaction.installmentId) {
          navigation.navigate('InstallmentDetail', { installmentId: transaction.installmentId });
        } else {
          navigation.navigate('EditTransaction', { transactionId: transaction.id });
        }
        break;
      case 'installment':
        const installment = item.originalData as Installment;
        navigation.navigate('InstallmentDetail', { installmentId: installment.id });
        break;
      case 'subscription':
        const subscription = item.originalData as Subscription;
        navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id });
        break;
    }
  };

  return (
    <Container>
      <FlatList
        data={[{ key: 'content' }]}
        renderItem={() => (
          <>
            {/* Header com Saldo */}
            <View style={styles.header}>
              <Text style={styles.greeting}>Olá! 👋</Text>
              <Text style={styles.balanceLabel}>Saldo disponível</Text>
              <MoneyText value={balance} size="xlarge" showSign={false} style={styles.balanceValue} />
            </View>

            {/* Cards de Resumo */}
            <View style={styles.summaryCards}>
              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Receitas</Text>
                <MoneyText 
                  value={monthlyIncome} 
                  size="medium" 
                  showSign={false}
                  style={styles.incomeText}
                />
              </Card>

              <Card style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Despesas</Text>
                <MoneyText 
                  value={monthlyExpenses} 
                  size="medium" 
                  showSign={false}
                  style={styles.expenseText}
                />
              </Card>
            </View>

            {/* Ações Rápidas */}
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('SelectTransactionType')}
              >
                <Ionicons name="add-circle" size={24} color={colors.primary} />
                <Text style={styles.quickActionText}>Adicionar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Reports')}
              >
                <Ionicons name="bar-chart" size={24} color={colors.primary} />
                <Text style={styles.quickActionText}>Relatórios</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.quickActionButton}
                onPress={() => navigation.navigate('Records')}
              >
                <Ionicons name="list" size={24} color={colors.primary} />
                <Text style={styles.quickActionText}>Registros</Text>
              </TouchableOpacity>
            </View>

            {/* Próximos Vencimentos */}
            {upcomingItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Próximos Vencimentos</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Records')}>
                    <Text style={styles.seeAll}>Ver todos</Text>
                  </TouchableOpacity>
                </View>
                
                {upcomingItems.map(item => (
                  <Card key={item.id} style={styles.timelineCard}>
                    <View style={styles.timelineItem}>
                      <View style={[
                        styles.timelineIcon,
                        { backgroundColor: item.color + '20' }
                      ]}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        <Text style={styles.timelineDate}>
                          {getDateLabel(item.date)}
                        </Text>
                        {item.category && (
                          <Text style={styles.timelineCategory}>{item.category}</Text>
                        )}
                      </View>
                      
                      <MoneyText 
                        value={item.amount} 
                        size="medium" 
                        style={[styles.timelineAmount, { color: item.color }]}
                      />
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {/* Timeline de Movimentações Recentes */}
            {timelineItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Movimentações Recentes</Text>
                  <TouchableOpacity onPress={() => navigation.navigate('Records')}>
                    <Text style={styles.seeAll}>Ver todas</Text>
                  </TouchableOpacity>
                </View>
                
                {timelineItems.map(item => (
                  <Card key={item.id} style={styles.timelineCard}>
                    <TouchableOpacity 
                      style={styles.timelineItem}
                      onPress={() => handleTimelineItemPress(item)}
                    >
                      <View style={[
                        styles.timelineIcon,
                        { backgroundColor: item.color + '20' }
                      ]}>
                        <Ionicons name={item.icon as any} size={20} color={item.color} />
                      </View>
                      
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{item.title}</Text>
                        <Text style={styles.timelineDate}>
                          {getDateLabel(item.date)}
                        </Text>
                        {item.category && (
                          <Text style={styles.timelineCategory}>{item.category}</Text>
                        )}
                      </View>
                      
                      <MoneyText 
                        value={item.amount} 
                        size="medium" 
                        style={[styles.timelineAmount, { color: item.color }]}
                      />
                    </TouchableOpacity>
                  </Card>
                ))}
              </View>
            )}

            {/* Adicionar espaço extra para o tab bar */}
            <View style={styles.bottomSpacer} />
          </>
        )}
        style={styles.container}
        showsVerticalScrollIndicator={false}
      />

      <FAB onPress={() => navigation.navigate('SelectTransactionType')} />
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.primaryLight,
    marginBottom: 4,
  },
  balanceValue: {
    color: colors.white,
  },
  summaryCards: {
    flexDirection: 'row',
    marginTop: -20,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0, // Permite que os cards se comprimam se necessário
    paddingVertical: SPACING.md, // Espaço vertical reduzido
    paddingHorizontal: SPACING.xs, // Espaço horizontal mínimo
  },
  summaryLabel: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: SPACING.xs / 2,
    textAlign: 'center',
  },
  incomeText: {
    color: colors.success,
    textAlign: 'center',
    flexShrink: 1, // Permite compressão do texto
  },
  expenseText: {
    color: colors.danger,
    textAlign: 'center',
    flexShrink: 1, // Permite compressão do texto
  },
  installmentSummary: {
    marginTop: SPACING.md,
    backgroundColor: colors.warningLight,
  },
  subscriptionSummary: {
    marginTop: SPACING.md,
    backgroundColor: colors.infoLight,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    flexWrap: 'wrap', // Permite quebra se necessário
  },
  installmentTotal: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: colors.warning,
    flexShrink: 0, // Não comprime o valor
  },
  installmentInfo: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
  },
  section: {
    marginTop: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    flexWrap: 'wrap', // Permite quebra se necessário
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: colors.text,
    flexShrink: 1, // Permite compressão do título
  },
  seeAll: {
    fontSize: FONT_SIZES.md,
    color: colors.primary,
    fontWeight: '500',
    flexShrink: 0, // Não comprime o botão
  },
  bottomSpacer: {
    height: 100,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: FONT_SIZES.xs,
    color: colors.text,
    marginTop: SPACING.xs / 2,
    fontWeight: '500',
  },
  timelineCard: {
    marginBottom: SPACING.sm,
    marginHorizontal: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  timelineCategory: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timelineAmount: {
    fontWeight: '700',
  },
});