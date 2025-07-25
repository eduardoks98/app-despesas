import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { MoneyText } from '../common/MoneyText';
import { ProgressBar } from '../common/ProgressBar';
import { colors } from '../../styles/colors';
import { Installment } from '../../types';

interface InstallmentCardProps {
  installment: Installment;
  onPress: () => void;
}

export const InstallmentCard: React.FC<InstallmentCardProps> = ({ 
  installment, 
  onPress 
}) => {
  const progress = (installment.paidInstallments.length / installment.totalInstallments) * 100;
  const remainingInstallments = installment.totalInstallments - installment.paidInstallments.length;
  const remainingAmount = remainingInstallments * installment.installmentValue;
  
  const endDate = new Date(installment.endDate);
  const isOverdue = installment.status === 'active' && new Date() > endDate;

  return (
    <Card onPress={onPress} variant={isOverdue ? 'danger' : 'default'}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{installment.description}</Text>
          <Text style={styles.store}>{installment.store}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {installment.paidInstallments.length}/{installment.totalInstallments}
          </Text>
        </View>
      </View>

      <View style={styles.amounts}>
        <View>
          <Text style={styles.label}>Parcela</Text>
          <MoneyText value={installment.installmentValue} size="medium" showSign={false} />
        </View>
        <View style={styles.rightAlign}>
          <Text style={styles.label}>Restante</Text>
          <MoneyText value={remainingAmount} size="medium" showSign={false} />
        </View>
      </View>

      <ProgressBar progress={progress} style={styles.progressBar} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {remainingInstallments} parcelas restantes
        </Text>
        <Text style={styles.footerText}>
          {installment.status === 'completed' ? 'Concluído' : 
           `${installment.totalInstallments - installment.paidInstallments.length} restantes`}
        </Text>
      </View>

      {isOverdue && (
        <View style={styles.overdueAlert}>
          <Text style={styles.overdueText}>⚠️ Parcelamento vencido</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  store: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statusBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  progressBar: {
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  overdueAlert: {
    marginTop: 12,
    padding: 8,
    backgroundColor: colors.dangerLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  overdueText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: '600',
  },
});