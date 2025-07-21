import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SPACING, FONT_SIZES, LAYOUT } from '../../styles/responsive';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { InstallmentCard } from '../../components/installments/InstallmentCard';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../../services/storage/StorageService';
import { Installment, Transaction, Subscription } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [activeInstallments, setActiveInstallments] = useState<Installment[]>([]);
  const [upcomingInstallments, setUpcomingInstallments] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [monthlySubscriptionTotal, setMonthlySubscriptionTotal] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData();
    });

    loadDashboardData();
    return unsubscribe;
  }, [navigation]);

  const loadDashboardData = async () => {
    try {
      // Carregar transações e calcular balanço
      const transactions = await StorageService.getTransactions();
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      let income = 0;
      let expenses = 0;

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

      // Carregar parcelamentos ativos
      const installments = await StorageService.getInstallments();
      const active = installments.filter(inst => inst.status === 'active');
      
      // Calcular valor total de parcelas do mês
      const monthlyInstallmentValue = active.reduce((total, inst) => {
        return total + inst.installmentValue;
      }, 0);

      // Carregar assinaturas ativas
      const subscriptionsData = await StorageService.getSubscriptions();
      const activeSubscriptions = subscriptionsData.filter(sub => sub.status === 'active');
      const subscriptionTotal = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);

      // Calcular despesas totais do mês (transações + parcelamentos + assinaturas)
      const totalMonthlyExpenses = expenses + monthlyInstallmentValue + subscriptionTotal;
      
      setMonthlyIncome(income);
      setMonthlyExpenses(totalMonthlyExpenses);
      setBalance(income - totalMonthlyExpenses);
      setActiveInstallments(active.slice(0, 3)); // Mostrar apenas 3
      setUpcomingInstallments(monthlyInstallmentValue);
      setSubscriptions(activeSubscriptions.slice(0, 3)); // Mostrar apenas 3
      setMonthlySubscriptionTotal(subscriptionTotal);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
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

            {/* Card de Parcelamentos */}
            <Card style={styles.installmentSummary}>
              <View style={styles.installmentHeader}>
                <Text style={styles.sectionTitle}>Parcelamentos do Mês</Text>
                <Text style={styles.installmentTotal}>
                  R$ {upcomingInstallments.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.installmentInfo}>
                {activeInstallments.length} parcelamentos ativos
              </Text>
            </Card>

            {/* Card de Assinaturas */}
            {subscriptions.length > 0 && (
              <Card style={styles.subscriptionSummary}>
                <View style={styles.installmentHeader}>
                  <Text style={styles.sectionTitle}>Assinaturas Mensais</Text>
                  <Text style={styles.installmentTotal}>
                    R$ {monthlySubscriptionTotal.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.installmentInfo}>
                  {subscriptions.length} assinaturas ativas
                </Text>
              </Card>
            )}

            {/* Lista de Parcelamentos Ativos */}
            {activeInstallments.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Parcelamentos Ativos</Text>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('Installments')}
                  >
                    <Text style={styles.seeAll}>Ver todos</Text>
                  </TouchableOpacity>
                </View>

                {activeInstallments.map(installment => (
                  <InstallmentCard
                    key={installment.id}
                    installment={installment}
                    onPress={() => navigation.navigate('InstallmentDetail', { 
                      installmentId: installment.id 
                    })}
                  />
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
});