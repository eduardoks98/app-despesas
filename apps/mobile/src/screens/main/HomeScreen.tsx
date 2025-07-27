import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SPACING, FONT_SIZES, LAYOUT } from '../../styles/responsive';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { CardHeader } from '../../components/common/CardHeader';
import { MoneyText } from '../../components/common/MoneyText';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../../services/core';
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

      // Calcular TODAS as transações do mês atual (igual à timeline)
      transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        if (transactionDate.getMonth() === currentMonth && 
            transactionDate.getFullYear() === currentYear) {
          if (transaction.type === 'income') {
            income += transaction.amount;
          } else if (transaction.type === 'expense') {
            // Todas as despesas (incluindo pagamentos de parcelamentos e assinaturas)
            expenses += transaction.amount;
          }
        }
      });

      const totalMonthlyExpenses = expenses;
      
      setMonthlyIncome(income);
      setMonthlyExpenses(totalMonthlyExpenses);
      setBalance(income - totalMonthlyExpenses);

      // Filtrar parcelamentos e assinaturas ativos para a timeline
      const activeInstallments = installments.filter(inst => inst.status === 'active');
      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');

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

    // Adicionar todas as transações recentes (incluindo pagamentos de parcelamentos/assinaturas)
    transactions
      .filter(t => new Date(t.date) >= thirtyDaysAgo)
      .forEach(transaction => {
        let title = transaction.description;
        let icon = transaction.type === 'income' ? 'trending-up' : 'trending-down';
        let color = transaction.type === 'income' ? colors.success : colors.danger;
        let type: 'transaction' | 'installment' | 'subscription' = 'transaction';

        // Se é pagamento de parcelamento
        if (transaction.installmentId) {
          const installment = installments.find(i => i.id === transaction.installmentId);
          if (installment) {
            title = `${installment.description}`;
            // Usar o installmentNumber da transação se existir
            const parcelaNumero = transaction.installmentNumber || 'N/A';
            transaction.category = `Parcela ${parcelaNumero}/${installment.totalInstallments} • ${installment.store}`;
            icon = 'card';
            color = colors.warning;
            // CORREÇÃO: Manter como 'transaction' mas com visual de installment
            // O navigation vai usar transaction.installmentId automaticamente
            type = 'transaction';
          }
        }
        // Se é pagamento de assinatura
        else if (transaction.subscriptionId) {
          const subscription = subscriptions.find(s => s.id === transaction.subscriptionId);
          if (subscription) {
            title = `${subscription.name}`;
            // Adicionar informação do vencimento na categoria
            const transactionDate = new Date(transaction.date);
            const monthName = transactionDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
            transaction.category = `Assinatura • ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
            icon = 'repeat';
            color = colors.info;
            // CORREÇÃO: Manter como 'transaction' mas com visual de subscription
            // O navigation vai usar transaction.subscriptionId automaticamente
            type = 'transaction';
          }
        }

        items.push({
          id: transaction.id,
          type,
          title,
          amount: transaction.type === 'income' ? transaction.amount : -transaction.amount,
          date: new Date(transaction.date),
          category: transaction.category,
          icon,
          color,
          originalData: transaction
        });
      });

    // Adicionar próximas parcelas não pagas (só para vencimentos)
    const activeInstallmentsForTimeline = installments.filter(installment => installment.status === 'active');
    
    activeInstallmentsForTimeline.forEach(installment => {
      const startDate = new Date(installment.startDate);
      
      for (let i = 1; i <= installment.totalInstallments; i++) {
        // Só adicionar se não foi paga ainda
        if (!installment.paidInstallments.includes(i)) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + i - 1);
          
          if (dueDate >= now && dueDate <= thirtyDaysAhead) {
            items.push({
              id: `${installment.id}_upcoming_${i}`,
              type: 'installment',
              title: `${installment.description}`,
              amount: -installment.installmentValue,
              date: dueDate,
              category: `Próxima parcela ${i}/${installment.totalInstallments} • ${installment.store}`,
              icon: 'card',
              color: colors.warning,
              originalData: installment
            });
          }
        }
      }
    });


    // Adicionar próximos vencimentos de assinaturas
    subscriptions.forEach(subscription => {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      // Próximo vencimento deste mês
      const thisMonthDue = new Date(currentYear, currentMonth, subscription.billingDay);
      if (thisMonthDue >= now && thisMonthDue <= thirtyDaysAhead) {
        const monthName = thisMonthDue.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        items.push({
          id: `${subscription.id}_${currentYear}_${currentMonth}`,
          type: 'subscription',
          title: subscription.name,
          amount: -subscription.amount,
          date: thisMonthDue,
          category: `Próximo vencimento • ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`,
          icon: 'repeat',
          color: colors.info,
          originalData: subscription
        });
      }
      
      // Próximo mês também
      const nextMonthDue = new Date(currentYear, currentMonth + 1, subscription.billingDay);
      if (nextMonthDue <= thirtyDaysAhead) {
        const monthName = nextMonthDue.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        items.push({
          id: `${subscription.id}_${nextMonthDue.getFullYear()}_${nextMonthDue.getMonth()}`,
          type: 'subscription',
          title: subscription.name,
          amount: -subscription.amount,
          date: nextMonthDue,
          category: `Próximo vencimento • ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`,
          icon: 'repeat',
          color: colors.info,
          originalData: subscription
        });
      }
    });

    // Ordenar por data (mais recente primeiro)
    items.sort((a, b) => b.date.getTime() - a.date.getTime());

    // Separar em recentes (últimos 7 dias) e próximos (próximos 15 dias)
    const recent = items.filter(item => item.date <= now).slice(0, 5);
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
          console.log(`🎯 Navigating to installment: ${transaction.installmentId}`);
          navigation.navigate('InstallmentDetail', { installmentId: transaction.installmentId });
        } else if (transaction.subscriptionId) {
          navigation.navigate('SubscriptionDetail', { subscriptionId: transaction.subscriptionId });
        } else {
          navigation.navigate('EditTransaction', { transactionId: transaction.id });
        }
        break;
      case 'installment':
        const installment = item.originalData as Installment;
        console.log(`🎯 Navigating to installment: ${installment.id}`);
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
              <MoneyText value={balance} size="xlarge" showSign={true} style={[styles.balanceValue, balance < 0 && styles.negativeBalance]} />
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


            {/* Próximos Vencimentos */}
            {upcomingItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.cardContainer}>
                  <CardHeader 
                    title="Próximos Vencimentos" 
                    subtitle={`${upcomingItems.length} próximo${upcomingItems.length !== 1 ? 's' : ''}`}
                    action={() => {
                      // Analisar os tipos dos próximos vencimentos para decidir o filtro
                      const hasInstallments = upcomingItems.some(item => item.type === 'installment');
                      const hasSubscriptions = upcomingItems.some(item => item.type === 'subscription');
                      
                      if (hasInstallments && !hasSubscriptions) {
                        // Só parcelamentos - navegar para parcelamentos
                        navigation.navigate('Records', { 
                          selectedType: 'installments',
                          showFilters: true 
                        });
                      } else if (hasSubscriptions && !hasInstallments) {
                        // Só assinaturas - navegar para assinaturas
                        navigation.navigate('Records', { 
                          selectedType: 'subscriptions',
                          showFilters: true 
                        });
                      } else {
                        // Ambos ou só transações - navegar para records geral
                        navigation.navigate('Records', { showFilters: true });
                      }
                    }}
                  />
                  <View style={styles.cardBody}>
                    {upcomingItems.map((item, index) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={[
                          styles.timelineItemCompact,
                          index !== upcomingItems.length - 1 && styles.timelineItemBorder
                        ]}
                        onPress={() => handleTimelineItemPress(item)}
                      >
                        <View style={[
                          styles.timelineIcon,
                          { backgroundColor: item.color + '20' }
                        ]}>
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
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
                          size="small" 
                          style={[styles.timelineAmount, { color: item.color }]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Timeline de Movimentações Recentes */}
            {timelineItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.cardContainer}>
                  <CardHeader 
                    title="Movimentações Recentes" 
                    subtitle="Últimas 5 movimentações"
                    action={() => navigation.navigate('Transactions')}
                  />
                  <View style={styles.cardBody}>
                    {timelineItems.map((item, index) => (
                      <TouchableOpacity 
                        key={item.id}
                        style={[
                          styles.timelineItemCompact,
                          index !== timelineItems.length - 1 && styles.timelineItemBorder
                        ]}
                        onPress={() => handleTimelineItemPress(item)}
                      >
                        <View style={[
                          styles.timelineIcon,
                          { backgroundColor: item.color + '20' }
                        ]}>
                          <Ionicons name={item.icon as any} size={16} color={item.color} />
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
                          size="small" 
                          style={[styles.timelineAmount, { color: item.color }]}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
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
    paddingTop: 16,
    paddingBottom: 32,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.primaryLight,
    marginBottom: 3,
  },
  balanceValue: {
    color: colors.white,
  },
  negativeBalance: {
    color: colors.dangerLight,
  },
  summaryCards: {
    flexDirection: 'row',
    marginTop: -16,
    paddingHorizontal: SPACING.md,
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
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
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 80,
  },
  timelineCard: {
    marginBottom: SPACING.xs,
    marginHorizontal: 0,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  timelineItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 1,
  },
  timelineDate: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    marginBottom: 1,
  },
  timelineCategory: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  timelineAmount: {
    fontWeight: '700',
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
    backgroundColor: colors.white,
    padding: 0,
  },
});

export default HomeScreen;