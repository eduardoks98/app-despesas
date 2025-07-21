import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { Container } from './common/Container';
import { Card } from './common/Card';
import { StorageService } from '../services/storage/StorageService';
import { Subscription } from '../types';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';

export const TestSubscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const data = await StorageService.getSubscriptions();
      console.log('TestSubscriptions - Assinaturas carregadas:', data);
      setSubscriptions(data);
    } catch (error) {
      console.error('TestSubscriptions - Erro ao carregar:', error);
      Alert.alert('Erro', 'Erro ao carregar assinaturas');
    } finally {
      setLoading(false);
    }
  };

  const addTestSubscription = async () => {
    try {
      const testSubscription: Subscription = {
        id: `test_subscription_${Date.now()}`,
        name: 'Teste Netflix',
        description: 'Plano Família',
        amount: 45.90,
        category: 'Streaming',
        billingDay: 15,
        status: 'active',
        startDate: new Date().toISOString(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'credit',
        reminder: true,
        reminderDays: 3,
      };

      console.log('TestSubscriptions - Salvando assinatura de teste:', testSubscription);
      await StorageService.saveSubscription(testSubscription);
      console.log('TestSubscriptions - Assinatura salva com sucesso');
      
      Alert.alert('Sucesso', 'Assinatura de teste adicionada!');
      loadSubscriptions(); // Recarregar lista
    } catch (error) {
      console.error('TestSubscriptions - Erro ao salvar:', error);
      Alert.alert('Erro', 'Erro ao salvar assinatura de teste');
    }
  };

  const clearAllSubscriptions = async () => {
    Alert.alert(
      'Confirmar Limpeza',
      'Deseja realmente limpar todas as assinaturas?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.setSubscriptions([]);
              setSubscriptions([]);
              Alert.alert('Sucesso', 'Todas as assinaturas foram removidas!');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao limpar assinaturas');
            }
          }
        }
      ]
    );
  };

  return (
    <Container>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🧪 Teste de Assinaturas</Text>
        
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔍 Diagnóstico de Assinaturas</Text>
          <Text style={styles.infoText}>
            • Total de assinaturas: {subscriptions.length}
          </Text>
          <Text style={styles.infoText}>
            • Status: {loading ? 'Carregando...' : 'Pronto'}
          </Text>
          <Text style={styles.infoText}>
            • Storage: {subscriptions.length > 0 ? 'Com dados' : 'Vazio'}
          </Text>
        </Card>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.testButton}
            onPress={addTestSubscription}
          >
            <Ionicons name="add-circle" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Adicionar Teste</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButton}
            onPress={loadSubscriptions}
          >
            <Ionicons name="refresh" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Recarregar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.testButton, styles.dangerButton]}
            onPress={clearAllSubscriptions}
          >
            <Ionicons name="trash" size={20} color={colors.white} />
            <Text style={styles.buttonText}>Limpar Tudo</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>📋 Assinaturas Encontradas:</Text>

        {subscriptions.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Nenhuma assinatura encontrada</Text>
            <Text style={styles.emptySubtext}>
              Use o botão "Adicionar Teste" para criar uma assinatura de exemplo
            </Text>
          </Card>
        ) : (
          subscriptions.map((subscription, index) => (
            <Card key={subscription.id} style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionName}>{subscription.name}</Text>
                <View style={[
                  styles.statusBadge,
                  subscription.status === 'active' && styles.activeBadge,
                  subscription.status === 'paused' && styles.pausedBadge
                ]}>
                  <Text style={styles.statusText}>
                    {subscription.status === 'active' ? 'Ativa' : 'Pausada'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.subscriptionDescription}>
                {subscription.description || 'Sem descrição'}
              </Text>
              
              <View style={styles.subscriptionDetails}>
                <Text style={styles.detailText}>
                  💰 R$ {subscription.amount.toFixed(2)}
                </Text>
                <Text style={styles.detailText}>
                  📅 Dia {subscription.billingDay}
                </Text>
                <Text style={styles.detailText}>
                  🏷️ {subscription.category}
                </Text>
              </View>
              
              <Text style={styles.subscriptionId}>
                ID: {subscription.id}
              </Text>
            </Card>
          ))
        )}

        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>🐛 Debug Info:</Text>
          <Text style={styles.debugText}>
            Total de assinaturas: {subscriptions.length}
          </Text>
          <Text style={styles.debugText}>
            IDs: {subscriptions.map(s => s.id).join(', ')}
          </Text>
          <Text style={styles.debugText}>
            Nomes: {subscriptions.map(s => s.name).join(', ')}
          </Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  testButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  emptyCard: {
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
  subscriptionCard: {
    marginBottom: 12,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subscriptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: colors.success,
  },
  pausedBadge: {
    backgroundColor: colors.warning,
  },
  statusText: {
    fontSize: 12,
    color: colors.white,
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
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  subscriptionId: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  debugSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  bottomSpacer: {
    height: 100,
  },
}); 