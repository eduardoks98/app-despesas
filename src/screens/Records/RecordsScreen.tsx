import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { TransactionList } from '../../components/transactions/TransactionList';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../../services/storage/StorageService';
import { Transaction, Installment, Subscription } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecordsScreenProps {
  navigation: any;
}

type RecordType = 'transactions' | 'installments' | 'subscriptions';

interface RecordTypeConfig {
  key: RecordType;
  label: string;
  icon: string;
  color: string;
  description: string;
  addScreen: string;
}

const RECORD_TYPES: RecordTypeConfig[] = [
  {
    key: 'transactions',
    label: 'Transações',
    icon: 'card',
    color: colors.primary,
    description: 'Gastos e receitas diretas',
    addScreen: 'SelectTransactionType'
  },
  {
    key: 'installments',
    label: 'Parcelamentos',
    icon: 'card-outline',
    color: colors.warning,
    description: 'Compras em várias parcelas',
    addScreen: 'AddInstallment'
  },
  {
    key: 'subscriptions',
    label: 'Assinaturas',
    icon: 'repeat',
    color: colors.info,
    description: 'Pagamentos recorrentes mensais',
    addScreen: 'AddSubscription'
  }
];

export const RecordsScreen: React.FC<RecordsScreenProps> = ({ navigation }) => {
  const [selectedType, setSelectedType] = useState<RecordType>('transactions');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);

  useEffect(() => {
    loadData();
  }, []);

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    } else {
      setRefreshing(true);
    }

    try {
      const [transactionsData, installmentsData, subscriptionsData] = await Promise.all([
        StorageService.getTransactions(),
        StorageService.getInstallments(),
        StorageService.getSubscriptions()
      ]);

      console.log('RecordsScreen - Dados carregados:', {
        transactions: transactionsData.length,
        installments: installmentsData.length,
        subscriptions: subscriptionsData.length
      });

      setTransactions(transactionsData);
      setInstallments(installmentsData);
      setSubscriptions(subscriptionsData);

      if (!isRefresh) {
        stopLoading();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      if (!isRefresh) {
        setErrorState('Erro ao carregar dados');
      }
    }

    if (isRefresh) {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadData(true);
  };

  const getCurrentData = () => {
    switch (selectedType) {
      case 'transactions':
        return transactions;
      case 'installments':
        return installments;
      case 'subscriptions':
        return subscriptions;
      default:
        return [];
    }
  };

  const getCurrentConfig = () => {
    return RECORD_TYPES.find(type => type.key === selectedType)!;
  };

  const getTotalAmount = () => {
    switch (selectedType) {
      case 'transactions':
        return transactions.reduce((sum, t) => sum + t.amount, 0);
      case 'installments':
        return installments
          .filter(i => i.status === 'active')
          .reduce((sum, i) => sum + i.installmentValue, 0);
      case 'subscriptions':
        return subscriptions
          .filter(s => s.status === 'active')
          .reduce((sum, s) => sum + s.amount, 0);
      default:
        return 0;
    }
  };

  const getCount = () => {
    switch (selectedType) {
      case 'transactions':
        return transactions.length;
      case 'installments':
        return installments.filter(i => i.status === 'active').length;
      case 'subscriptions':
        return subscriptions.filter(s => s.status === 'active').length;
      default:
        return 0;
    }
  };

  const renderTransactions = () => {
    if (transactions.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
          <Text style={styles.emptySubtext}>
            Adicione suas primeiras transações para começar!
          </Text>
        </Card>
      );
    }

    return (
      <TransactionList
        transactions={transactions}
        onTransactionPress={(transaction) => {
          if (transaction.installmentId) {
            navigation.navigate('InstallmentDetail', { installmentId: transaction.installmentId });
          } else {
            navigation.navigate('EditTransaction', { transactionId: transaction.id });
          }
        }}
      />
    );
  };

  const renderInstallments = () => {
    const activeInstallments = installments.filter(i => i.status === 'active');
    
    if (activeInstallments.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhum parcelamento ativo</Text>
          <Text style={styles.emptySubtext}>
            Adicione seus parcelamentos para acompanhar!
          </Text>
        </Card>
      );
    }

    return (
      <View style={styles.installmentsList}>
        {activeInstallments.map(installment => (
          <Card key={installment.id} style={styles.installmentCard}>
            <TouchableOpacity
              onPress={() => navigation.navigate('InstallmentDetail', { installmentId: installment.id })}
            >
              <View style={styles.installmentHeader}>
                <Text style={styles.installmentTitle}>{installment.description}</Text>
                <View style={styles.installmentStatus}>
                  <Text style={styles.installmentStatusText}>
                    {installment.currentInstallment}/{installment.totalInstallments}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.installmentStore}>{installment.store}</Text>
              
              <View style={styles.installmentDetails}>
                <MoneyText 
                  value={installment.installmentValue} 
                  size="medium"
                  showSign={false}
                />
                <Text style={styles.installmentProgress}>
                  {Math.round((installment.currentInstallment / installment.totalInstallments) * 100)}% pago
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </View>
    );
  };

  const renderSubscriptions = () => {
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
    
    if (activeSubscriptions.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Ionicons name="repeat" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>Nenhuma assinatura ativa</Text>
          <Text style={styles.emptySubtext}>
            Adicione suas assinaturas mensais!
          </Text>
        </Card>
      );
    }

    return (
      <View style={styles.subscriptionsList}>
        {activeSubscriptions.map(subscription => (
          <Card key={subscription.id} style={styles.subscriptionCard}>
            <TouchableOpacity
              onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id })}
            >
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionTitle}>{subscription.name}</Text>
                <View style={styles.subscriptionStatus}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={styles.subscriptionStatusText}>Ativa</Text>
                </View>
              </View>
              
              <Text style={styles.subscriptionDescription}>
                {subscription.description || 'Sem descrição'}
              </Text>
              
              <View style={styles.subscriptionDetails}>
                <MoneyText 
                  value={subscription.amount} 
                  size="medium"
                  showSign={false}
                />
                <Text style={styles.subscriptionBilling}>
                  Dia {subscription.billingDay}
                </Text>
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    switch (selectedType) {
      case 'transactions':
        return renderTransactions();
      case 'installments':
        return renderInstallments();
      case 'subscriptions':
        return renderSubscriptions();
      default:
        return null;
    }
  };

  const currentConfig = getCurrentConfig();

  return (
    <Container>
      <LoadingWrapper
        loading={loading}
        error={error}
        retry={loadData}
        empty={!loading && !error && getCurrentData().length === 0}
        emptyTitle={`Nenhum ${currentConfig.label.toLowerCase()}`}
        emptyMessage={`Adicione seus ${currentConfig.label.toLowerCase()} para começar!`}
        emptyIcon={currentConfig.icon}
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
            <Text style={styles.title}>Registros</Text>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => navigation.navigate('Export')}
            >
              <Ionicons name="download" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Seletor de Tipo */}
          <View style={styles.typeSelector}>
            {RECORD_TYPES.map(type => (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeButton,
                  selectedType === type.key && styles.typeButtonActive
                ]}
                onPress={() => setSelectedType(type.key)}
              >
                <Ionicons 
                  name={type.icon as any} 
                  size={20} 
                  color={selectedType === type.key ? colors.white : type.color} 
                />
                <Text style={[
                  styles.typeButtonText,
                  selectedType === type.key && styles.typeButtonTextActive
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Resumo do Tipo Selecionado */}
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIcon}>
                <Ionicons 
                  name={currentConfig.icon as any} 
                  size={24} 
                  color={currentConfig.color} 
                />
              </View>
              <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle}>{currentConfig.label}</Text>
                <Text style={styles.summaryDescription}>{currentConfig.description}</Text>
              </View>
            </View>
            
            <View style={styles.summaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total</Text>
                <MoneyText 
                  value={getTotalAmount()} 
                  size="large"
                  showSign={false}
                />
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Quantidade</Text>
                <Text style={styles.statValue}>{getCount()}</Text>
              </View>
            </View>
          </Card>

          {/* Lista de Conteúdo */}
          <View style={styles.contentSection}>
            {renderContent()}
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* FAB para adicionar */}
        <FAB
          icon="add"
          onPress={() => navigation.navigate(currentConfig.addScreen)}
          style={styles.fab}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  contentSection: {
    marginTop: 16,
  },
  emptyCard: {
    marginHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  installmentsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  installmentCard: {
    marginBottom: 0,
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  installmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  installmentStatus: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  installmentStatusText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  installmentStore: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  installmentDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  installmentProgress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  subscriptionsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  subscriptionCard: {
    marginBottom: 0,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  subscriptionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subscriptionStatusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
  },
  subscriptionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  subscriptionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionBilling: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  bottomSpacer: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
}); 