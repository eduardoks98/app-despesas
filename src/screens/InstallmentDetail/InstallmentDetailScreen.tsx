import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal
} from 'react-native';
import { 
  Ionicons
} from '@expo/vector-icons';
import { Container } from '../../components/common/Container';
import { Card } from '../../components/common/Card';
import { MoneyText } from '../../components/common/MoneyText';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { StorageService } from '../../services/storage/StorageService';
import { Installment, Transaction } from '../../types';
import { colors } from '../../styles/colors';

interface InstallmentDetailScreenProps {
  route: {
    params: {
      installmentId: string;
    };
  };
  navigation: any;
}

export const InstallmentDetailScreen: React.FC<InstallmentDetailScreenProps> = ({ 
  route, 
  navigation 
}) => {
  const { installmentId } = route.params;
  const [installment, setInstallment] = useState<Installment | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInstallmentNumber, setSelectedInstallmentNumber] = useState<number>(0);

  useEffect(() => {
    loadInstallmentData();
  }, []);

  const loadInstallmentData = async () => {
    try {
      const installments = await StorageService.getInstallments();
      const found = installments.find(i => i.id === installmentId);
      
      if (found) {
        setInstallment(found);
        
        // Carregar transações relacionadas
        const allTransactions = await StorageService.getTransactions();
        const related = allTransactions.filter(t => t.installmentId === installmentId);
        setTransactions(related);
      }
    } catch (error) {
      console.error('Erro ao carregar parcelamento:', error);
    }
  };

  const handlePayInstallment = async (installmentNumber: number) => {
    if (!installment) return;

    try {
      // Criar transação para a parcela
      const transaction: Transaction = {
        id: `transaction_${Date.now()}`,
        type: 'expense',
        amount: installment.installmentValue,
        description: `${installment.description} (${installmentNumber}/${installment.totalInstallments})`,
        category: installment.category,
        date: new Date().toISOString(),
        installmentId: installment.id,
        installmentNumber: installmentNumber,
        paymentMethod: 'credit'
      };

      await StorageService.saveTransaction(transaction);

      // Atualizar parcelamento
      const updatedInstallment = {
        ...installment,
        paidInstallments: [...installment.paidInstallments, installmentNumber].sort((a, b) => a - b),
        currentInstallment: Math.max(installment.currentInstallment, installmentNumber + 1)
      };

      // Se for a última parcela, marcar como completo
      if (installmentNumber === installment.totalInstallments) {
        updatedInstallment.status = 'completed';
      }

      // Salvar atualização
      const allInstallments = await StorageService.getInstallments();
      const index = allInstallments.findIndex(i => i.id === installmentId);
      allInstallments[index] = updatedInstallment;
      await StorageService.setInstallments(allInstallments);

      setShowPayModal(false);
      loadInstallmentData();

      Alert.alert(
        'Sucesso',
        `Parcela ${installmentNumber} paga com sucesso!`
      );
    } catch (error) {
      Alert.alert('Erro', 'Erro ao registrar pagamento');
    }
  };

  const handleDeleteInstallment = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Deseja realmente excluir este parcelamento? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const allInstallments = await StorageService.getInstallments();
              const filtered = allInstallments.filter(i => i.id !== installmentId);
              await StorageService.setInstallments(filtered);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erro', 'Erro ao excluir parcelamento');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  if (!installment) {
    return (
      <Container>
        <View style={styles.loading}>
          <Text>Carregando...</Text>
        </View>
      </Container>
    );
  }

  const progress = (installment.paidInstallments.length / installment.totalInstallments) * 100;
  const remainingAmount = (installment.totalInstallments - installment.paidInstallments.length) * installment.installmentValue;
  const today = new Date();

  const renderInstallmentItem = (installmentNumber: number) => {
    const isPaid = installment.paidInstallments.includes(installmentNumber);
    const transaction = transactions.find(t => t.installmentNumber === installmentNumber);

    return (
      <TouchableOpacity
        key={installmentNumber}
        style={[
          styles.installmentItem,
          isPaid && styles.installmentItemPaid,
        ]}
        onPress={() => {
          if (!isPaid) {
            setSelectedInstallmentNumber(installmentNumber);
            setShowPayModal(true);
          }
        }}
        disabled={isPaid}
      >
        <View style={styles.installmentItemLeft}>
          <View style={[
            styles.installmentIcon,
            isPaid && styles.installmentIconPaid,
          ]}>
            <Ionicons 
              name={isPaid ? "checkmark-circle" : "ellipse-outline"} 
              size={20} 
              color={isPaid ? colors.success : colors.textSecondary} 
            />
          </View>
          <View>
            <Text style={[
              styles.installmentItemTitle,
              isPaid && styles.installmentItemTitlePaid
            ]}>
              Parcela {installmentNumber}/{installment.totalInstallments}
            </Text>
            <Text style={styles.installmentItemDate}>
              {isPaid && transaction ? 
                `Paga em ${formatDate(transaction.date)}` :
                `Pendente`
              }
            </Text>
          </View>
        </View>
        <MoneyText 
          value={installment.installmentValue} 
          size="small"
          showSign={false}
          style={isPaid ? styles.paidAmount : undefined}
        />
      </TouchableOpacity>
    );
  };

  return (
    <Container>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card variant="primary" style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>{installment.description}</Text>
              <Text style={styles.headerStore}>{installment.store}</Text>
            </View>
            <TouchableOpacity onPress={handleDeleteInstallment}>
              <Ionicons name="trash" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.headerAmounts}>
            <View>
              <Text style={styles.amountLabel}>Valor Total</Text>
              <MoneyText 
                value={installment.totalAmount} 
                size="large" 
                showSign={false}
                style={styles.whiteText}
              />
            </View>
            <View style={styles.rightAlign}>
              <Text style={styles.amountLabel}>Restante</Text>
              <MoneyText 
                value={remainingAmount} 
                size="large" 
                showSign={false}
                style={styles.whiteText}
              />
            </View>
          </View>

          <ProgressBar 
            progress={progress} 
            style={styles.progressBar}
            color={colors.white}
            backgroundColor="rgba(255,255,255,0.3)"
          />

          <View style={styles.headerFooter}>
            <Text style={styles.headerFooterText}>
              {installment.paidInstallments.length} de {installment.totalInstallments} parcelas pagas
            </Text>
            <Text style={styles.headerFooterText}>
              {installment.status === 'completed' ? 'Concluído' : 
               `${installment.totalInstallments - installment.paidInstallments.length} restantes`}
            </Text>
          </View>
        </Card>

        {/* Status Summary */}
        <View style={styles.summaryCards}>
          <Card style={styles.summaryCard}>
            <Ionicons name="card" size={24} color={colors.primary} />
            <Text style={styles.summaryLabel}>Valor da Parcela</Text>
            <MoneyText value={installment.installmentValue} size="medium" showSign={false} />
          </Card>

          <Card style={styles.summaryCard}>
            <Ionicons name="calendar" size={24} color={colors.primary} />
            <Text style={styles.summaryLabel}>Status</Text>
            <Text style={styles.summaryValue}>
              {installment.status === 'completed' ? 'Quitado' : 'Ativo'}
            </Text>
          </Card>
        </View>

        {/* Installments List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Histórico de Parcelas</Text>
          {Array.from({ length: installment.totalInstallments }, (_, i) => i + 1).map(renderInstallmentItem)}
        </View>

        {/* Quick Actions */}
        {installment.status === 'active' && (
          <View style={styles.quickActions}>
            <Button
              title="Pagar Próxima Parcela"
              onPress={() => {
                const nextUnpaid = Array.from({ length: installment.totalInstallments }, (_, i) => i + 1)
                  .find(n => !installment.paidInstallments.includes(n));
                if (nextUnpaid) {
                  setSelectedInstallmentNumber(nextUnpaid);
                  setShowPayModal(true);
                }
              }}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Pay Modal */}
      <Modal
        visible={showPayModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPayModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Pagamento</Text>
            <Text style={styles.modalText}>
              Confirma o pagamento da parcela {selectedInstallmentNumber} no valor de:
            </Text>
            <MoneyText 
              value={installment.installmentValue} 
              size="large" 
              showSign={false}
              style={styles.modalAmount}
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => setShowPayModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Confirmar"
                onPress={() => handlePayInstallment(selectedInstallmentNumber)}
                variant="primary"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  headerStore: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  headerAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 4,
  },
  whiteText: {
    color: colors.white,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  progressBar: {
    marginBottom: 16,
  },
  headerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerFooterText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  summaryCards: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  installmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  installmentItemPaid: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  installmentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  installmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  installmentIconPaid: {
    backgroundColor: colors.success + '20',
  },
  installmentItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  installmentItemTitlePaid: {
    color: colors.success,
  },
  installmentItemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  paidAmount: {
    color: colors.success,
  },
  quickActions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    width: '100%',
  },
  bottomSpacer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  modalAmount: {
    textAlign: 'center',
    marginBottom: 24,
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
});