/**
 * TransactionCard Component - Design System
 * 
 * Componente específico para exibir transações financeiras
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../Card';
import { Text } from '../Text';
import { tokens, colors, transaction as transactionColors } from '../../tokens';

export interface TransactionCardProps {
  /** ID da transação */
  id: string;
  
  /** Tipo da transação */
  type: 'income' | 'expense';
  
  /** Descrição da transação */
  description: string;
  
  /** Valor da transação */
  amount: number;
  
  /** Categoria da transação */
  category?: string;
  
  /** Data da transação */
  date: Date;
  
  /** Ícone da categoria */
  categoryIcon?: React.ReactNode;
  
  /** Se o card está selecionado */
  selected?: boolean;
  
  /** Callback quando o card é pressionado */
  onPress?: (id: string) => void;
  
  /** Callback quando o card é pressionado longamente */
  onLongPress?: (id: string) => void;
  
  /** Estilo customizado */
  style?: any;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  id,
  type,
  description,
  amount,
  category,
  date,
  categoryIcon,
  selected = false,
  onPress,
  onLongPress,
  style,
}) => {
  const isIncome = type === 'income';
  const amountColor = isIncome 
    ? transactionColors.income.main 
    : transactionColors.expense.main;

  const formatAmount = (value: number) => {
    const prefix = isIncome ? '+' : '-';
    return `${prefix} R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  const handlePress = () => {
    onPress?.(id);
  };

  const handleLongPress = () => {
    onLongPress?.(id);
  };

  return (
    <Card
      variant={selected ? 'elevated' : 'outlined'}
      padding="medium"
      pressable={!!onPress || !!onLongPress}
      onPress={handlePress}
      onLongPress={handleLongPress}
      backgroundColor={selected ? colors.brand.primary + '10' : undefined}
      style={[
        styles.container,
        selected && styles.selected,
        style
      ]}
    >
      <View style={styles.content}>
        {/* Ícone da categoria */}
        <View style={styles.iconContainer}>
          {categoryIcon || (
            <View style={[
              styles.defaultIcon,
              { backgroundColor: isIncome ? transactionColors.income.light : transactionColors.expense.light }
            ]}>
              <Text variant="body" size="small" weight="semibold">
                {category?.charAt(0)?.toUpperCase() || (isIncome ? '+' : '-')}
              </Text>
            </View>
          )}
        </View>

        {/* Informações principais */}
        <View style={styles.mainInfo}>
          <Text 
            variant="title" 
            size="medium" 
            weight="semibold"
            truncate
            style={styles.description}
          >
            {description}
          </Text>
          
          {category && (
            <Text 
              variant="body" 
              size="small" 
              color="secondary"
              truncate
              style={styles.category}
            >
              {category}
            </Text>
          )}
          
          <Text 
            variant="body" 
            size="small" 
            color="tertiary"
            style={styles.date}
          >
            {formatDate(date)}
          </Text>
        </View>

        {/* Valor */}
        <View style={styles.amountContainer}>
          <Text 
            variant="title" 
            size="medium" 
            weight="bold"
            color="inherit"
            style={[
              styles.amount,
              { color: amountColor }
            ]}
          >
            {formatAmount(amount)}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: tokens.space.xs / 2,
  },
  selected: {
    borderColor: colors.brand.primary,
    borderWidth: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultIcon: {
    width: 40,
    height: 40,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainInfo: {
    flex: 1,
    gap: tokens.space.xs / 2,
  },
  description: {
    marginBottom: 2,
  },
  category: {
    marginBottom: 2,
  },
  date: {
    marginTop: 2,
  },
  amountContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    textAlign: 'right',
  },
});