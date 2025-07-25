import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors } from '../../styles/colors';
import { FONT_SIZES } from '../../styles/responsive';

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
    <Text 
      style={[
        styles.text,
        styles[size],
        isPositive ? styles.positive : styles.negative,
        style
      ]}
      numberOfLines={1}
      adjustsFontSizeToFit={true}
      minimumFontScale={0.5}
    >
      {displayValue}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  small: {
    fontSize: FONT_SIZES.md,
  },
  medium: {
    fontSize: FONT_SIZES.xl,
  },
  large: {
    fontSize: FONT_SIZES.xxl,
  },
  xlarge: {
    fontSize: FONT_SIZES.title,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.danger,
  },
});