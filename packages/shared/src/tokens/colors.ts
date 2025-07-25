/**
 * Design Tokens - Cores
 * 
 * Sistema de cores centralizado baseado em Material Design 3
 * Compatível com React Native e Web
 */

// Cores primárias do brand
export const brand = {
  primary: '#667eea',
  primaryDark: '#4c63d1',
  primaryLight: '#8094f0',
  secondary: '#764ba2',
  secondaryDark: '#5d3a7f',
  secondaryLight: '#8e65b5',
} as const;

// Cores funcionais
export const semantic = {
  success: '#28a745',
  successLight: '#d4edda',
  successDark: '#1e7e34',
  
  warning: '#ffc107',
  warningLight: '#fff3cd',
  warningDark: '#e0a800',
  
  error: '#dc3545',
  errorLight: '#f8d7da',
  errorDark: '#c82333',
  
  info: '#17a2b8',
  infoLight: '#d1ecf1',
  infoDark: '#138496',
} as const;

// Escala de cinzas
export const gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
} as const;

// Temas claro e escuro
export const light = {
  // Backgrounds
  background: {
    primary: '#ffffff',
    secondary: '#f8f9fa',
    tertiary: gray[50],
    elevated: '#ffffff',
    disabled: gray[100],
  },
  
  // Superfícies
  surface: {
    primary: '#ffffff',
    secondary: gray[50],
    tertiary: gray[100],
    inverse: gray[900],
  },
  
  // Textos
  text: {
    primary: gray[900],
    secondary: gray[600],
    tertiary: gray[500],
    inverse: '#ffffff',
    disabled: gray[400],
    onPrimary: '#ffffff',
    onSecondary: gray[900],
  },
  
  // Bordas
  border: {
    primary: gray[200],
    secondary: gray[300],
    focus: brand.primary,
    error: semantic.error,
  },
  
  // Estados
  state: {
    hover: 'rgba(0, 0, 0, 0.05)',
    pressed: 'rgba(0, 0, 0, 0.1)',
    focus: 'rgba(102, 126, 234, 0.1)',
    disabled: 'rgba(0, 0, 0, 0.05)',
  },
} as const;

export const dark = {
  // Backgrounds
  background: {
    primary: gray[900],
    secondary: gray[800],
    tertiary: gray[700],
    elevated: gray[800],
    disabled: gray[700],
  },
  
  // Superfícies
  surface: {
    primary: gray[800],
    secondary: gray[700],
    tertiary: gray[600],
    inverse: gray[50],
  },
  
  // Textos
  text: {
    primary: gray[50],
    secondary: gray[300],
    tertiary: gray[400],
    inverse: gray[900],
    disabled: gray[500],
    onPrimary: '#ffffff',
    onSecondary: gray[50],
  },
  
  // Bordas
  border: {
    primary: gray[600],
    secondary: gray[500],
    focus: brand.primaryLight,
    error: semantic.error,
  },
  
  // Estados
  state: {
    hover: 'rgba(255, 255, 255, 0.05)',
    pressed: 'rgba(255, 255, 255, 0.1)',
    focus: 'rgba(128, 148, 240, 0.2)',
    disabled: 'rgba(255, 255, 255, 0.05)',
  },
} as const;

// Cores específicas para transações
export const transaction = {
  income: {
    main: semantic.success,
    light: semantic.successLight,
    dark: semantic.successDark,
    contrast: '#ffffff',
  },
  expense: {
    main: semantic.error,
    light: semantic.errorLight,
    dark: semantic.errorDark,
    contrast: '#ffffff',
  },
  neutral: {
    main: gray[500],
    light: gray[200],
    dark: gray[700],
    contrast: '#ffffff',
  },
} as const;

// Gradientes
export const gradients = {
  primary: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.secondary} 100%)`,
  secondary: `linear-gradient(135deg, ${brand.secondary} 0%, ${brand.primary} 100%)`,
  success: `linear-gradient(135deg, ${semantic.success} 0%, ${semantic.successDark} 100%)`,
  warning: `linear-gradient(135deg, ${semantic.warning} 0%, ${semantic.warningDark} 100%)`,
  error: `linear-gradient(135deg, ${semantic.error} 0%, ${semantic.errorDark} 100%)`,
  
  // Gradientes específicos React Native
  primaryRN: ['#667eea', '#764ba2'],
  secondaryRN: ['#764ba2', '#667eea'],
  successRN: ['#28a745', '#1e7e34'],
  warningRN: ['#ffc107', '#e0a800'],
  errorRN: ['#dc3545', '#c82333'],
} as const;

// Transparências úteis
export const alpha = {
  5: '0d',   // 5%
  10: '1a',  // 10%
  15: '26',  // 15%
  20: '33',  // 20%
  25: '40',  // 25%
  30: '4d',  // 30%
  40: '66',  // 40%
  50: '80',  // 50%
  60: '99',  // 60%
  70: 'b3',  // 70%
  80: 'cc',  // 80%
  90: 'e6',  // 90%
  95: 'f2',  // 95%
} as const;

// Utilitário para aplicar transparência
export const withAlpha = (color: string, opacity: keyof typeof alpha): string => {
  return `${color}${alpha[opacity]}`;
};

// Tipo para temas
export type Theme = typeof light;
export type ColorScheme = 'light' | 'dark';

// Export do sistema completo
export const colors = {
  brand,
  semantic,
  gray,
  light,
  dark,
  transaction,
  gradients,
  alpha,
  withAlpha,
} as const;