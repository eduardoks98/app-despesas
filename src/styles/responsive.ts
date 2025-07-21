import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Guia de design baseado em iPhone X (375x812)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

// Função para escalar tamanhos horizontalmente
export const scale = (size: number) => (SCREEN_WIDTH / guidelineBaseWidth) * size;

// Função para escalar tamanhos verticalmente  
export const verticalScale = (size: number) => (SCREEN_HEIGHT / guidelineBaseHeight) * size;

// Função para escalar tamanhos moderadamente (menos agressiva)
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

// Função para obter padding responsivo
export const getResponsivePadding = (base: number) => Math.max(scale(base), 8);

// Função para obter margens responsivas
export const getResponsiveMargin = (base: number) => Math.max(scale(base), 4);

// Função para obter tamanhos de fonte responsivos
export const getResponsiveFontSize = (size: number) => {
  const scaledSize = moderateScale(size);
  return Math.max(scaledSize, size * 0.85); // Mínimo de 85% do tamanho original
};

// Função para obter altura responsiva de componentes
export const getResponsiveHeight = (percentage: number) => SCREEN_HEIGHT * (percentage / 100);

// Função para obter largura responsiva de componentes  
export const getResponsiveWidth = (percentage: number) => SCREEN_WIDTH * (percentage / 100);

// Breakpoints para diferentes tamanhos de tela
export const BREAKPOINTS = {
  small: 320,   // iPhone SE
  medium: 375,  // iPhone X, 12
  large: 414,   // iPhone Plus
  tablet: 768,  // iPad
  desktop: 1024
};

// Função para verificar o tipo de dispositivo
export const getDeviceType = () => {
  if (SCREEN_WIDTH >= BREAKPOINTS.desktop) return 'desktop';
  if (SCREEN_WIDTH >= BREAKPOINTS.tablet) return 'tablet';
  if (SCREEN_WIDTH >= BREAKPOINTS.large) return 'large';
  if (SCREEN_WIDTH >= BREAKPOINTS.medium) return 'medium';
  return 'small';
};

// Função para obter número de colunas baseado no tamanho da tela
export const getColumnsForScreenSize = (minItemWidth = 300) => {
  return Math.floor(SCREEN_WIDTH / minItemWidth) || 1;
};

// Sistema de espaçamento responsivo
export const SPACING = {
  xs: getResponsivePadding(4),
  sm: getResponsivePadding(8),
  md: getResponsivePadding(16),
  lg: getResponsivePadding(24),
  xl: getResponsivePadding(32),
  xxl: getResponsivePadding(48),
};

// Sistema de tamanhos de fonte responsivos
export const FONT_SIZES = {
  xs: getResponsiveFontSize(10),
  sm: getResponsiveFontSize(12),
  md: getResponsiveFontSize(14),
  lg: getResponsiveFontSize(16),
  xl: getResponsiveFontSize(18),
  xxl: getResponsiveFontSize(24),
  title: getResponsiveFontSize(32),
};

// Tamanhos de ícones responsivos
export const ICON_SIZES = {
  xs: moderateScale(12),
  sm: moderateScale(16),
  md: moderateScale(20),
  lg: moderateScale(24),
  xl: moderateScale(32),
  xxl: moderateScale(48),
};

// Função para normalizar tamanhos baseados na densidade de pixels
export const normalize = (size: number) => {
  const newSize = size * scale(1);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Função para obter bordas responsivas
export const getResponsiveBorderRadius = (base: number) => moderateScale(base);

// Constantes de layout
export const LAYOUT = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallScreen: SCREEN_WIDTH < BREAKPOINTS.medium,
  isTablet: SCREEN_WIDTH >= BREAKPOINTS.tablet,
  cardPadding: SPACING.md,
  containerPadding: SPACING.md,
  borderRadius: getResponsiveBorderRadius(12),
  borderRadiusSmall: getResponsiveBorderRadius(8),
  borderRadiusLarge: getResponsiveBorderRadius(16),
};