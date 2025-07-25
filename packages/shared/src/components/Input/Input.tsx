/**
 * Input Component - Design System
 * 
 * Componente de input universal compatível com React Native e Web
 */

import React, { useState } from 'react';
import { 
  View, 
  TextInput, 
  TextInputProps, 
  StyleSheet,
  ViewStyle 
} from 'react-native';
import { Text } from '../Text';
import { tokens, colors, componentBorders } from '../../tokens';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Label do input */
  label?: string;
  
  /** Texto de ajuda abaixo do input */
  helperText?: string;
  
  /** Mensagem de erro */
  errorMessage?: string;
  
  /** Se o input tem erro */
  hasError?: boolean;
  
  /** Ícone à esquerda */
  leftIcon?: React.ReactNode;
  
  /** Ícone à direita */
  rightIcon?: React.ReactNode;
  
  /** Tamanho do input */
  size?: 'small' | 'medium' | 'large';
  
  /** Variante visual */
  variant?: 'outlined' | 'filled';
  
  /** Se o input ocupa toda a largura */
  fullWidth?: boolean;
  
  /** Estilo customizado do container */
  containerStyle?: ViewStyle;
  
  /** Estilo customizado do input */
  style?: any;
  
  /** Estilo customizado do label */
  labelStyle?: any;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  hasError = false,
  leftIcon,
  rightIcon,
  size = 'medium',
  variant = 'outlined',
  fullWidth = true,
  disabled,
  containerStyle,
  style,
  labelStyle,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  const inputStyles = getInputStyles(
    variant, 
    size, 
    fullWidth, 
    disabled || false, 
    isFocused, 
    hasError || !!errorMessage
  );

  const handleFocus = (event: any) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: any) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const textColor = disabled 
    ? colors.light.text.disabled 
    : colors.light.text.primary;

  return (
    <View style={[inputStyles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text 
          variant="label" 
          size="medium"
          color={hasError || errorMessage ? 'error' : 'secondary'}
          style={[inputStyles.label, labelStyle]}
        >
          {label}
        </Text>
      )}

      {/* Input Container */}
      <View style={inputStyles.inputContainer}>
        {/* Left Icon */}
        {leftIcon && (
          <View style={inputStyles.leftIcon}>
            {leftIcon}
          </View>
        )}

        {/* Text Input */}
        <TextInput
          style={[inputStyles.input, style]}
          placeholderTextColor={colors.light.text.tertiary}
          selectionColor={colors.brand.primary}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <View style={inputStyles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>

      {/* Helper Text or Error Message */}
      {(helperText || errorMessage) && (
        <Text 
          variant="body" 
          size="small"
          color={errorMessage ? 'error' : 'secondary'}
          style={inputStyles.helperText}
        >
          {errorMessage || helperText}
        </Text>
      )}
    </View>
  );
};

// Função para calcular estilos do input baseado nas props
const getInputStyles = (
  variant: InputProps['variant'],
  size: InputProps['size'],
  fullWidth: boolean,
  disabled: boolean,
  focused: boolean,
  hasError: boolean
) => {
  // Padding baseado no tamanho
  const sizeStyles = {
    small: {
      paddingHorizontal: tokens.space.sm,
      paddingVertical: tokens.space.xs,
      minHeight: 32,
      fontSize: 14,
    },
    medium: {
      paddingHorizontal: tokens.space.md,
      paddingVertical: tokens.space.sm,
      minHeight: 40,
      fontSize: 16,
    },
    large: {
      paddingHorizontal: tokens.space.md,
      paddingVertical: tokens.space.md,
      minHeight: 48,
      fontSize: 16,
    },
  };

  // Determinar cor da borda
  let borderColor = colors.light.border.primary;
  if (hasError) {
    borderColor = colors.semantic.error;
  } else if (focused) {
    borderColor = colors.brand.primary;
  } else if (disabled) {
    borderColor = colors.light.border.secondary;
  }

  // Estilos baseados na variante
  const variantStyles = {
    outlined: {
      backgroundColor: disabled ? colors.light.background.disabled : 'transparent',
      borderWidth: focused || hasError ? 2 : 1,
      borderColor,
      borderRadius: componentBorders.input.default.radius,
    },
    filled: {
      backgroundColor: disabled 
        ? colors.light.background.disabled 
        : colors.light.background.secondary,
      borderWidth: 0,
      borderBottomWidth: focused || hasError ? 2 : 1,
      borderBottomColor: borderColor,
      borderRadius: 0,
    },
  };

  const widthStyle = fullWidth ? { width: '100%' } : {};

  return StyleSheet.create({
    container: {
      ...widthStyle,
    },
    label: {
      marginBottom: tokens.space.xs,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      ...variantStyles[variant || 'outlined'],
    },
    input: {
      flex: 1,
      ...sizeStyles[size || 'medium'],
      paddingHorizontal: 0, // O padding é aplicado no container
      color: disabled ? colors.light.text.disabled : colors.light.text.primary,
    },
    leftIcon: {
      marginLeft: tokens.space.sm,
      marginRight: tokens.space.xs,
    },
    rightIcon: {
      marginLeft: tokens.space.xs,
      marginRight: tokens.space.sm,
    },
    helperText: {
      marginTop: tokens.space.xs,
    },
  });
};