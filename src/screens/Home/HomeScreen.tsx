import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { InstallmentCard } from '../../components/installments/InstallmentCard';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../../services/storage/StorageService';
import { Installment, Transaction } from '../../types';
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

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
      setBalance(income - expenses);
      setActiveInstallments(active.slice(0, 3)); // Mostrar apenas 3
      setUpcomingInstallments(monthlyInstallmentValue);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  return (
    <Container>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
              size="large" 
              showSign={false}
              style={styles.incomeText}
            />
          </Card>

          <Card style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Despesas</Text>
            <MoneyText 
              value={monthlyExpenses} 
              size="large" 
              showSign={false}
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

        {/* Ações Rápidas */}
        <View style={styles.quickActions}>
          <Card 
            style={styles.actionCard}
            onPress={() => navigation.navigate('AddTransaction')}
          >
            <Ionicons name="add-circle" size={32} color={colors.primary} />
            <Text style={styles.actionText}>Adicionar Gasto</Text>
          </Card>

          <Card 
            style={styles.actionCard}
            onPress={() => navigation.navigate('AddInstallment')}
          >
            <Ionicons name="card" size={32} color={colors.primary} />
            <Text style={styles.actionText}>Novo Parcelamento</Text>
          </Card>
        </View>

        {/* Adicionar espaço extra para o tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <FAB onPress={() => navigation.navigate('AddTransaction')} />
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
    paddingHorizontal: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  incomeText: {
    color: colors.success,
  },
  installmentSummary: {
    marginTop: 16,
    backgroundColor: colors.warningLight,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  installmentTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.warning,
  },
  installmentInfo: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 24,
  },
  actionCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 24,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: 8,
  },
  bottomSpacer: {
    height: 100,
  },
});