/**
 * Design Tokens - Index
 * 
 * Exporta todos os tokens do design system
 */

// Tokens individuais
export * from './colors';
export * from './typography';
export * from './spacing';
export * from './shadows';
export * from './borders';
export * from './animations';

// Re-export dos tokens principais para facilitar o uso
import { colors } from './colors';
import { typography, fontSizes, fontWeights, lineHeights } from './typography';
import { spacing, componentSpacing, createSpacing } from './spacing';
import { shadows, shadowsRN, componentShadows } from './shadows';
import { borderRadius, borderWidths, componentBorders } from './borders';
import { durations, easings, transitions, createTransition } from './animations';

// Tema completo combinando todos os tokens
export const theme = {
  colors,
  typography,
  spacing,
  shadows,
  borders: {
    radius: borderRadius,
    widths: borderWidths,
    components: componentBorders,
  },
  animations: {
    durations,
    easings,
    transitions,
  },
  
  // Utilitários
  utils: {
    createSpacing,
    createTransition,
  },
} as const;

// Tema específico para React Native
export const themeRN = {
  colors,
  typography,
  spacing,
  shadows: shadowsRN,
  borders: {
    radius: borderRadius,
    widths: borderWidths,
    components: componentBorders,
  },
  animations: {
    durations,
    easings,
  },
  
  // Utilitários
  utils: {
    createSpacing,
  },
} as const;

// Tokens mais usados para acesso rápido
export const tokens = {
  // Cores mais comuns
  colors: {
    primary: colors.brand.primary,
    secondary: colors.brand.secondary,
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    error: colors.semantic.error,
    background: colors.light.background.primary,
    surface: colors.light.surface.primary,
    text: colors.light.text.primary,
  },
  
  // Tipografia mais comum
  text: {
    xs: typography.caption,
    sm: typography.body.small,
    base: typography.body.medium,
    lg: typography.body.large,
    xl: typography.headline.small,
    '2xl': typography.headline.medium,
    '3xl': typography.headline.large,
  },
  
  // Espaçamentos mais comuns
  space: {
    xs: spacing[2],   // 8px
    sm: spacing[4],   // 16px
    md: spacing[6],   // 24px
    lg: spacing[8],   // 32px
    xl: spacing[12],  // 48px
  },
  
  // Raios mais comuns
  radius: {
    sm: borderRadius.sm,     // 8px
    base: borderRadius.base, // 12px
    md: borderRadius.md,     // 16px
    lg: borderRadius.lg,     // 20px
    full: borderRadius.full, // 9999px
  },
  
  // Sombras mais comuns
  shadow: {
    sm: shadows.sm,
    base: shadows.base,
    md: shadows.md,
    lg: shadows.lg,
  },
  
  // Animações mais comuns
  transition: {
    fast: transitions.opacity,
    normal: transitions.all,
    slow: transitions.layout,
  },
} as const;

// Tipos principais
export type Theme = typeof theme;
export type ThemeRN = typeof themeRN;
export type Tokens = typeof tokens;

// Type helpers para usar nos componentes
export type ThemeColors = typeof colors;
export type ThemeSpacing = typeof spacing;
export type ThemeTypography = typeof typography;