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
import { StorageService } from '../../services/storage/StorageService';
import { Subscription, Transaction } from '../../types';
import { colors } from '../../styles/colors';

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

    Alert.alert(
      'Registrar Pagamento',
      `Registrar pagamento de R$ ${subscription.amount.toFixed(2)} para ${subscription.name}?`,
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
      <ScrollView style={styles.container}>
        {/* Header Card */}
        <Card variant="primary" style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{subscription.name}</Text>
              {subscription.description && (
                <Text style={styles.headerDescription}>{subscription.description}</Text>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => navigation.navigate('EditSubscription', { subscriptionId })}>
                <Ionicons name="create" size={20} color={colors.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Ionicons name="trash" size={20} color={colors.white} />
              </TouchableOpacity>
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

        {/* Statistics */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Ionicons name="card" size={24} color={colors.primary} />
            <Text style={styles.statLabel}>Total Pago</Text>
            <MoneyText value={totalPaid} size="medium" showSign={false} />
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={styles.statLabel}>Pagamentos</Text>
            <Text style={styles.statValue}>{paymentCount}</Text>
          </Card>

          <Card style={styles.statCard}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={styles.statLabel}>Ativa há</Text>
            <Text style={styles.statValue}>{monthsSinceStart} meses</Text>
          </Card>
        </View>

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

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Registrar Pagamento Manual"
            onPress={handleManualPayment}
            variant="outline"
            style={styles.actionButton}
          />
        </View>
      </ScrollView>
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
  headerCard: {
    marginTop: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
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
  actions: {
    padding: 16,
    marginBottom: 32,
  },
  actionButton: {
    width: '100%',
  },
}); 