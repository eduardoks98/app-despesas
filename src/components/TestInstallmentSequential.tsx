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
import { StorageService } from '../services/storage/StorageService';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';

export const TestInstallmentSequential: React.FC = () => {
  const [installments, setInstallments] = useState<any[]>([]);

  useEffect(() => {
    loadInstallments();
  }, []);

  const loadInstallments = async () => {
    try {
      const data = await StorageService.getInstallments();
      setInstallments(data);
    } catch (error) {
      console.error('Erro ao carregar parcelamentos:', error);
    }
  };

  const createTestInstallment = async () => {
    try {
      const testInstallment = {
        id: `test_sequential_${Date.now()}`,
        description: 'Teste Validação Sequencial',
        store: 'Loja Teste',
        totalAmount: 1000,
        totalInstallments: 5,
        currentInstallment: 0,
        installmentValue: 200,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        category: 'Teste',
        status: 'active' as const,
        paidInstallments: [], // Começa vazio
        paymentMethod: 'credit' as const,
      };

      await StorageService.saveInstallment(testInstallment);
      Alert.alert('Sucesso', 'Parcelamento de teste criado!');
      loadInstallments();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao criar parcelamento de teste');
    }
  };

  const testSequentialPayment = async (installmentId: string, installmentNumber: number) => {
    try {
      const installment = installments.find(i => i.id === installmentId);
      if (!installment) return;

      // Verificar se pode pagar esta parcela
      const previousInstallments = Array.from({ length: installmentNumber - 1 }, (_, i) => i + 1);
      const unpaidPrevious = previousInstallments.filter(n => !installment.paidInstallments.includes(n));
      
      if (unpaidPrevious.length > 0) {
        Alert.alert(
          '❌ Validação Sequencial Funcionando!',
          `Você tentou pagar a parcela ${installmentNumber}, mas as parcelas ${unpaidPrevious.join(', ')} ainda não foram pagas.\n\n✅ A validação está funcionando corretamente!`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Se chegou aqui, pode pagar
      const transaction = {
        id: `transaction_${Date.now()}`,
        type: 'expense' as const,
        amount: installment.installmentValue,
        description: `${installment.description} (${installmentNumber}/${installment.totalInstallments})`,
        category: installment.category,
        date: new Date().toISOString(),
        installmentId: installment.id,
        installmentNumber: installmentNumber,
        paymentMethod: 'credit' as const,
      };

      await StorageService.saveTransaction(transaction);

      // Atualizar parcelamento
      const updatedInstallment = {
        ...installment,
        paidInstallments: [...installment.paidInstallments, installmentNumber].sort((a, b) => a - b),
        currentInstallment: Math.max(...installment.paidInstallments, installmentNumber) + 1
      };

      if (installmentNumber === installment.totalInstallments) {
        updatedInstallment.status = 'completed';
      }

      const allInstallments = await StorageService.getInstallments();
      const index = allInstallments.findIndex(i => i.id === installmentId);
      allInstallments[index] = updatedInstallment;
      await StorageService.setInstallments(allInstallments);

      Alert.alert(
        '✅ Pagamento Realizado!',
        `Parcela ${installmentNumber} paga com sucesso!`,
        [{ text: 'OK' }]
      );
      
      loadInstallments();
    } catch (error) {
      Alert.alert('Erro', 'Erro ao processar pagamento');
    }
  };

  const clearTestData = async () => {
    Alert.alert(
      'Limpar Dados de Teste',
      'Deseja limpar todos os dados de teste?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            try {
              const allInstallments = await StorageService.getInstallments();
              const filtered = allInstallments.filter(i => !i.id.startsWith('test_sequential_'));
              await StorageService.setInstallments(filtered);
              
              const allTransactions = await StorageService.getTransactions();
              const filteredTrans = allTransactions.filter(t => !t.installmentId?.startsWith('test_sequential_'));
              await StorageService.setTransactions(filteredTrans);
              
              Alert.alert('Sucesso', 'Dados de teste limpos!');
              loadInstallments();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao limpar dados');
            }
          }
        }
      ]
    );
  };

  const renderInstallmentTest = (installment: any) => {
    return (
      <Card key={installment.id} style={styles.installmentCard}>
        <Text style={styles.installmentTitle}>{installment.description}</Text>
        <Text style={styles.installmentSubtitle}>
          {installment.paidInstallments.length} de {installment.totalInstallments} parcelas pagas
        </Text>
        
        <View style={styles.installmentsGrid}>
          {Array.from({ length: installment.totalInstallments }, (_, i) => i + 1).map(num => {
            const isPaid = installment.paidInstallments.includes(num);
            const previousInstallments = Array.from({ length: num - 1 }, (_, i) => i + 1);
            const canPay = previousInstallments.every(n => installment.paidInstallments.includes(n));
            const isBlocked = !isPaid && !canPay;
            
            return (
              <TouchableOpacity
                key={num}
                style={[
                  styles.installmentButton,
                  isPaid && styles.installmentButtonPaid,
                  isBlocked && styles.installmentButtonBlocked,
                ]}
                onPress={() => testSequentialPayment(installment.id, num)}
                disabled={isPaid}
              >
                <Text style={[
                  styles.installmentButtonText,
                  isPaid && styles.installmentButtonTextPaid,
                  isBlocked && styles.installmentButtonTextBlocked,
                ]}>
                  {num}
                </Text>
                {isPaid && <Ionicons name="checkmark" size={12} color={colors.success} />}
                {isBlocked && <Ionicons name="lock-closed" size={12} color={colors.danger} />}
              </TouchableOpacity>
            );
          })}
        </View>
        
        <Text style={styles.installmentHint}>
          {installment.status === 'completed' ? 
            '✅ Parcelamento concluído!' : 
            '💡 Toque nas parcelas para testar a validação sequencial'
          }
        </Text>
      </Card>
    );
  };

  return (
    <Container>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>🧪 Teste Validação Sequencial</Text>
        
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Como Funciona:</Text>
          <Text style={styles.infoText}>
            • Só é possível pagar parcelas sequencialmente
          </Text>
          <Text style={styles.infoText}>
            • Parcelas bloqueadas mostram ícone de cadeado 🔒
          </Text>
          <Text style={styles.infoText}>
            • Parcelas pagas mostram ícone de check ✅
          </Text>
          <Text style={styles.infoText}>
            • Tente pagar a parcela 3 sem pagar a 1 e 2
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            title="➕ Criar Parcelamento de Teste"
            onPress={createTestInstallment}
            style={styles.actionButton}
          />
          
          <Button
            title="🗑️ Limpar Dados de Teste"
            onPress={clearTestData}
            variant="outline"
            style={styles.actionButton}
          />
        </View>

        {installments.filter(i => i.id.startsWith('test_sequential_')).map(renderInstallmentTest)}
        
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
  actions: {
    marginBottom: 16,
    gap: 8,
  },
  actionButton: {
    marginBottom: 8,
  },
  installmentCard: {
    marginBottom: 16,
  },
  installmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  installmentSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  installmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  installmentButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  installmentButtonPaid: {
    backgroundColor: colors.success,
  },
  installmentButtonBlocked: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  installmentButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  installmentButtonTextPaid: {
    color: colors.white,
  },
  installmentButtonTextBlocked: {
    color: colors.textSecondary,
  },
  installmentHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: 100,
  },
}); 