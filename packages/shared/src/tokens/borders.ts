/**
 * Design Tokens - Bordas e Raios
 * 
 * Sistema de bordas baseado em Material Design 3
 * Compatível com React Native e Web
 */

// Larguras de borda
export const borderWidths = {
  0: 0,
  1: 1,
  2: 2,
  4: 4,
  8: 8,
} as const;

// Raios de borda (border-radius)
export const borderRadius = {
  none: 0,
  xs: 4,      // Elementos pequenos
  sm: 8,      // Botões, inputs
  base: 12,   // Cards pequenos
  md: 16,     // Cards médios
  lg: 20,     // Cards grandes
  xl: 24,     // Modais, sheets
  '2xl': 32,  // Elementos especiais
  '3xl': 48,  // Elementos muito grandes
  full: 9999, // Circular/pill
} as const;

// Estilos de borda
export const borderStyles = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
  none: 'none',
} as const;

// Tokens semânticos por componente
export const componentBorders = {
  // Botões
  button: {
    primary: {
      width: borderWidths[0],
      radius: borderRadius.sm,
      style: borderStyles.none,
    },
    secondary: {
      width: borderWidths[1],
      radius: borderRadius.sm,
      style: borderStyles.solid,
    },
    outlined: {
      width: borderWidths[1],
      radius: borderRadius.sm,
      style: borderStyles.solid,
    },
    pill: {
      width: borderWidths[0],
      radius: borderRadius.full,
      style: borderStyles.none,
    },
  },

  // Cards
  card: {
    flat: {
      width: borderWidths[0],
      radius: borderRadius.base,
      style: borderStyles.none,
    },
    outlined: {
      width: borderWidths[1],
      radius: borderRadius.base,
      style: borderStyles.solid,
    },
    elevated: {
      width: borderWidths[0],
      radius: borderRadius.md,
      style: borderStyles.none,
    },
  },

  // Inputs
  input: {
    default: {
      width: borderWidths[1],
      radius: borderRadius.sm,
      style: borderStyles.solid,
    },
    focus: {
      width: borderWidths[2],
      radius: borderRadius.sm,
      style: borderStyles.solid,
    },
    error: {
      width: borderWidths[2],
      radius: borderRadius.sm,
      style: borderStyles.solid,
    },
    disabled: {
      width: borderWidths[1],
      radius: borderRadius.sm,
      style: borderStyles.dashed,
    },
  },

  // Navegação
  navigation: {
    tab: {
      width: borderWidths[0],
      radius: borderRadius.none,
      style: borderStyles.none,
    },
    pill: {
      width: borderWidths[0],
      radius: borderRadius.full,
      style: borderStyles.none,
    },
  },

  // Modais e overlays
  modal: {
    width: borderWidths[0],
    radius: borderRadius.xl,
    style: borderStyles.none,
  },

  sheet: {
    width: borderWidths[0],
    radius: `${borderRadius.xl}px ${borderRadius.xl}px 0 0`, // Apenas top
    style: borderStyles.none,
  },

  // Alertas e banners
  alert: {
    width: borderWidths[1],
    radius: borderRadius.sm,
    style: borderStyles.solid,
  },

  // Divisores
  divider: {
    horizontal: {
      width: `${borderWidths[1]}px 0 0 0`,
      radius: borderRadius.none,
      style: borderStyles.solid,
    },
    vertical: {
      width: `0 0 0 ${borderWidths[1]}px`,
      radius: borderRadius.none,
      style: borderStyles.solid,
    },
  },

  // Componentes específicos de transações
  transaction: {
    card: {
      width: borderWidths[0],
      radius: borderRadius.base,
      style: borderStyles.none,
    },
    categoryBadge: {
      width: borderWidths[1],
      radius: borderRadius.full,
      style: borderStyles.solid,
    },
    amountBadge: {
      width: borderWidths[0],
      radius: borderRadius.sm,
      style: borderStyles.none,
    },
  },

  // Avatars e imagens
  avatar: {
    square: {
      width: borderWidths[0],
      radius: borderRadius.sm,
      style: borderStyles.none,
    },
    rounded: {
      width: borderWidths[0],
      radius: borderRadius.base,
      style: borderStyles.none,
    },
    circular: {
      width: borderWidths[0],
      radius: borderRadius.full,
      style: borderStyles.none,
    },
  },

  // Badges e chips
  badge: {
    width: borderWidths[0],
    radius: borderRadius.full,
    style: borderStyles.none,
  },

  chip: {
    width: borderWidths[1],
    radius: borderRadius.full,
    style: borderStyles.solid,
  },
} as const;

// Utilitários para criar bordas customizadas
export const createBorder = (
  width: keyof typeof borderWidths,
  style: keyof typeof borderStyles,
  radius: keyof typeof borderRadius
) => ({
  borderWidth: borderWidths[width],
  borderStyle: borderStyles[style],
  borderRadius: borderRadius[radius],
});

// Utilitário para bordas específicas (top, right, bottom, left)
export const createSpecificBorder = (
  side: 'top' | 'right' | 'bottom' | 'left',
  width: keyof typeof borderWidths,
  style: keyof typeof borderStyles
) => ({
  [`border${side.charAt(0).toUpperCase() + side.slice(1)}Width`]: borderWidths[width],
  [`border${side.charAt(0).toUpperCase() + side.slice(1)}Style`]: borderStyles[style],
});

// Utilitário para React Native (que não suporta border-style)
export const createBorderRN = (
  width: keyof typeof borderWidths,
  radius: keyof typeof borderRadius
) => ({
  borderWidth: borderWidths[width],
  borderRadius: borderRadius[radius],
});

// Tipos TypeScript
export type BorderWidth = keyof typeof borderWidths;
export type BorderRadius = keyof typeof borderRadius;
export type BorderStyle = keyof typeof borderStyles;
export type ComponentBorderKey = keyof typeof componentBorders;