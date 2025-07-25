/**
 * Design Tokens - Animações e Transições
 * 
 * Sistema de animações baseado em Material Design 3
 * Compatível com React Native e Web
 */

// Durações de animação (em milissegundos)
export const durations = {
  instant: 0,      // Sem animação
  fast: 150,       // Hover states, pequenas mudanças
  normal: 250,     // Transições padrão
  slow: 350,       // Transições mais complexas
  slower: 500,     // Mudanças de layout
  slowest: 750,    // Animações de entrada/saída
} as const;

// Curvas de animação (easing functions)
export const easings = {
  // Linear
  linear: 'linear',
  
  // Ease padrão
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // Cubic-bezier customizadas (Material Design)
  emphasized: 'cubic-bezier(0.2, 0, 0, 1)',           // Entrada suave, saída rápida
  emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1)', // Desaceleração enfatizada
  emphasizedAccelerate: 'cubic-bezier(0.3, 0, 0.8, 0.15)', // Aceleração enfatizada
  standard: 'cubic-bezier(0.2, 0, 0, 1)',             // Padrão Material
  standardDecelerate: 'cubic-bezier(0, 0, 0, 1)',     // Desaceleração padrão
  standardAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',   // Aceleração padrão
  
  // Bounce e spring
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// Transições pré-definidas para Web
export const transitions = {
  // Transições básicas
  none: 'none',
  all: `all ${durations.normal}ms ${easings.standard}`,
  
  // Propriedades específicas
  opacity: `opacity ${durations.fast}ms ${easings.easeOut}`,
  transform: `transform ${durations.normal}ms ${easings.emphasized}`,
  colors: `background-color ${durations.fast}ms ${easings.easeOut}, border-color ${durations.fast}ms ${easings.easeOut}, color ${durations.fast}ms ${easings.easeOut}`,
  shadow: `box-shadow ${durations.normal}ms ${easings.standard}`,
  size: `width ${durations.normal}ms ${easings.standard}, height ${durations.normal}ms ${easings.standard}`,
  
  // Transições de layout
  layout: `all ${durations.slower}ms ${easings.emphasized}`,
  modal: `opacity ${durations.normal}ms ${easings.emphasizedDecelerate}, transform ${durations.normal}ms ${easings.emphasizedDecelerate}`,
  slide: `transform ${durations.normal}ms ${easings.emphasized}`,
  fade: `opacity ${durations.fast}ms ${easings.easeOut}`,
  
  // Transições específicas para componentes
  button: `background-color ${durations.fast}ms ${easings.easeOut}, transform ${durations.fast}ms ${easings.easeOut}, box-shadow ${durations.fast}ms ${easings.easeOut}`,
  input: `border-color ${durations.fast}ms ${easings.easeOut}, box-shadow ${durations.fast}ms ${easings.easeOut}`,
  card: `transform ${durations.normal}ms ${easings.standard}, box-shadow ${durations.normal}ms ${easings.standard}`,
} as const;

// Animações para React Native
export const animationsRN = {
  // Durações em milissegundos
  durations,
  
  // Configurações de timing (equivalentes aos easings)
  timings: {
    linear: { useNativeDriver: true },
    easeIn: { useNativeDriver: true },
    easeOut: { useNativeDriver: true },
    easeInOut: { useNativeDriver: true },
    spring: {
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    },
    bounce: {
      useNativeDriver: true,
      tension: 180,
      friction: 12,
    },
  },
  
  // Configurações de spring específicas
  springs: {
    gentle: {
      damping: 15,
      stiffness: 100,
      useNativeDriver: true,
    },
    normal: {
      damping: 12,
      stiffness: 150,
      useNativeDriver: true,
    },
    bouncy: {
      damping: 8,
      stiffness: 200,
      useNativeDriver: true,
    },
  },
} as const;

// Tokens semânticos por tipo de animação
export const componentAnimations = {
  // Estados de botão
  button: {
    hover: {
      duration: durations.fast,
      easing: easings.easeOut,
      properties: ['transform', 'box-shadow', 'background-color'],
    },
    press: {
      duration: durations.instant,
      easing: easings.easeOut,
      properties: ['transform'],
    },
    release: {
      duration: durations.fast,
      easing: easings.easeOut,
      properties: ['transform'],
    },
  },

  // Entrada e saída de modais
  modal: {
    enter: {
      duration: durations.normal,
      easing: easings.emphasizedDecelerate,
      properties: ['opacity', 'transform'],
    },
    exit: {
      duration: durations.fast,
      easing: easings.emphasizedAccelerate,
      properties: ['opacity', 'transform'],
    },
  },

  // Transições de página
  page: {
    enter: {
      duration: durations.slower,
      easing: easings.emphasized,
      properties: ['transform', 'opacity'],
    },
    exit: {
      duration: durations.normal,
      easing: easings.standard,
      properties: ['transform', 'opacity'],
    },
  },

  // Animações de lista
  list: {
    itemEnter: {
      duration: durations.normal,
      easing: easings.emphasizedDecelerate,
      properties: ['opacity', 'transform'],
    },
    itemExit: {
      duration: durations.fast,
      easing: easings.emphasizedAccelerate,
      properties: ['opacity', 'transform'],
    },
  },

  // Feedback de ações
  feedback: {
    success: {
      duration: durations.slow,
      easing: easings.bounce,
      properties: ['transform', 'opacity'],
    },
    error: {
      duration: durations.normal,
      easing: easings.standard,
      properties: ['transform'],
    },
  },

  // Carregamento
  loading: {
    spin: {
      duration: durations.slowest,
      easing: easings.linear,
      properties: ['transform'],
      repeat: true,
    },
    pulse: {
      duration: durations.slow,
      easing: easings.easeInOut,
      properties: ['opacity'],
      repeat: true,
    },
  },

  // Específicas para transações
  transaction: {
    cardHover: {
      duration: durations.fast,
      easing: easings.easeOut,
      properties: ['transform', 'box-shadow'],
    },
    amountChange: {
      duration: durations.normal,
      easing: easings.spring,
      properties: ['color', 'transform'],
    },
  },
} as const;

// Keyframes para animações CSS
export const keyframes = {
  // Fade
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // Slide
  slideInUp: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideOutDown: {
    from: { transform: 'translateY(0)' },
    to: { transform: 'translateY(100%)' },
  },
  slideInLeft: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideInRight: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },

  // Scale
  scaleIn: {
    from: { transform: 'scale(0)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },
  scaleOut: {
    from: { transform: 'scale(1)', opacity: 1 },
    to: { transform: 'scale(0)', opacity: 0 },
  },

  // Spin
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  // Pulse
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  // Bounce
  bounce: {
    '0%, 20%, 53%, 80%, 100%': { transform: 'translateY(0)' },
    '40%, 43%': { transform: 'translateY(-30px)' },
    '70%': { transform: 'translateY(-15px)' },
    '90%': { transform: 'translateY(-4px)' },
  },
} as const;

// Utilitário para criar transições customizadas
export const createTransition = (
  properties: string[],
  duration: keyof typeof durations = 'normal',
  easing: keyof typeof easings = 'standard'
) => {
  return properties
    .map(property => `${property} ${durations[duration]}ms ${easings[easing]}`)
    .join(', ');
};

// Tipos TypeScript
export type Duration = keyof typeof durations;
export type Easing = keyof typeof easings;
export type Transition = keyof typeof transitions;
export type ComponentAnimationKey = keyof typeof componentAnimations;