import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch
} from 'react-native';
import {
  Ionicons
} from '@expo/vector-icons';
import { format, differenceInDays, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { Button } from '../../components/common/Button';
import { StorageService } from '../../services/core';
import { SubscriptionService } from '../../services/business';
import { HapticService } from '../../services/platform';
import { Subscription, Transaction } from '../../types';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';

interface SubscriptionDetailScreenProps {
  route: {
    params: {
      subscriptionId: string;
    };
  };
  navigation: any;
}

export const SubscriptionDetailScreen: React.FC<SubscriptionDetailScreenProps> = ({
  route,
  navigation
}) => {
  const { subscriptionId } = route.params;
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [paymentCount, setPaymentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaidThisMonth, setIsPaidThisMonth] = useState(false);
  const [thisMonthPayment, setThisMonthPayment] = useState<Transaction | null>(null);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const subscriptions = await StorageService.getSubscriptions();
      const found = subscriptions.find(s => s.id === subscriptionId);
      
      if (found) {
        setSubscription(found);
        
        // Carregar transações relacionadas
        const allTransactions = await StorageService.getTransactions();
        const related = allTransactions.filter(t => t.subscriptionId === subscriptionId);
        setTransactions(related);
        
        // Calcular totais
        const total = related.reduce((sum, t) => sum + t.amount, 0);
        setTotalPaid(total);
        setPaymentCount(related.length);

        // Verificar se já foi pago este mês
        const paidThisMonth = await SubscriptionService.isSubscriptionPaidThisMonth(subscriptionId);
        setIsPaidThisMonth(paidThisMonth);

        // Obter pagamento deste mês se existir
        if (paidThisMonth) {
          const monthPayment = await SubscriptionService.getLastPaymentThisMonth(subscriptionId);
          setThisMonthPayment(monthPayment);
        } else {
          setThisMonthPayment(null);
        }
      } else {
        setError('Assinatura não encontrada');
      }
    } catch (error) {
      console.error('Erro ao carregar assinatura:', error);
      setError('Erro ao carregar dados da assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!subscription) return;

    const newStatus = subscription.status === 'active' ? 'paused' : 'active';
    const updatedSubscription = {
      ...subscription,
      status: newStatus as 'active' | 'paused' | 'cancelled'
    };

    await StorageService.updateSubscription(updatedSubscription);
    setSubscription(updatedSubscription);
  };

  const handleToggleReminder = async () => {
    if (!subscription) return;

    const updatedSubscription = {
      ...subscription,
      reminder: !subscription.reminder
    };

    await StorageService.updateSubscription(updatedSubscription);
    setSubscription(updatedSubscription);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir esta assinatura? O histórico de pagamentos será mantido.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteSubscription(subscriptionId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir assinatura');
            }
          }
        }
      ]
    );
  };

  const handleManualPayment = async () => {
    if (!subscription) return;

    // Verificar se já foi pago este mês
    const alreadyPaid = await SubscriptionService.isSubscriptionPaidThisMonth(subscriptionId);
    
    if (alreadyPaid) {
      const monthPayment = await SubscriptionService.getLastPaymentThisMonth(subscriptionId);
      const paymentDateText = monthPayment ? 
        format(new Date(monthPayment.date), 'dd/MM/yyyy', { locale: ptBR }) : 
        'neste mês';
      
      Alert.alert(
        'Pagamento Já Realizado',
        `Esta assinatura já foi paga ${paymentDateText}.\n\nValor: R$ ${subscription.amount.toFixed(2).replace('.', ',')}`,
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    Alert.alert(
      'Registrar Pagamento',
      `Registrar pagamento de R$ ${subscription.amount.toFixed(2).replace('.', ',')} para ${subscription.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Registrar',
          onPress: async () => {
            try {
              const transaction: Transaction = {
                id: `transaction_${Date.now()}`,
                type: 'expense',
                amount: subscription.amount,
                description: subscription.name,
                category: subscription.category,
                date: new Date().toISOString(),
                subscriptionId: subscription.id,
                isRecurring: true,
                paymentMethod: subscription.paymentMethod,
              };

              await StorageService.saveTransaction(transaction);
              
              // Atualizar próxima data
              const updatedSubscription = {
                ...subscription,
                lastPaymentDate: new Date().toISOString(),
                nextPaymentDate: addMonths(new Date(), 1).toISOString(),
              };

              await StorageService.updateSubscription(updatedSubscription);
              
              Alert.alert('Sucesso', 'Pagamento registrado com sucesso!');
              loadSubscriptionData();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao registrar pagamento');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <Container>
        <View style={styles.loading}>
          <Text>Carregando...</Text>
        </View>
      </Container>
    );
  }

  if (error || !subscription) {
    return (
      <Container>
        <View style={styles.loading}>
          <Text style={styles.errorText}>{error || 'Assinatura não encontrada'}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (error) {
                loadSubscriptionData();
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.retryText}>
              {error ? 'Tentar Novamente' : 'Voltar'}
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    );
  }

  const daysUntilPayment = differenceInDays(new Date(subscription.nextPaymentDate), new Date());
  const monthsSinceStart = Math.floor(
    (new Date().getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
  );

  return (
    <Container>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Assinatura</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={async () => {
            await HapticService.buttonPress();
            navigation.navigate('EditSubscription', { subscriptionId });
          }}
        >
          <Ionicons name="create" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container}>
        {/* Info Card */}
        <Card variant="primary" style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoDetails}>
              <Text style={styles.infoTitle}>{subscription.name}</Text>
              {subscription.description && (
                <Text style={styles.infoDescription}>{subscription.description}</Text>
              )}
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {subscription.status === 'active' ? 'Ativa' : 
                 subscription.status === 'paused' ? 'Pausada' : 'Cancelada'}
              </Text>
            </View>
          </View>

          <View style={styles.headerAmount}>
            <MoneyText
              value={subscription.amount}
              size="xlarge"
              showSign={false}
              style={styles.whiteText}
            />
            <Text style={styles.perMonth}>por mês</Text>
          </View>

          <View style={styles.headerFooter}>
            <View style={styles.headerFooterItem}>
              <Ionicons name="calendar" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.headerFooterText}>Dia {subscription.billingDay}</Text>
            </View>
            <View style={styles.headerFooterItem}>
              <Ionicons name="card" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.headerFooterText}>{subscription.paymentMethod}</Text>
            </View>
          </View>

          {subscription.status === 'paused' && (
            <View style={styles.pausedBadge}>
              <Ionicons name="pause" size={16} color={colors.warning} />
              <Text style={styles.pausedText}>Assinatura Pausada</Text>
            </View>
          )}
        </Card>

        {/* Status Control */}
        <Card style={styles.controlCard}>
          <View style={styles.controlItem}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlLabel}>
                {subscription.status === 'active' ? 'Assinatura Ativa' : 'Assinatura Pausada'}
              </Text>
              <Text style={styles.controlDescription}>
                {subscription.status === 'active' 
                  ? 'Cobranças automáticas ativas'
                  : 'Cobranças temporariamente suspensas'}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.statusButton,
                subscription.status === 'paused' && styles.statusButtonPaused
              ]}
              onPress={handleToggleStatus}
            >
              <Ionicons 
                name={subscription.status === 'active' ? 'pause' : 'play'} 
                size={20} 
                color={colors.white} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.controlItem}>
            <View style={styles.controlInfo}>
              <Text style={styles.controlLabel}>Lembretes</Text>
              <Text style={styles.controlDescription}>
                Notificar 3 dias antes do vencimento
              </Text>
            </View>
            <Switch
              value={subscription.reminder}
              onValueChange={handleToggleReminder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
            />
          </View>
        </Card>

        {/* Next Payment Info */}
        {subscription.status === 'active' && (
          <Card style={styles.nextPaymentCard}>
            <View style={styles.nextPaymentHeader}>
              <Ionicons name="time" size={20} color={colors.primary} />
              <Text style={styles.nextPaymentTitle}>Próximo Pagamento</Text>
            </View>
            <Text style={styles.nextPaymentDate}>
              {format(new Date(subscription.nextPaymentDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </Text>
            <Text style={styles.nextPaymentDays}>
              {daysUntilPayment === 0 ? 'Vence hoje' :
               daysUntilPayment === 1 ? 'Vence amanhã' :
               daysUntilPayment < 0 ? `Vencido há ${Math.abs(daysUntilPayment)} dias` :
               `Em ${daysUntilPayment} dias`}
            </Text>
            {daysUntilPayment < 0 && (
              <Button
                title="Registrar Pagamento"
                onPress={handleManualPayment}
                variant="primary"
                style={styles.payButton}
              />
            )}
          </Card>
        )}

        {/* Status deste mês */}
        {!isPaidThisMonth && (
          <Card style={styles.monthStatusCard}>
            <View style={styles.pendingPayment}>
              <View style={styles.pendingInfo}>
                <Text style={styles.pendingLabel}>Valor a pagar este mês:</Text>
                <MoneyText value={subscription.amount} size="large" showSign={false} style={styles.pendingAmount} />
              </View>
              <Button
                title="Registrar Pagamento"
                onPress={handleManualPayment}
                variant="primary"
                style={styles.payButton}
              />
            </View>
          </Card>
        )}

        {/* Resumo consolidado */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total pago</Text>
              <MoneyText value={totalPaid} size="medium" showSign={false} />
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pagamentos</Text>
              <Text style={styles.summaryValue}>{paymentCount}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ativa há</Text>
              <Text style={styles.summaryValue}>{monthsSinceStart} meses</Text>
            </View>
          </View>
        </Card>

        {/* Recent Transactions */}
        {transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Histórico de Pagamentos</Text>
            {transactions.slice(0, 5).map((transaction) => (
              <Card key={transaction.id} style={styles.transactionItem}>
                <View>
                  <Text style={styles.transactionDate}>
                    {format(new Date(transaction.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </Text>
                  <Text style={styles.transactionMethod}>
                    {transaction.paymentMethod}
                  </Text>
                </View>
                <MoneyText value={transaction.amount} size="small" showSign={false} />
              </Card>
            ))}
            {transactions.length > 5 && (
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => navigation.navigate('Transactions', { 
                  filter: { subscriptionId } 
                })}
              >
                <Text style={styles.viewAllText}>
                  Ver todos ({transactions.length})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Status de pagamento no final */}
        {isPaidThisMonth && (
          <View style={styles.bottomStatus}>
            <Text style={styles.paidStatusText}>✓ Pagamento já realizado este mês</Text>
          </View>
        )}

      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.white,
    textAlign: 'center',
    flex: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    marginTop: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoDetails: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  statusBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerAmount: {
    alignItems: 'center',
    marginBottom: 20,
  },
  whiteText: {
    color: colors.white,
  },
  perMonth: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  headerFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  headerFooterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerFooterText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  pausedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    alignSelf: 'center',
  },
  pausedText: {
    fontSize: 14,
    color: colors.warning,
    fontWeight: '600',
  },
  controlCard: {
    marginTop: 16,
  },
  controlItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlInfo: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  controlDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonPaused: {
    backgroundColor: colors.success,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  nextPaymentCard: {
    marginTop: 16,
    alignItems: 'center',
  },
  nextPaymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  nextPaymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  nextPaymentDate: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  nextPaymentDays: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  payButton: {
    marginTop: 16,
    minWidth: 200,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionDate: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  transactionMethod: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  viewAllButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  // Novos estilos para UI melhorada
  monthStatusCard: {
    marginBottom: 16,
  },
  monthStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  monthStatusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgePaid: {
    backgroundColor: colors.successLight,
  },
  statusBadgePending: {
    backgroundColor: colors.warningLight,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paidStatus: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  paidStatusText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  paymentInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pendingPayment: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pendingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pendingLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  pendingAmount: {
    color: colors.warning,
  },
  payButton: {
    width: '100%',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actions: {
    padding: 16,
    marginBottom: 32,
  },
  actionButton: {
    width: '100%',
  },
  paidInfo: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  bottomStatus: {
    padding: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
}); 

export default SubscriptionDetailScreen;