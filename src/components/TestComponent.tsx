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
import { Button } from './common/Button';
import { DatePicker } from './common/DatePicker';
import { StorageService } from '../services/storage/StorageService';
import { SubscriptionService } from '../services/subscriptions/SubscriptionService';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';

export const TestComponent: React.FC = () => {
  const [testDate, setTestDate] = useState(new Date());
  const [subscriptionStats, setSubscriptionStats] = useState<any>(null);
  const [installmentCount, setInstallmentCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      const stats = await SubscriptionService.getSubscriptionStats();
      const installments = await StorageService.getInstallments();
      const transactions = await StorageService.getTransactions();
      
      setSubscriptionStats(stats);
      setInstallmentCount(installments.length);
      setTransactionCount(transactions.length);
    } catch (error) {
      console.error('Erro ao carregar dados de teste:', error);
    }
  };

  const testAddSubscription = async () => {
    try {
      const testSubscription = {
        id: `test_${Date.now()}`,
        name: 'Teste Netflix',
        description: 'Plano Família',
        amount: 45.90,
        category: 'Streaming',
        billingDay: 15,
        status: 'active' as const,
        startDate: new Date().toISOString(),
        nextPaymentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'credit' as const,
        reminder: true,
        reminderDays: 3,
      };

      await StorageService.saveSubscription(testSubscription);
      Alert.alert('Sucesso', 'Assinatura de teste adicionada!');
      loadTestData();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao adicionar assinatura de teste');
    }
  };

  const testAddInstallment = async () => {
    try {
      const testInstallment = {
        id: `test_installment_${Date.now()}`,
        description: 'Teste iPhone',
        store: 'Apple Store',
        totalAmount: 5999.90,
        totalInstallments: 12,
        currentInstallment: 0, // Corrigido: começa com 0
        installmentValue: 499.99,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 11 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Compras',
        status: 'active' as const,
        paidInstallments: [], // Corrigido: array vazio
        paymentMethod: 'credit' as const,
      };

      await StorageService.saveInstallment(testInstallment);
      Alert.alert('Sucesso', 'Parcelamento de teste adicionado!');
      loadTestData();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao adicionar parcelamento de teste');
    }
  };

  const testAddTransaction = async () => {
    try {
      const testTransaction = {
        id: `test_transaction_${Date.now()}`,
        type: 'expense' as const,
        amount: 25.50,
        description: 'Teste Almoço',
        category: 'Alimentação',
        date: testDate.toISOString(), // Usa a data do DatePicker
        paymentMethod: 'credit' as const,
      };

      await StorageService.saveTransaction(testTransaction);
      Alert.alert('Sucesso', 'Transação de teste adicionada!');
      loadTestData();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao adicionar transação de teste');
    }
  };

  const clearTestData = async () => {
    Alert.alert(
      'Limpar Dados de Teste',
      'Deseja realmente limpar todos os dados de teste?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Limpar assinaturas de teste
              const subscriptions = await StorageService.getSubscriptions();
              const filteredSubs = subscriptions.filter(s => !s.id.startsWith('test_'));
              await StorageService.setSubscriptions(filteredSubs);

              // Limpar parcelamentos de teste
              const installments = await StorageService.getInstallments();
              const filteredInst = installments.filter(i => !i.id.startsWith('test_'));
              await StorageService.setInstallments(filteredInst);

              // Limpar transações de teste
              const transactions = await StorageService.getTransactions();
              const filteredTrans = transactions.filter(t => !t.id.startsWith('test_'));
              await StorageService.setTransactions(filteredTrans);

              Alert.alert('Sucesso', 'Dados de teste limpos!');
              loadTestData();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao limpar dados de teste');
            }
          }
        }
      ]
    );
  };

  return (
    <Container>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🧪 Teste das Funcionalidades</Text>

        {/* DatePicker Test */}
        <Card style={styles.testCard}>
          <Text style={styles.cardTitle}>📅 Teste do DatePicker</Text>
          <DatePicker
            label="Data da Transação"
            value={testDate}
            onChange={setTestDate}
          />
          <Text style={styles.hint}>
            Data selecionada: {testDate.toLocaleDateString('pt-BR')}
          </Text>
        </Card>

        {/* Stats */}
        <Card style={styles.testCard}>
          <Text style={styles.cardTitle}>📊 Estatísticas</Text>
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Assinaturas</Text>
              <Text style={styles.statValue}>{subscriptionStats?.total || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Parcelamentos</Text>
              <Text style={styles.statValue}>{installmentCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Transações</Text>
              <Text style={styles.statValue}>{transactionCount}</Text>
            </View>
          </View>
        </Card>

        {/* Test Buttons */}
        <Card style={styles.testCard}>
          <Text style={styles.cardTitle}>🔧 Testes</Text>
          
          <Button
            title="➕ Adicionar Assinatura de Teste"
            onPress={testAddSubscription}
            style={styles.testButton}
          />
          
          <Button
            title="💳 Adicionar Parcelamento de Teste"
            onPress={testAddInstallment}
            style={styles.testButton}
          />
          
          <Button
            title="💰 Adicionar Transação de Teste"
            onPress={testAddTransaction}
            style={styles.testButton}
          />
          
          <Button
            title="🗑️ Limpar Dados de Teste"
            onPress={clearTestData}
            variant="outline"
            style={styles.testButton}
          />
        </Card>

        {/* Instructions */}
        <Card style={styles.testCard}>
          <Text style={styles.cardTitle}>📋 Instruções de Teste</Text>
          <Text style={styles.instruction}>
            1. Teste o DatePicker alterando a data
          </Text>
          <Text style={styles.instruction}>
            2. Adicione uma assinatura de teste
          </Text>
          <Text style={styles.instruction}>
            3. Adicione um parcelamento de teste
          </Text>
          <Text style={styles.instruction}>
            4. Adicione uma transação de teste
          </Text>
          <Text style={styles.instruction}>
            5. Verifique se os dados aparecem nas estatísticas
          </Text>
          <Text style={styles.instruction}>
            6. Teste as funcionalidades nas telas principais
          </Text>
        </Card>
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
  testCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  hint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
  testButton: {
    marginBottom: 8,
  },
  instruction: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
}); 