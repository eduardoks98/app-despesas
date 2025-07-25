/**
 * Design Tokens - Tipografia
 * 
 * Sistema de tipografia baseado em Material Design 3
 * Compatível com React Native e Web
 */

// Famílias de fontes
export const fontFamilies = {
  // Sistema padrão (fallbacks incluídos)
  system: {
    ios: 'SF Pro Display',
    android: 'Roboto',
    web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  
  // Fontes monospace para código/números
  mono: {
    ios: 'SF Mono',
    android: 'Roboto Mono',
    web: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", monospace'
  }
} as const;

// Pesos das fontes
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800'
} as const;

// Tamanhos de fonte (escala modular 1.25)
export const fontSizes = {
  xs: 12,    // Caption, labels pequenos
  sm: 14,    // Body pequeno, labels
  base: 16,  // Body padrão
  lg: 18,    // Body grande
  xl: 20,    // Títulos pequenos
  '2xl': 24, // Títulos médios
  '3xl': 28, // Títulos grandes
  '4xl': 32, // Display pequeno
  '5xl': 40, // Display médio
  '6xl': 48  // Display grande
} as const;

// Alturas de linha (line-height)
export const lineHeights = {
  tight: 1.1,   // Títulos grandes
  snug: 1.2,    // Títulos
  normal: 1.4,  // Texto normal
  relaxed: 1.5, // Texto longo
  loose: 1.6    // Texto muito longo
} as const;

// Espaçamento entre letras
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em'
} as const;

// Tokens de tipografia semânticos
export const typography = {
  // Display - Para títulos de página principais
  display: {
    large: {
      fontSize: fontSizes['6xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacing.tight
    },
    medium: {
      fontSize: fontSizes['5xl'],
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacing.tight
    },
    small: {
      fontSize: fontSizes['4xl'],
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacing.normal
    }
  },

  // Headlines - Para títulos de seções
  headline: {
    large: {
      fontSize: fontSizes['3xl'],
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontSize: fontSizes['2xl'],
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.snug,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    }
  },

  // Title - Para títulos de cards e componentes
  title: {
    large: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.wide
    }
  },

  // Body - Para texto de conteúdo
  body: {
    large: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.relaxed,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    }
  },

  // Label - Para labels e botões
  label: {
    large: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.wide
    },
    medium: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.wide
    },
    small: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.wider
    }
  },

  // Caption - Para textos auxiliares pequenos
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.regular,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.wide
  },

  // Overline - Para textos de categoria/seção
  overline: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.widest,
    textTransform: 'uppercase' as const
  },

  // Mono - Para valores monetários e códigos
  mono: {
    large: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    medium: {
      fontSize: fontSizes.base,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    },
    small: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.normal,
      letterSpacing: letterSpacing.normal
    }
  }
} as const;

// Utilitários para React Native
export const fontFamilyRN = {
  system: fontFamilies.system.ios, // React Native usa iOS como padrão
  mono: fontFamilies.mono.ios
} as const;

// Tipos TypeScript
export type FontSize = keyof typeof fontSizes;
export type FontWeight = keyof typeof fontWeights;
export type LineHeight = keyof typeof lineHeights;
export type LetterSpacing = keyof typeof letterSpacing;
export type TypographyVariant = keyof typeof typography;