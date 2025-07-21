import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../../types';
import { MoneyText } from '../common/MoneyText';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

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

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      'Alimentação': 'restaurant',
      'Transporte': 'car',
      'Moradia': 'home',
      'Saúde': 'medical',
      'Educação': 'school',
      'Lazer': 'game-controller',
      'Compras': 'bag',
      'Salário': 'wallet',
      'Freelance': 'laptop',
      'Investimentos': 'trending-up',
    };
    return iconMap[category] || 'ellipse';
  };

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
            size={20} 
            color={transaction.type === 'income' ? colors.success : colors.text} 
          />
        </View>
        
        <View style={styles.details}>
          <Text style={styles.description} numberOfLines={1}>
            {transaction.description}
          </Text>
          <View style={styles.metadata}>
            <Text style={styles.category}>
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
              size={12} 
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
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
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  incomeIcon: {
    backgroundColor: colors.successLight,
  },
  expenseIcon: {
    backgroundColor: colors.background,
  },
  details: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  separator: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 6,
  },
  installment: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethod: {
    fontSize: 11,
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