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
import { SubscriptionCard } from '../../components/subscriptions/SubscriptionCard';
import { FAB } from '../../components/common/FAB';
import { StorageService } from '../services/core';
import { Subscription } from '../../types';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { LoadingWrapper, useLoadingState } from '../../components/common/LoadingWrapper';
import { useFocusEffect } from '@react-navigation/native';

interface SubscriptionsScreenProps {
  navigation: any;
}

export const SubscriptionsScreen: React.FC<SubscriptionsScreenProps> = ({ navigation }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { loading, error, startLoading, stopLoading, setErrorState } = useLoadingState(true);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadSubscriptions();
    }, [])
  );

  const loadSubscriptions = async (isRefresh = false) => {
    if (!isRefresh) {
      startLoading();
    } else {
      setRefreshing(true);
    }

    try {
      const data = await StorageService.getSubscriptions();
      console.log('Assinaturas carregadas:', data.length, 'assinaturas');
      console.log('Dados das assinaturas:', data);
      setSubscriptions(data);
      
      if (!isRefresh) {
        stopLoading();
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
      if (!isRefresh) {
        setErrorState('Erro ao carregar assinaturas');
      }
    }

    if (isRefresh) {
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadSubscriptions(true);
  };

  const handleToggleStatus = async (subscription: Subscription) => {
    try {
      const newStatus = subscription.status === 'active' ? 'paused' : 'active';
      const updatedSubscription = {
        ...subscription,
        status: newStatus as 'active' | 'paused' | 'cancelled'
      };

      await StorageService.updateSubscription(updatedSubscription);
      loadSubscriptions();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao alterar status da assinatura');
    }
  };

  const handleDeleteSubscription = async (subscription: Subscription) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a assinatura "${subscription.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteSubscription(subscription.id);
              loadSubscriptions();
              Alert.alert('Sucesso', 'Assinatura excluída com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir assinatura');
            }
          }
        }
      ]
    );
  };

  const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
  const pausedSubscriptions = subscriptions.filter(s => s.status === 'paused');
  const totalMonthlyCost = activeSubscriptions.reduce((sum, sub) => sum + sub.amount, 0);

  const renderSubscriptionSection = (title: string, subs: Subscription[], showEmpty = true) => {
    if (subs.length === 0 && !showEmpty) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>({subs.length})</Text>
        </View>
        
        {subs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma assinatura {title.toLowerCase()}</Text>
          </Card>
        ) : (
          subs.map(subscription => (
            <SubscriptionCard
              key={subscription.id}
              subscription={subscription}
              onPress={() => navigation.navigate('SubscriptionDetail', { subscriptionId: subscription.id })}
              onToggleStatus={() => handleToggleStatus(subscription)}
            />
          ))
        )}
      </View>
    );
  };

  return (
    <Container>
      <LoadingWrapper
        loading={loading}
        error={error}
        retry={loadSubscriptions}
        empty={!loading && !error && subscriptions.length === 0}
        emptyTitle="Nenhuma assinatura"
        emptyMessage="Adicione suas assinaturas mensais para acompanhar seus gastos recorrentes!"
        emptyIcon="card"
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Assinaturas</Text>
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => navigation.navigate('Export')}
            >
              <Ionicons name="download" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Resumo */}
          {subscriptions.length > 0 && (
            <Card style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Total Mensal</Text>
                  <MoneyText 
                    value={totalMonthlyCost} 
                    size="large" 
                    showSign={false}
                  />
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Assinaturas Ativas</Text>
                  <Text style={styles.summaryValue}>{activeSubscriptions.length}</Text>
                </View>
              </View>
              
              {pausedSubscriptions.length > 0 && (
                <View style={styles.pausedInfo}>
                  <Ionicons name="pause-circle" size={16} color={colors.warning} />
                  <Text style={styles.pausedText}>
                    {pausedSubscriptions.length} assinatura(s) pausada(s)
                  </Text>
                </View>
              )}
            </Card>
          )}

          <FlatList
            data={[
              { key: 'active', render: () => renderSubscriptionSection('Assinaturas Ativas', activeSubscriptions, false) },
              { key: 'paused', render: () => renderSubscriptionSection('Assinaturas Pausadas', pausedSubscriptions, false) },
              { key: 'all', render: () => (activeSubscriptions.length === 0 && pausedSubscriptions.length === 0 && subscriptions.length > 0) ? renderSubscriptionSection('Todas as Assinaturas', subscriptions) : null }
            ]}
            renderItem={({ item }) => item.render()}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* FAB para adicionar */}
        <FAB
          icon="add"
          onPress={() => navigation.navigate('AddSubscription')}
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
  summaryCard: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  pausedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pausedText: {
    fontSize: 14,
    color: colors.warning,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
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
  listContent: {
    paddingBottom: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
}); 

export default SubscriptionsScreen;