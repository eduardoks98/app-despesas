/**
 * Design Tokens - Sombras e Elevação
 * 
 * Sistema de sombras baseado em Material Design 3
 * Compatível com React Native e Web
 */

// Sombras para Web (CSS box-shadow)
export const shadows = {
  none: 'none',
  
  // Elevação 1 - Botões, inputs em foco
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  
  // Elevação 2 - Cards pequenos, dropdowns
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  
  // Elevação 3 - Cards médios, tooltips
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  
  // Elevação 4 - Cards grandes, navigation drawer
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  // Elevação 5 - Modais, sheets
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // Elevação 6 - Overlays, floating action buttons
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Sombra interna
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Sombras coloridas para destaque
  primary: '0 4px 14px 0 rgba(102, 126, 234, 0.25)',
  success: '0 4px 14px 0 rgba(40, 167, 69, 0.25)',
  warning: '0 4px 14px 0 rgba(255, 193, 7, 0.25)',
  error: '0 4px 14px 0 rgba(220, 53, 69, 0.25)',
} as const;

// Sombras para React Native
export const shadowsRN = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  // Elevação 1
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Elevação 2
  base: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // Elevação 3
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  
  // Elevação 4
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 4,
  },
  
  // Elevação 5
  xl: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 5,
  },
  
  // Elevação 6
  '2xl': {
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 50,
    elevation: 6,
  },
} as const;

// Elevações semânticas por componente
export const componentShadows = {
  // Componentes básicos
  button: {
    rest: shadows.sm,
    hover: shadows.base,
    pressed: shadows.none,
  },
  
  // Cards
  card: {
    flat: shadows.none,
    raised: shadows.base,
    elevated: shadows.md,
  },
  
  // Inputs
  input: {
    rest: shadows.none,
    focus: shadows.sm,
    error: shadows.error,
  },
  
  // Navegação
  navigation: {
    tab: shadows.sm,
    drawer: shadows.lg,
    appBar: shadows.base,
  },
  
  // Overlays
  modal: shadows.xl,
  dropdown: shadows.md,
  tooltip: shadows.base,
  popover: shadows.lg,
  
  // Floating elements
  fab: shadows['2xl'],
  snackbar: shadows.lg,
  
  // Transações específicas
  transaction: {
    card: shadows.base,
    highlight: shadows.primary,
  },
} as const;

// Versões React Native dos componentes
export const componentShadowsRN = {
  button: {
    rest: shadowsRN.sm,
    hover: shadowsRN.base,
    pressed: shadowsRN.none,
  },
  
  card: {
    flat: shadowsRN.none,
    raised: shadowsRN.base,
    elevated: shadowsRN.md,
  },
  
  input: {
    rest: shadowsRN.none,
    focus: shadowsRN.sm,
  },
  
  navigation: {
    tab: shadowsRN.sm,
    drawer: shadowsRN.lg,
    appBar: shadowsRN.base,
  },
  
  modal: shadowsRN.xl,
  dropdown: shadowsRN.md,
  fab: shadowsRN['2xl'],
  
  transaction: {
    card: shadowsRN.base,
  },
} as const;

// Utilitário para criar sombra customizada no React Native
export const createShadowRN = (
  elevation: number,
  opacity: number = 0.1,
  offset: { width: number; height: number } = { width: 0, height: elevation / 2 }
) => ({
  shadowOffset: offset,
  shadowOpacity: opacity,
  shadowRadius: elevation * 2,
  elevation,
  shadowColor: '#000000',
});

// Utilitário para criar sombra customizada na Web
export const createShadowWeb = (
  x: number = 0,
  y: number = 4,
  blur: number = 8,
  spread: number = 0,
  color: string = 'rgba(0, 0, 0, 0.1)'
) => `${x}px ${y}px ${blur}px ${spread}px ${color}`;

// Tipos TypeScript
export type ShadowKey = keyof typeof shadows;
export type ShadowRNKey = keyof typeof shadowsRN;
export type ComponentShadowKey = keyof typeof componentShadows;