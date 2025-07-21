import { Alert } from 'react-native';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  STORAGE = 'STORAGE', 
  NETWORK = 'NETWORK',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  code?: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export class ErrorHandler {
  private static errors: AppError[] = [];
  private static maxErrors = 50; // Manter apenas os últimos 50 erros

  // Criar erro
  static createError(
    type: ErrorType,
    message: string,
    details?: string,
    context?: Record<string, any>
  ): AppError {
    const error: AppError = {
      type,
      message,
      details,
      timestamp: new Date(),
      context
    };

    this.logError(error);
    return error;
  }

  // Log do erro
  private static logError(error: AppError): void {
    // Adicionar ao array de erros
    this.errors.unshift(error);
    
    // Manter apenas os últimos maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log no console para debug
    console.error(`[${error.type}] ${error.message}`, {
      details: error.details,
      context: error.context,
      timestamp: error.timestamp
    });
  }

  // Tratar erro de validação
  static handleValidationError(errors: string[], context?: string): void {
    const message = errors.join('\n');
    
    this.createError(
      ErrorType.VALIDATION,
      'Erro de validação',
      message,
      { context, errors }
    );

    Alert.alert(
      'Dados Inválidos',
      message,
      [{ text: 'OK' }]
    );
  }

  // Tratar erro de armazenamento
  static handleStorageError(operation: string, originalError?: Error): AppError {
    const error = this.createError(
      ErrorType.STORAGE,
      `Erro ao ${operation}`,
      originalError?.message,
      { operation, originalError: originalError?.stack }
    );

    Alert.alert(
      'Erro de Armazenamento',
      `Não foi possível ${operation}. Tente novamente.`,
      [{ text: 'OK' }]
    );

    return error;
  }

  // Tratar erro de rede
  static handleNetworkError(operation: string, originalError?: Error): AppError {
    const error = this.createError(
      ErrorType.NETWORK,
      `Erro de conexão ao ${operation}`,
      originalError?.message,
      { operation }
    );

    Alert.alert(
      'Erro de Conexão',
      'Verifique sua conexão com a internet e tente novamente.',
      [{ text: 'OK' }]
    );

    return error;
  }

  // Tratar erro de permissão
  static handlePermissionError(permission: string): AppError {
    const error = this.createError(
      ErrorType.PERMISSION,
      `Permissão negada: ${permission}`,
      undefined,
      { permission }
    );

    Alert.alert(
      'Permissão Necessária',
      `É necessário conceder a permissão de ${permission} para continuar.`,
      [{ text: 'OK' }]
    );

    return error;
  }

  // Tratar erro desconhecido
  static handleUnknownError(operation: string, originalError?: Error): AppError {
    const error = this.createError(
      ErrorType.UNKNOWN,
      `Erro inesperado ao ${operation}`,
      originalError?.message,
      { operation, stack: originalError?.stack }
    );

    Alert.alert(
      'Erro Inesperado',
      'Ocorreu um erro inesperado. Se o problema persistir, entre em contato com o suporte.',
      [{ text: 'OK' }]
    );

    return error;
  }

  // Tratar erro com retry
  static handleErrorWithRetry(
    operation: string,
    retryFn: () => Promise<void>,
    originalError?: Error
  ): void {
    const error = this.createError(
      ErrorType.UNKNOWN,
      `Erro ao ${operation}`,
      originalError?.message,
      { operation, hasRetry: true }
    );

    Alert.alert(
      'Erro',
      `Erro ao ${operation}. Deseja tentar novamente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Tentar Novamente',
          onPress: async () => {
            try {
              await retryFn();
            } catch (retryError) {
              this.handleUnknownError(operation, retryError as Error);
            }
          }
        }
      ]
    );
  }

  // Obter histórico de erros
  static getErrorHistory(): AppError[] {
    return [...this.errors];
  }

  // Limpar histórico de erros
  static clearErrorHistory(): void {
    this.errors = [];
  }

  // Obter estatísticas de erros
  static getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    recent: AppError[];
  } {
    const byType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<ErrorType, number>);

    // Erros das últimas 24 horas
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const recent = this.errors.filter(error => error.timestamp > oneDayAgo);

    return {
      total: this.errors.length,
      byType,
      recent
    };
  }

  // Wrapper para operações assíncronas com tratamento de erro
  static async withErrorHandling<T>(
    operation: string,
    fn: () => Promise<T>,
    showUserFeedback = true
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      if (showUserFeedback) {
        this.handleUnknownError(operation, error as Error);
      } else {
        this.createError(
          ErrorType.UNKNOWN,
          `Erro silencioso ao ${operation}`,
          (error as Error)?.message,
          { operation, silent: true }
        );
      }
      return null;
    }
  }

  // Verificar se há muitos erros recentes (indicativo de problema grave)
  static checkForCriticalErrors(): boolean {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentErrors = this.errors.filter(error => error.timestamp > oneHourAgo);
    
    if (recentErrors.length > 10) {
      Alert.alert(
        'Muitos Erros Detectados',
        'O aplicativo está enfrentando muitos problemas. Considere reiniciar o app ou limpar os dados.',
        [
          { text: 'OK' },
          { 
            text: 'Limpar Erros',
            onPress: () => this.clearErrorHistory()
          }
        ]
      );
      return true;
    }
    
    return false;
  }

  // Exportar erros para debug
  static exportErrorsForDebug(): string {
    const stats = this.getErrorStats();
    const errorData = {
      timestamp: new Date().toISOString(),
      stats,
      errors: this.errors.slice(0, 20) // Últimos 20 erros
    };
    
    return JSON.stringify(errorData, null, 2);
  }
}