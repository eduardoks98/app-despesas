import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { CardHeader } from '../../components/common/CardHeader';
import { MoneyText } from '../../components/common/MoneyText';
import { StorageService } from '../services/core';
import { ErrorHandler } from '../services/utils';
import { HapticService } from '../services/platform';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { Transaction, Installment, Subscription } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { format, addMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native';

interface CategoryTransactionsScreenProps {
  navigation: any;
  route: {
    params: {
      category: string;
      type: 'income' | 'expense';
      period: 'month' | 'quarter' | 'year' | 'custom';
      currentMonth: string;
      customStartDate?: string;
      customEndDate?: string;
    };
  };
}

interface ExtendedTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  source: 'transaction' | 'installment' | 'subscription';
  status: 'paid' | 'pending';
  installmentId?: string;
  subscriptionId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
}

export const CategoryTransactionsScreen: React.FC<CategoryTransactionsScreenProps> = ({ navigation, route }) => {
  const { category, type, period, currentMonth, customStartDate, customEndDate } = route.params;
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [extendedTransactions, setExtendedTransactions] = useState<ExtendedTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);

  const selectedDate = new Date(currentMonth);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 || installments.length > 0 || subscriptions.length > 0) {
      generateExtendedTransactions();
    }
  }, [transactions, installments, subscriptions]);

  // Atualizar dados sempre que a tela for focada
  useFocusEffect(
    useCallback(() => {
      console.log('CategoryTransactionsScreen focada - recarregando dados...');
      loadData(true); // true para não mostrar loading
    }, [])
  );

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    } else {
      setRefreshing(true);
    }
    
    const result = await ErrorHandler.withErrorHandling(
      'carregar dados da categoria',
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
      false
    );
    
    if (!result) {
      setTransactions([]);
      setInstallments([]);
      setSubscriptions([]);
      if (!isRefresh) {
        setErrorState('Não foi possível carregar os dados da categoria');
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

  const isInPeriod = (date: Date) => {
    const startDate = customStartDate ? new Date(customStartDate) : null;
    const endDate = customEndDate ? new Date(customEndDate) : null;

    switch (period) {
      case 'month':
        return date.getMonth() === selectedDate.getMonth() && 
               date.getFullYear() === selectedDate.getFullYear();
      case 'quarter':
        const selectedQuarter = Math.floor(selectedDate.getMonth() / 3);
        const dateQuarter = Math.floor(date.getMonth() / 3);
        return dateQuarter === selectedQuarter && date.getFullYear() === selectedDate.getFullYear();
      case 'year':
        return date.getFullYear() === selectedDate.getFullYear();
      case 'custom':
        return startDate && endDate && date >= startDate && date <= endDate;
      default:
        return false;
    }
  };

  const generateExtendedTransactions = () => {
    const extended: ExtendedTransaction[] = [];

    // Adicionar TODAS as transações da categoria, incluindo parcelas pagas
    // CORREÇÃO: Incluir transações com installmentId para mostrar parcelas pagas
    const categoryTransactions = transactions.filter(t => 
      t.type === type &&
      isInPeriod(new Date(t.date)) &&
      (
        // Transação regular com a categoria
        (t.category === category && !t.installmentId && !t.subscriptionId) ||
        // Parcela paga que pertence à categoria do parcelamento
        (t.installmentId && installments.find(inst => 
          inst.id === t.installmentId && 
          (inst.category === category || (!inst.category && category === 'Parcelamentos'))
        )) ||
        // Assinatura paga que pertence à categoria da assinatura
        (t.subscriptionId && subscriptions.find(sub => 
          sub.id === t.subscriptionId && 
          (sub.category === category || (!sub.category && category === 'Assinaturas'))
        ))
      )
    );

    categoryTransactions.forEach(transaction => {
      // Determinar description, source e status baseado no tipo de transação
      let description = transaction.description || 'Transação';
      let source: 'transaction' | 'installment' | 'subscription' = 'transaction';
      let displayCategory = transaction.category || 'Outros';
      
      // Se é parcela paga
      if (transaction.installmentId) {
        const relatedInstallment = installments.find(i => i.id === transaction.installmentId);
        if (relatedInstallment) {
          description = `${relatedInstallment.description} (${transaction.installmentNumber || '?'}/${relatedInstallment.totalInstallments})`;
          source = 'installment';
          displayCategory = relatedInstallment.category || 'Parcelamentos';
        }
      }
      // Se é assinatura paga
      else if (transaction.subscriptionId) {
        const relatedSubscription = subscriptions.find(s => s.id === transaction.subscriptionId);
        if (relatedSubscription) {
          description = relatedSubscription.name;
          source = 'subscription';
          displayCategory = relatedSubscription.category || 'Assinaturas';
        }
      }
      
      // Status baseado no campo isPaid da transação
      let status = 'paid'; // padrão para transações criadas
      if (transaction.isPaid === false) {
        status = 'pending';
      } else if (transaction.isPaid === true) {
        status = 'paid';
      } else {
        // Para parcelas e assinaturas, se não tem isPaid definido, assumir como pago
        // pois a transação foi criada (significa que foi paga)
        status = 'paid';
      }
      
      extended.push({
        id: transaction.id,
        description,
        amount: transaction.amount,
        date: transaction.date,
        category: displayCategory,
        type: transaction.type,
        source,
        status,
        installmentId: transaction.installmentId,
        subscriptionId: transaction.subscriptionId
      });
    });

    // Adicionar parcelamentos da categoria (incluindo pendentes)
    const categoryInstallments = installments.filter(inst => 
      (inst.category === category || (!inst.category && category === 'Parcelamentos')) &&
      type === 'expense'
    );

    categoryInstallments.forEach(installment => {
      const startDate = new Date(installment.startDate);
      
      // Adicionar parcelas pagas e pendentes no período
      for (let i = 1; i <= installment.totalInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i - 1);
        
        // Manter o mesmo dia do mês da data de início
        const originalDay = startDate.getDate();
        dueDate.setDate(originalDay);
        
        if (isInPeriod(dueDate)) {
          const isPaid = installment.paidInstallments.includes(i);
          
          // CORREÇÃO: Só mostrar parcelas PENDENTES
          // Parcelas pagas já aparecem como transações regulares
          if (!isPaid) {
            extended.push({
              id: `${installment.id}-${i}`,
              description: `${installment.description || 'Parcelamento'} (${i}/${installment.totalInstallments})`,
              amount: installment.installmentValue,
              date: dueDate.toISOString(),
              category: installment.category || 'Parcelamentos',
              type: 'expense',
              source: 'installment',
              status: 'pending',
              installmentId: installment.id,
              installmentNumber: i,
              totalInstallments: installment.totalInstallments
            });
          }
        }
      }
    });

    // Adicionar assinaturas da categoria (incluindo pendentes)
    const categorySubscriptions = subscriptions.filter(sub => 
      (sub.category === category || (!sub.category && category === 'Assinaturas')) &&
      type === 'expense' &&
      sub.status === 'active'
    );

    categorySubscriptions.forEach(subscription => {
      let subscriptionDates: Date[] = [];
      
      // Gerar datas baseadas no período usando billingDay correto
      switch (period) {
        case 'month':
          // Uma cobrança no dia correto do mês
          const monthDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), subscription.billingDay);
          subscriptionDates = [monthDate];
          break;
        case 'quarter':
          // Uma cobrança por mês do trimestre no dia correto
          const quarterStart = Math.floor(selectedDate.getMonth() / 3) * 3;
          for (let i = 0; i < 3; i++) {
            const quarterMonth = quarterStart + i;
            subscriptionDates.push(new Date(selectedDate.getFullYear(), quarterMonth, subscription.billingDay));
          }
          break;
        case 'year':
          // Uma cobrança por mês do ano no dia correto
          for (let i = 0; i < 12; i++) {
            subscriptionDates.push(new Date(selectedDate.getFullYear(), i, subscription.billingDay));
          }
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            let current = new Date(start.getFullYear(), start.getMonth(), subscription.billingDay);
            
            // Se o dia de cobrança já passou no mês inicial, começar no próximo mês
            if (current < start) {
              current.setMonth(current.getMonth() + 1);
            }
            
            while (current <= end) {
              subscriptionDates.push(new Date(current));
              current.setMonth(current.getMonth() + 1);
            }
          }
          break;
      }

      subscriptionDates.forEach(date => {
        // Verificar se está no período analisado
        if (isInPeriod(date)) {
          // Verificar se já foi pago neste mês
          const monthPaid = transactions.some(t => 
            t.subscriptionId === subscription.id && 
            new Date(t.date).getMonth() === date.getMonth() &&
            new Date(t.date).getFullYear() === date.getFullYear()
          );

          // CORREÇÃO: Só mostrar assinaturas PENDENTES
          // Assinaturas pagas já aparecem como transações regulares acima
          if (!monthPaid) {
            extended.push({
              id: `${subscription.id}-${date.getFullYear()}-${date.getMonth()}`,
              description: subscription.name || 'Assinatura',
              amount: subscription.amount,
              date: date.toISOString(),
              category: subscription.category || 'Assinaturas',
              type: 'expense',
              source: 'subscription',
              status: 'pending',
              subscriptionId: subscription.id
            });
          }
        }
      });
    });

    // Ordenar por data (mais recentes primeiro)
    extended.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setExtendedTransactions(extended);
  };

  const getTotalAmount = () => {
    return extendedTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getPaidAmount = () => {
    return extendedTransactions
      .filter(t => t.status === 'paid')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getPendingAmount = () => {
    return extendedTransactions
      .filter(t => t.status === 'pending')
      .reduce((sum, transaction) => sum + transaction.amount, 0);
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'month':
        return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(selectedDate.getMonth() / 3) + 1;
        return `${quarter}º Trimestre ${selectedDate.getFullYear()}`;
      case 'year':
        return selectedDate.getFullYear().toString();
      case 'custom':
        const start = customStartDate ? format(new Date(customStartDate), 'dd/MM/yyyy', { locale: ptBR }) : '';
        const end = customEndDate ? format(new Date(customEndDate), 'dd/MM/yyyy', { locale: ptBR }) : '';
        return `${start} - ${end}`;
      default:
        return '';
    }
  };

  const getSourceIcon = (source: string, status: string) => {
    if (source === 'transaction') return 'receipt';
    if (source === 'installment') return status === 'paid' ? 'card' : 'card-outline';
    if (source === 'subscription') return status === 'paid' ? 'repeat' : 'repeat-outline';
    return 'folder';
  };

  const getSourceColor = (source: string, status: string) => {
    if (status === 'pending') return colors.warning;
    if (source === 'transaction') return colors.primary;
    if (source === 'installment') return colors.danger;
    if (source === 'subscription') return colors.info;
    return colors.textSecondary;
  };

  const renderTransactionItem = (transaction: ExtendedTransaction, index: number) => {
    const isLast = index === extendedTransactions.length - 1;
    
    return (
      <TouchableOpacity 
        key={transaction.id}
        style={[
          styles.transactionItem,
          !isLast && styles.transactionItemBorder
        ]}
        onPress={async () => {
          await HapticService.buttonPress();
          
          // Navegar para a tela apropriada baseado no tipo de transação
          if (transaction.source === 'transaction') {
            navigation.navigate('EditTransaction', { transactionId: transaction.id });
          } else if (transaction.source === 'installment' && transaction.installmentId) {
            navigation.navigate('InstallmentDetail', { installmentId: transaction.installmentId });
          } else if (transaction.source === 'subscription' && transaction.subscriptionId) {
            navigation.navigate('SubscriptionDetail', { subscriptionId: transaction.subscriptionId });
          }
        }}
        activeOpacity={0.7}
      >
        <View style={[
          styles.transactionIcon,
          { backgroundColor: getSourceColor(transaction.source, transaction.status) + '20' }
        ]}>
          <Ionicons 
            name={getSourceIcon(transaction.source, transaction.status) as any} 
            size={18} 
            color={getSourceColor(transaction.source, transaction.status)} 
          />
        </View>
        
        <View style={styles.transactionContent}>
          <Text style={styles.transactionTitle} numberOfLines={2}>
            {transaction.description}
          </Text>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDate}>
              {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
            </Text>
            <Text style={styles.transactionSource}>
              {transaction.source === 'transaction' ? 'Transação' : 
               transaction.source === 'installment' ? 'Parcelamento' : 'Assinatura'}
            </Text>
          </View>
        </View>
        
        <View style={styles.transactionAmountContainer}>
          <MoneyText 
            value={type === 'income' ? transaction.amount : -transaction.amount} 
            size="medium" 
            showSign={false}
            style={[
              styles.transactionAmount,
              { 
                color: transaction.status === 'pending' 
                  ? colors.warning 
                  : type === 'income' 
                    ? colors.success 
                    : colors.danger 
              }
            ]}
          />
          <View style={styles.statusBadge}>
            {transaction.status === 'paid' ? (
              <View style={styles.statusContainer}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>
                  {type === 'income' ? 'Recebido' : 'Pago'}
                </Text>
              </View>
            ) : (
              <View style={styles.statusContainer}>
                <Ionicons name="time" size={16} color={colors.warning} />
                <Text style={[styles.statusText, { color: colors.warning }]}>
                  {type === 'income' ? 'A Receber' : 'A Pagar'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Container>
      <LoadingWrapper
        loading={loading}
        error={error}
        retry={loadData}
        empty={!loading && !error && extendedTransactions.length === 0}
        emptyTitle="Nenhuma transação encontrada"
        emptyMessage={`Não há ${type === 'income' ? 'receitas' : 'despesas'} na categoria "${category}" para este período.`}
        emptyIcon="receipt"
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
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.white} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.title}>{category}</Text>
              <Text style={styles.subtitle}>{getPeriodLabel()}</Text>
            </View>
          </View>

          {/* Resumo */}
          <View style={styles.summaryContainer}>
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total</Text>
                  <MoneyText 
                    value={type === 'income' ? getTotalAmount() : -getTotalAmount()} 
                    size="large" 
                    showSign={false}
                    style={type === 'income' ? styles.incomeText : styles.expenseText}
                  />
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Pago</Text>
                  <MoneyText 
                    value={type === 'income' ? getPaidAmount() : -getPaidAmount()} 
                    size="medium" 
                    showSign={false}
                    style={styles.paidText}
                  />
                </View>
                
                {getPendingAmount() > 0 && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Pendente</Text>
                    <MoneyText 
                      value={type === 'income' ? getPendingAmount() : -getPendingAmount()} 
                      size="medium" 
                      showSign={false}
                      style={styles.pendingAmountText}
                    />
                  </View>
                )}
              </View>
            </Card>
          </View>

          {/* Lista de Transações */}
          <View style={styles.transactionsCard}>
            <CardHeader 
              title={`${type === 'income' ? 'Receitas' : 'Despesas'} da categoria`}
              subtitle={`${extendedTransactions.length} item${extendedTransactions.length !== 1 ? 's' : ''}`}
              icon={type === 'income' ? 'trending-up' : 'trending-down'}
            />
            
            <View style={styles.transactionsList}>
              {extendedTransactions.map((transaction, index) => 
                renderTransactionItem(transaction, index)
              )}
            </View>
          </View>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
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
  summaryContainer: {
    paddingHorizontal: 16,
    marginTop: -16,
    marginBottom: 16,
  },
  summaryCard: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  incomeText: {
    color: colors.success,
  },
  expenseText: {
    color: colors.danger,
  },
  paidText: {
    color: colors.textSecondary,
  },
  pendingAmountText: {
    color: colors.warning,
  },
  transactionsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  transactionsList: {
    backgroundColor: colors.white,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionContent: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  transactionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionSource: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  transactionAmountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  transactionAmount: {
    fontWeight: '700',
  },
  statusBadge: {
    marginTop: 4,
    alignItems: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  bottomSpacer: {
    height: 100,
  },
});

export default CategoryTransactionsScreen;