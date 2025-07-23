/**
 * Utilitários para manipulação segura de datas
 */

/**
 * Faz parsing seguro de uma data, retornando um fallback se inválida
 */
export const safeParseDate = (dateValue: any, fallback: Date = new Date()): Date => {
  if (!dateValue) return fallback;
  
  // Se já é uma Date válida, retorna ela
  if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
    return dateValue;
  }
  
  // Tenta fazer parsing
  const parsed = new Date(dateValue);
  return isNaN(parsed.getTime()) ? fallback : parsed;
};

/**
 * Verifica se um valor pode ser convertido em uma data válida
 */
export const isValidDate = (dateValue: any): boolean => {
  if (!dateValue) return false;
  
  if (dateValue instanceof Date) {
    return !isNaN(dateValue.getTime());
  }
  
  const parsed = new Date(dateValue);
  return !isNaN(parsed.getTime());
};

/**
 * Formata uma data de forma segura
 */
export const formatDateSafely = (dateValue: any, options?: Intl.DateTimeFormatOptions): string => {
  const safeDate = safeParseDate(dateValue);
  
  try {
    return safeDate.toLocaleDateString('pt-BR', options);
  } catch (error) {
    console.warn('Erro ao formatar data:', error);
    return safeDate.toDateString();
  }
};

/**
 * Compara duas datas de forma segura
 */
export const compareDatesSafely = (date1: any, date2: any): number => {
  const safeDate1 = safeParseDate(date1);
  const safeDate2 = safeParseDate(date2);
  
  return safeDate1.getTime() - safeDate2.getTime();
};

/**
 * Obtém o timestamp de uma data de forma segura
 */
export const getTimestampSafely = (dateValue: any): number => {
  const safeDate = safeParseDate(dateValue);
  return safeDate.getTime();
};