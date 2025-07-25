/**
 * Shared Package - Entry Point
 * 
 * Exporta todos os módulos compartilhados entre mobile e web
 */

// Design Tokens
export * from './tokens';

// Components
export * from './components';

// Re-export dos principais para facilitar o uso
export { theme, themeRN, tokens } from './tokens';

// Version
export const SHARED_VERSION = '1.0.0';

// Placeholder para futuros módulos
// - Hooks compartilhados  
// - Utilitários compartilhados
// - Types compartilhados