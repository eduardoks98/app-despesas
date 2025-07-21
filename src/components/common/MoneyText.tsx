import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../../styles/colors';

interface MoneyTextProps {
  value: number;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  showSign?: boolean;
  hideValue?: boolean;
  style?: TextStyle;
}

export const MoneyText: React.FC<MoneyTextProps> = ({ 
  value, 
  size = 'medium',
  showSign = true,
  hideValue = false,
  style 
}) => {
  const isPositive = value >= 0;
  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(value));

  const sign = showSign && value !== 0 ? (isPositive ? '+' : '-') : '';
  const displayValue = hideValue ? 'R$ ••••••' : `${sign}${formattedValue}`;

  return (
    <Text style={[
      styles.text,
      styles[size],
      isPositive ? styles.positive : styles.negative,
      style
    ]}>
      {displayValue}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: 'bold',
  },
  small: {
    fontSize: 14,
  },
  medium: {
    fontSize: 18,
  },
  large: {
    fontSize: 24,
  },
  xlarge: {
    fontSize: 32,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.text,
  },
});