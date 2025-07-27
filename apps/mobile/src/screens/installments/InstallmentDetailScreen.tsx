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
import { StorageService } from '../../services/core';
import { HapticService } from '../../services/platform';
import { Installment, Transaction } from '../../types';
import { colors } from '../../styles/colors';
import { SPACING, FONT_SIZES } from '../../styles/responsive';

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
      console.log('Carregando parcelamento com ID:', installmentId);
      const installments = await StorageService.getInstallments();
      console.log('Parcelamentos carregados:', installments);
      
      // Buscar parcelamento independente do status (pode ser 'active' ou 'completed')
      let found = installments.find(i => i.id === installmentId);
      
      // Se não encontrou com o ID direto, verificar se o ID passado é de uma transação
      if (!found && installmentId.startsWith('transaction_')) {
        console.log('ID parece ser de transação, tentando encontrar parcelamento relacionado...');
        const allTransactions = await StorageService.getTransactions();
        const transaction = allTransactions.find(t => t.id === installmentId);
        
        if (transaction && transaction.installmentId) {
          console.log('Transação encontrada, buscando parcelamento:', transaction.installmentId);
          found = installments.find(i => i.id === transaction.installmentId);
        }
      }
      
      if (found) {
        console.log('Parcelamento encontrado:', found);
        setInstallment(found);
        
        // Carregar transações relacionadas
        const allTransactions = await StorageService.getTransactions();
        const related = allTransactions.filter(t => t.installmentId === found.id);
        console.log('Transações relacionadas:', related);
        setTransactions(related);
      } else {
        console.error('Parcelamento não encontrado com ID:', installmentId);
        console.error('IDs de parcelamentos disponíveis:', installments.map(i => i.id));
        console.error('Total de parcelamentos:', installments.length);
        Alert.alert('Erro', `Parcelamento não encontrado.\nID procurado: ${installmentId}\nTotal disponível: ${installments.length}`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar parcelamento:', error);
      Alert.alert('Erro', 'Erro ao carregar dados do parcelamento', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const handlePayInstallment = async (installmentNumber: number) => {
    if (!installment) return;

    // VALIDAÇÃO SEQUENCIAL: Verificar se todas as parcelas anteriores foram pagas
    const previousInstallments = Array.from({ length: installmentNumber - 1 }, (_, i) => i + 1);
    const unpaidPrevious = previousInstallments.filter(n => !installment.paidInstallments.includes(n));
    
    if (unpaidPrevious.length > 0) {
      Alert.alert(
        'Parcelas Anteriores Pendentes',
        `Você precisa pagar as parcelas ${unpaidPrevious.join(', ')} antes de pagar a parcela ${installmentNumber}.`,
        [{ text: 'OK' }]
      );
      return;
    }

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
        currentInstallment: Math.max(...installment.paidInstallments, installmentNumber) + 1
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


  const handleUndoPayment = async (installmentNumber: number) => {
    Alert.alert(
      'Desfazer Pagamento',
      `Deseja desfazer o pagamento da parcela ${installmentNumber}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desfazer',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remover a transação
              const allTransactions = await StorageService.getTransactions();
              const filtered = allTransactions.filter(t => 
                !(t.installmentId === installmentId && t.installmentNumber === installmentNumber)
              );
              await StorageService.setTransactions(filtered);

              // Atualizar o parcelamento
              const updatedInstallment = {
                ...installment!,
                paidInstallments: installment!.paidInstallments.filter(n => n !== installmentNumber),
                currentInstallment: Math.min(...installment!.paidInstallments.filter(n => n !== installmentNumber)) || 0,
                status: 'active' as const
              };

              const allInstallments = await StorageService.getInstallments();
              const index = allInstallments.findIndex(i => i.id === installmentId);
              allInstallments[index] = updatedInstallment;
              await StorageService.setInstallments(allInstallments);

              loadInstallmentData();
              Alert.alert('Sucesso', 'Pagamento desfeito com sucesso!');
            } catch (error) {
              Alert.alert('Erro', 'Erro ao desfazer pagamento');
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
    
    // Calcular data de vencimento da parcela
    const startDate = new Date(installment.startDate);
    const dueDate = new Date(startDate);
    dueDate.setMonth(startDate.getMonth() + installmentNumber - 1);
    
    // Verificar se pode pagar esta parcela (todas as anteriores devem estar pagas)
    const previousInstallments = Array.from({ length: installmentNumber - 1 }, (_, i) => i + 1);
    const canPay = previousInstallments.every(n => installment.paidInstallments.includes(n));
    const isBlocked = !isPaid && !canPay;
    
    // Verificar se a parcela está vencida
    const today = new Date();
    const isOverdue = !isPaid && dueDate < today;

    return (
      <TouchableOpacity
        key={installmentNumber}
        style={[
          styles.installmentItem,
          isPaid && styles.installmentItemPaid,
          isBlocked && styles.installmentItemBlocked,
          isOverdue && styles.installmentItemOverdue,
        ]}
        onPress={() => {
          if (!isPaid && canPay) {
            setSelectedInstallmentNumber(installmentNumber);
            setShowPayModal(true);
          } else if (isBlocked) {
            const unpaidPrevious = previousInstallments.filter(n => !installment.paidInstallments.includes(n));
            Alert.alert(
              'Parcelas Anteriores Pendentes',
              `Você precisa pagar as parcelas ${unpaidPrevious.join(', ')} antes de pagar a parcela ${installmentNumber}.`,
              [{ text: 'OK' }]
            );
          }
        }}
        onLongPress={() => {
          if (isPaid) {
            handleUndoPayment(installmentNumber);
          }
        }}
        disabled={false}
      >
        <View style={styles.installmentItemLeft}>
          <View style={[
            styles.installmentIcon,
            isPaid && styles.installmentIconPaid,
            isOverdue && styles.installmentIconOverdue,
          ]}>
            <Ionicons 
              name={
                isPaid ? "checkmark-circle" : 
                isBlocked ? "lock-closed" : 
                isOverdue ? "warning" :
                "ellipse-outline"
              } 
              size={20} 
              color={
                isPaid ? colors.success : 
                isBlocked ? colors.danger : 
                isOverdue ? colors.danger :
                colors.textSecondary
              } 
            />
          </View>
          <View>
            <Text style={[
              styles.installmentItemTitle,
              isPaid && styles.installmentItemTitlePaid,
              isBlocked && styles.installmentItemTitleBlocked,
              isOverdue && styles.installmentItemTitleOverdue
            ]}>
              Parcela {installmentNumber}/{installment.totalInstallments}
            </Text>
            <Text style={[
              styles.installmentItemDate,
              isBlocked && styles.installmentItemDateBlocked,
              isOverdue && styles.installmentItemDateOverdue
            ]}>
              {isPaid && transaction ? 
                `Paga em ${formatDate(transaction.date)}` :
                isBlocked ? 
                `Bloqueada - Pague as anteriores` :
                isOverdue ?
                `Vencida em ${formatDate(dueDate.toISOString())}` :
                `Vence em ${formatDate(dueDate.toISOString())}`
              }
            </Text>
          </View>
        </View>
        <MoneyText 
          value={installment.installmentValue} 
          size="small"
          showSign={false}
          style={isPaid ? styles.paidAmount : {}}
        />
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>Detalhes do Parcelamento</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={async () => {
            await HapticService.buttonPress();
            navigation.navigate('EditInstallment', { installmentId: installment.id });
          }}
        >
          <Ionicons name="create" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <Card variant="primary" style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoDetails}>
              <Text style={styles.infoTitle}>{installment.description}</Text>
              <Text style={styles.infoStore}>{installment.store}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {installment.status === 'completed' ? 'Quitado' : 'Ativo'}
              </Text>
            </View>
          </View>

          <View style={styles.amountsRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Valor Total</Text>
              <MoneyText 
                value={installment.totalAmount} 
                size="large" 
                showSign={false}
                style={styles.whiteText}
              />
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Por Parcela</Text>
              <MoneyText 
                value={installment.installmentValue} 
                size="large" 
                showSign={false}
                style={styles.whiteText}
              />
            </View>
            <View style={styles.amountItem}>
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

          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {installment.paidInstallments.length} de {installment.totalInstallments} parcelas pagas
            </Text>
            <Text style={styles.progressText}>
              {formatDate(installment.startDate)} - {formatDate(installment.endDate)}
            </Text>
          </View>
        </Card>

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
              style={styles.quickActionButton}
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
  infoCard: {
    marginTop: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDetails: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  infoStore: {
    fontSize: 14,
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
  amountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  amountItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  progressText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  headerAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerDates: {
    marginBottom: 20,
    gap: 8,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
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
  installmentItemBlocked: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    opacity: 0.6,
  },
  installmentItemOverdue: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
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
  installmentIconOverdue: {
    backgroundColor: colors.danger + '20',
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
  installmentItemTitleBlocked: {
    color: colors.danger,
  },
  installmentItemTitleOverdue: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  installmentItemDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  installmentItemDateBlocked: {
    color: colors.danger,
  },
  installmentItemDateOverdue: {
    color: colors.danger,
    fontWeight: 'bold',
  },
  paidAmount: {
    color: colors.success,
  },
  quickActions: {
    padding: 16,
    gap: 12,
  },
  quickActionButton: {
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

export default InstallmentDetailScreen;