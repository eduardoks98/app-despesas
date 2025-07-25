/**
 * Card Component - Design System
 * 
 * Componente de card universal compatível com React Native e Web
 */

import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { tokens, colors, componentShadowsRN, componentBorders } from '../../tokens';

export interface CardProps extends ViewProps {
  /** Variante visual do card */
  variant?: 'flat' | 'outlined' | 'elevated';
  
  /** Padding interno do card */
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  /** Se o card é pressionável */
  pressable?: boolean;
  
  /** Callback quando o card é pressionado */
  onPress?: () => void;
  
  /** Callback quando o card é pressionado longamente */
  onLongPress?: () => void;
  
  /** Cor de fundo customizada */
  backgroundColor?: string;
  
  /** Estilo customizado */
  style?: any;
  
  /** Conteúdo do card */
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'medium',
  pressable = false,
  onPress,
  onLongPress,
  backgroundColor,
  style,
  children,
  ...props
}) => {
  const cardStyles = getCardStyles(variant, padding, backgroundColor);

  if (pressable && (onPress || onLongPress)) {
    const TouchableComponent = require('react-native').TouchableOpacity;
    
    return (
      <TouchableComponent
        style={[cardStyles, style]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.95}
        {...props}
      >
        {children}
      </TouchableComponent>
    );
  }

  return (
    <View style={[cardStyles, style]} {...props}>
      {children}
    </View>
  );
};

// Função para calcular estilos do card baseado nas props
const getCardStyles = (
  variant: CardProps['variant'],
  padding: CardProps['padding'],
  backgroundColor?: string
) => {
  const baseStyle = {
    borderRadius: componentBorders.card[variant || 'elevated'].radius,
    borderWidth: componentBorders.card[variant || 'elevated'].width,
  };

  // Padding baseado na prop
  const paddingStyles = {
    none: {},
    small: {
      padding: tokens.space.sm,
    },
    medium: {
      padding: tokens.space.md,
    },
    large: {
      padding: tokens.space.lg,
    },
  };

  // Estilos baseados na variante
  const variantStyles = {
    flat: {
      backgroundColor: backgroundColor || colors.light.surface.primary,
      borderColor: 'transparent',
      ...componentShadowsRN.card.flat,
    },
    outlined: {
      backgroundColor: backgroundColor || colors.light.surface.primary,
      borderColor: colors.light.border.primary,
      ...componentShadowsRN.card.flat,
    },
    elevated: {
      backgroundColor: backgroundColor || colors.light.surface.primary,
      borderColor: 'transparent',
      ...componentShadowsRN.card.elevated,
    },
  };

  return {
    ...baseStyle,
    ...paddingStyles[padding || 'medium'],
    ...variantStyles[variant || 'elevated'],
  };
};