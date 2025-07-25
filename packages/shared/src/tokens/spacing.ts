/**
 * Design Tokens - Espaçamento
 * 
 * Sistema de espaçamento baseado em múltiplos de 4px
 * Compatível com React Native e Web
 */

// Unidade base de espaçamento (4px)
const SPACING_UNIT = 4;

// Escala de espaçamento (múltiplos de 4px)
export const spacing = {
  0: 0,        // 0px
  1: SPACING_UNIT * 1,      // 4px
  2: SPACING_UNIT * 2,      // 8px
  3: SPACING_UNIT * 3,      // 12px
  4: SPACING_UNIT * 4,      // 16px
  5: SPACING_UNIT * 5,      // 20px
  6: SPACING_UNIT * 6,      // 24px
  7: SPACING_UNIT * 7,      // 28px
  8: SPACING_UNIT * 8,      // 32px
  9: SPACING_UNIT * 9,      // 36px
  10: SPACING_UNIT * 10,    // 40px
  12: SPACING_UNIT * 12,    // 48px
  14: SPACING_UNIT * 14,    // 56px
  16: SPACING_UNIT * 16,    // 64px
  20: SPACING_UNIT * 20,    // 80px
  24: SPACING_UNIT * 24,    // 96px
  28: SPACING_UNIT * 28,    // 112px
  32: SPACING_UNIT * 32,    // 128px
  36: SPACING_UNIT * 36,    // 144px
  40: SPACING_UNIT * 40,    // 160px
  44: SPACING_UNIT * 44,    // 176px
  48: SPACING_UNIT * 48,    // 192px
  52: SPACING_UNIT * 52,    // 208px
  56: SPACING_UNIT * 56,    // 224px
  60: SPACING_UNIT * 60,    // 240px
  64: SPACING_UNIT * 64,    // 256px
  72: SPACING_UNIT * 72,    // 288px
  80: SPACING_UNIT * 80,    // 320px
  96: SPACING_UNIT * 96,    // 384px
} as const;

// Tokens semânticos para componentes
export const componentSpacing = {
  // Padding interno de componentes
  padding: {
    xs: spacing[2],    // 8px
    sm: spacing[3],    // 12px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
  },

  // Margin entre componentes
  margin: {
    xs: spacing[2],    // 8px
    sm: spacing[4],    // 16px
    md: spacing[6],    // 24px
    lg: spacing[8],    // 32px
    xl: spacing[12],   // 48px
  },

  // Gap entre elementos (flexbox/grid)
  gap: {
    xs: spacing[1],    // 4px
    sm: spacing[2],    // 8px
    md: spacing[4],    // 16px
    lg: spacing[6],    // 24px
    xl: spacing[8],    // 32px
  },

  // Spacing específico para forms
  form: {
    fieldGap: spacing[4],      // 16px - entre campos
    labelGap: spacing[2],      // 8px - entre label e input
    sectionGap: spacing[8],    // 32px - entre seções
    submitGap: spacing[6],     // 24px - antes do botão submit
  },

  // Spacing para cards
  card: {
    padding: spacing[4],       // 16px - padding interno
    gap: spacing[6],          // 24px - entre cards
    contentGap: spacing[3],   // 12px - entre elementos internos
  },

  // Spacing para listas
  list: {
    itemGap: spacing[2],      // 8px - entre itens pequenos
    itemPadding: spacing[4],  // 16px - padding dos itens
    sectionGap: spacing[6],   // 24px - entre seções de lista
  },

  // Spacing para botões
  button: {
    paddingX: spacing[4],     // 16px - horizontal
    paddingY: spacing[3],     // 12px - vertical
    gap: spacing[2],          // 8px - entre ícone e texto
  },

  // Spacing para navegação
  navigation: {
    itemGap: spacing[2],      // 8px - entre itens de menu
    sectionGap: spacing[6],   // 24px - entre seções de menu
    padding: spacing[4],      // 16px - padding da navegação
  },

  // Spacing para grid/layout
  grid: {
    gutter: spacing[4],       // 16px - espaço entre colunas
    rowGap: spacing[6],       // 24px - espaço entre linhas
  },

  // Spacing para modais/sheets
  modal: {
    padding: spacing[6],      // 24px - padding interno
    headerGap: spacing[4],    // 16px - gap do header
    footerGap: spacing[6],    // 24px - gap do footer
  }
} as const;

// Tokens específicos para transações financeiras
export const transactionSpacing = {
  // Lista de transações
  list: {
    itemPadding: spacing[4],    // 16px
    itemGap: spacing[1],        // 4px
    categoryGap: spacing[6],    // 24px
  },

  // Card de transação
  card: {
    padding: spacing[4],        // 16px
    iconGap: spacing[3],        // 12px
    contentGap: spacing[2],     // 8px
    amountGap: spacing[4],      // 16px
  },

  // Formulário de transação
  form: {
    fieldGap: spacing[4],       // 16px
    sectionGap: spacing[8],     // 32px
    buttonGap: spacing[6],      // 24px
  }
} as const;

// Breakpoints para responsividade (em pixels)
export const breakpoints = {
  xs: 0,      // Mobile pequeno
  sm: 576,    // Mobile grande
  md: 768,    // Tablet
  lg: 992,    // Desktop pequeno
  xl: 1200,   // Desktop médio
  xxl: 1400   // Desktop grande
} as const;

// Container sizes para diferentes breakpoints
export const containerSizes = {
  xs: '100%',
  sm: 540,
  md: 720,
  lg: 960,
  xl: 1140,
  xxl: 1320
} as const;

// Utilitário para criar espaçamento customizado
export const createSpacing = (multiplier: number): number => {
  return SPACING_UNIT * multiplier;
};

// Tipos TypeScript
export type SpacingKey = keyof typeof spacing;
export type ComponentSpacingKey = keyof typeof componentSpacing;
export type BreakpointKey = keyof typeof breakpoints;