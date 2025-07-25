/**
 * Text Component - Design System
 * 
 * Componente de texto universal compatível com React Native e Web
 */

import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { typography, colors, TypographyVariant } from '../../tokens';

export interface TextProps extends RNTextProps {
  /** Variante tipográfica */
  variant?: TypographyVariant | 'caption' | 'overline' | 'mono';
  
  /** Tamanho específico para variantes que têm sub-tamanhos */
  size?: 'small' | 'medium' | 'large';
  
  /** Cor do texto */
  color?: 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'disabled' | 'success' | 'warning' | 'error' | 'inherit';
  
  /** Alinhamento do texto */
  align?: 'left' | 'center' | 'right' | 'justify';
  
  /** Peso da fonte customizado */
  weight?: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';
  
  /** Se o texto deve ser truncado */
  truncate?: boolean;
  
  /** Número máximo de linhas */
  numberOfLines?: number;
  
  /** Estilo customizado */
  style?: any;
  
  /** Conteúdo do texto */
  children: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  size = 'medium',
  color = 'primary',
  align = 'left',
  weight,
  truncate = false,
  numberOfLines,
  style,
  children,
  ...props
}) => {
  const textStyles = getTextStyles(variant, size, color, align, weight, truncate);

  return (
    <RNText
      style={[textStyles, style]}
      numberOfLines={truncate ? 1 : numberOfLines}
      ellipsizeMode={truncate ? 'tail' : undefined}
      {...props}
    >
      {children}
    </RNText>
  );
};

// Função para calcular estilos do texto baseado nas props
const getTextStyles = (
  variant: TextProps['variant'],
  size: TextProps['size'],
  color: TextProps['color'],
  align: TextProps['align'],
  weight?: TextProps['weight'],
  truncate?: boolean
) => {
  // Estilos tipográficos baseados na variante
  let typographyStyle: any = {};
  
  if (variant === 'caption') {
    typographyStyle = typography.caption;
  } else if (variant === 'overline') {
    typographyStyle = typography.overline;
  } else if (variant === 'mono') {
    typographyStyle = typography.mono[size || 'medium'];
  } else if (variant && typography[variant]) {
    const variantStyles = typography[variant];
    if (typeof variantStyles === 'object' && size && variantStyles[size]) {
      typographyStyle = variantStyles[size];
    } else if (typeof variantStyles === 'object' && 'fontSize' in variantStyles) {
      typographyStyle = variantStyles;
    }
  }

  // Cores baseadas na prop color
  const colorStyles = {
    primary: { color: colors.light.text.primary },
    secondary: { color: colors.light.text.secondary },
    tertiary: { color: colors.light.text.tertiary },
    inverse: { color: colors.light.text.inverse },
    disabled: { color: colors.light.text.disabled },
    success: { color: colors.semantic.success },
    warning: { color: colors.semantic.warning },
    error: { color: colors.semantic.error },
    inherit: {}, // Herda a cor do componente pai
  };

  // Alinhamento do texto
  const alignStyles = {
    left: { textAlign: 'left' as const },
    center: { textAlign: 'center' as const },
    right: { textAlign: 'right' as const },
    justify: { textAlign: 'justify' as const },
  };

  // Peso da fonte customizado (sobrescreve o da variante)
  const weightStyle = weight ? {
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    }[weight] as any
  } : {};

  // Estilo para texto truncado
  const truncateStyle = truncate ? {
    overflow: 'hidden',
  } : {};

  return {
    ...typographyStyle,
    ...colorStyles[color || 'primary'],
    ...alignStyles[align || 'left'],
    ...weightStyle,
    ...truncateStyle,
  };
};