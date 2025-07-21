import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../../types';
import { MoneyText } from '../common/MoneyText';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, ICON_SIZES, moderateScale } from '../../styles/responsive';
import { getCategoryIcon } from '../../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  onPress: () => void;
  onLongPress?: () => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ 
  transaction, 
  onPress,
  onLongPress 
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Função getCategoryIcon removida - agora usa a importada de formatters.ts

  const getPaymentMethodIcon = (method?: string) => {
    const iconMap: { [key: string]: string } = {
      'cash': 'cash',
      'debit': 'card',
      'credit': 'card',
      'pix': 'flash',
    };
    return iconMap[method || 'cash'] || 'card';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        transaction.type === 'income' && styles.incomeContainer
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={[
          styles.iconContainer,
          transaction.type === 'income' ? styles.incomeIcon : styles.expenseIcon
        ]}>
          <Ionicons 
            name={getCategoryIcon(transaction.category) as any} 
            size={ICON_SIZES.md} 
            color={transaction.type === 'income' ? colors.success : colors.text} 
          />
        </View>
        
        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.metadata}>
            <Text style={styles.category} numberOfLines={1}>
              {transaction.category}
            </Text>
            {transaction.installmentNumber && (
              <>
                <Text style={styles.separator}>•</Text>
                <Text style={styles.installment}>
                  {transaction.installmentNumber}ª parcela
                </Text>
              </>
            )}
          </View>
          <View style={styles.paymentInfo}>
            <Ionicons 
              name={getPaymentMethodIcon(transaction.paymentMethod) as any} 
              size={ICON_SIZES.xs} 
              color={colors.textSecondary} 
            />
            <Text style={styles.paymentMethod}>
              {transaction.paymentMethod === 'cash' ? 'Dinheiro' :
               transaction.paymentMethod === 'debit' ? 'Débito' :
               transaction.paymentMethod === 'credit' ? 'Crédito' :
               transaction.paymentMethod === 'pix' ? 'PIX' : 'Outro'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightContent}>
        <MoneyText 
          value={transaction.type === 'income' ? transaction.amount : -transaction.amount}
          size="medium"
          showSign={false}
          style={transaction.type === 'income' ? styles.incomeAmount : styles.expenseAmount}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.time}>
            {formatTime(transaction.date)}
          </Text>
          <Text style={styles.date}>
            {formatDate(transaction.date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const iconContainerSize = moderateScale(40);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
    padding: SPACING.md,
    borderRadius: moderateScale(12),
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  incomeContainer: {
    borderLeftColor: colors.success,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0, // Permite quebra de texto
  },
  iconContainer: {
    width: iconContainerSize,
    height: iconContainerSize,
    borderRadius: iconContainerSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  incomeIcon: {
    backgroundColor: colors.successLight,
  },
  expenseIcon: {
    backgroundColor: colors.background,
  },
  details: {
    flex: 1,
    minWidth: 0, // Permite quebra de texto
  },
  description: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: SPACING.xs / 2,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs / 2,
  },
  category: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    flexShrink: 1, // Permite compressão
  },
  separator: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
    marginHorizontal: SPACING.xs / 2,
    flexShrink: 0, // Não comprime o separador
  },
  installment: {
    fontSize: FONT_SIZES.sm,
    color: colors.primary,
    fontWeight: '500',
    flexShrink: 1, // Permite compressão
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  paymentMethod: {
    fontSize: FONT_SIZES.xs,
    color: colors.textSecondary,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  incomeAmount: {
    color: colors.success,
  },
  expenseAmount: {
    color: colors.text,
  },
  timeContainer: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  date: {
    fontSize: 10,
    color: colors.textTertiary,
  },
});