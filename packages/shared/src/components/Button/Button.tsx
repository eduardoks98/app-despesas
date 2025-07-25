/**
 * Button Component - Design System
 * 
 * Componente de botão universal compatível com React Native e Web
 */

import React from 'react';
import { 
  TouchableOpacity, 
  TouchableOpacityProps, 
  Text, 
  View, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { tokens, colors, componentShadowsRN, componentBorders } from '../../tokens';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  /** Texto do botão */
  title: string;
  
  /** Variante visual do botão */
  variant?: 'primary' | 'secondary' | 'outlined' | 'text' | 'danger';
  
  /** Tamanho do botão */
  size?: 'small' | 'medium' | 'large';
  
  /** Estado de carregamento */
  loading?: boolean;
  
  /** Ícone à esquerda do texto */
  leftIcon?: React.ReactNode;
  
  /** Ícone à direita do texto */
  rightIcon?: React.ReactNode;
  
  /** Largura total disponível */
  fullWidth?: boolean;
  
  /** Estilo customizado */
  style?: any;
  
  /** Estilo customizado do texto */
  textStyle?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const buttonStyles = getButtonStyles(variant, size, fullWidth, disabled || loading);
  const textStyles = getTextStyles(variant, size, disabled || loading);

  const handlePress = (event: any) => {
    if (loading || disabled) return;
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      style={[buttonStyles.container, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      <View style={buttonStyles.content}>
        {loading ? (
          <ActivityIndicator 
            size="small" 
            color={textStyles.color} 
            style={buttonStyles.loader}
          />
        ) : (
          <>
            {leftIcon && (
              <View style={buttonStyles.leftIcon}>
                {leftIcon}
              </View>
            )}
            
            <Text style={[textStyles, textStyle]}>
              {title}
            </Text>
            
            {rightIcon && (
              <View style={buttonStyles.rightIcon}>
                {rightIcon}
              </View>
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Função para calcular estilos do botão baseado nas props
const getButtonStyles = (
  variant: ButtonProps['variant'],
  size: ButtonProps['size'],
  fullWidth: boolean,
  disabled: boolean
) => {
  const baseStyle = {
    borderRadius: componentBorders.button[variant === 'text' ? 'primary' : 'secondary'].radius,
    borderWidth: variant === 'outlined' ? componentBorders.button.outlined.width : 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
  };

  // Padding baseado no tamanho
  const paddingStyles = {
    small: {
      paddingHorizontal: tokens.space.sm,
      paddingVertical: tokens.space.xs,
      minHeight: 32,
    },
    medium: {
      paddingHorizontal: tokens.space.md,
      paddingVertical: tokens.space.sm,
      minHeight: 40,
    },
    large: {
      paddingHorizontal: tokens.space.lg,
      paddingVertical: tokens.space.md,
      minHeight: 48,
    },
  };

  // Cores baseadas na variante
  const colorStyles = {
    primary: {
      backgroundColor: disabled ? colors.gray[300] : colors.brand.primary,
      borderColor: disabled ? colors.gray[300] : colors.brand.primary,
      ...componentShadowsRN.button.rest,
    },
    secondary: {
      backgroundColor: disabled ? colors.gray[100] : colors.gray[100],
      borderColor: disabled ? colors.gray[200] : colors.gray[300],
      ...componentShadowsRN.button.rest,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderColor: disabled ? colors.gray[300] : colors.brand.primary,
    },
    text: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    danger: {
      backgroundColor: disabled ? colors.gray[300] : colors.semantic.error,
      borderColor: disabled ? colors.gray[300] : colors.semantic.error,
      ...componentShadowsRN.button.rest,
    },
  };

  const widthStyle = fullWidth ? { width: '100%' } : {};

  return StyleSheet.create({
    container: {
      ...baseStyle,
      ...paddingStyles[size || 'medium'],
      ...colorStyles[variant || 'primary'],
      ...widthStyle,
      opacity: disabled ? 0.6 : 1,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    leftIcon: {
      marginRight: tokens.space.xs,
    },
    rightIcon: {
      marginLeft: tokens.space.xs,
    },
    loader: {
      marginHorizontal: tokens.space.xs,
    },
  }).container;
};

// Função para calcular estilos do texto baseado nas props
const getTextStyles = (
  variant: ButtonProps['variant'],
  size: ButtonProps['size'],
  disabled: boolean
) => {
  // Tamanho da fonte baseado no size
  const sizeStyles = {
    small: {
      fontSize: tokens.text.sm.fontSize,
      fontWeight: tokens.text.sm.fontWeight,
    },
    medium: {
      fontSize: tokens.text.base.fontSize,
      fontWeight: tokens.text.base.fontWeight,
    },
    large: {
      fontSize: tokens.text.lg.fontSize,
      fontWeight: tokens.text.lg.fontWeight,
    },
  };

  // Cor do texto baseada na variante
  const colorStyles = {
    primary: {
      color: disabled ? colors.gray[500] : colors.light.text.onPrimary,
    },
    secondary: {
      color: disabled ? colors.gray[400] : colors.light.text.primary,
    },
    outlined: {
      color: disabled ? colors.gray[400] : colors.brand.primary,
    },
    text: {
      color: disabled ? colors.gray[400] : colors.brand.primary,
    },
    danger: {
      color: disabled ? colors.gray[500] : colors.light.text.onPrimary,
    },
  };

  return {
    ...sizeStyles[size || 'medium'],
    ...colorStyles[variant || 'primary'],
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  };
};