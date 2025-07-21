import { Transaction, Installment } from '../../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class ValidationService {
  // Validação de transação
  static validateTransaction(transaction: Partial<Transaction>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!transaction.description?.trim()) {
      errors.push('Descrição é obrigatória');
    } else if (transaction.description.length > 100) {
      errors.push('Descrição não pode ter mais de 100 caracteres');
    }

    if (!transaction.amount || transaction.amount <= 0) {
      errors.push('Valor deve ser maior que zero');
    } else if (transaction.amount > 1000000) {
      warnings.push('Valor muito alto - verifique se está correto');
    }

    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      errors.push('Tipo de transação inválido');
    }

    if (!transaction.category?.trim()) {
      errors.push('Categoria é obrigatória');
    }

    // Validação de data
    if (!transaction.date) {
      errors.push('Data é obrigatória');
    } else {
      const date = new Date(transaction.date);
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (isNaN(date.getTime())) {
        errors.push('Data inválida');
      } else if (date > now) {
        warnings.push('Data está no futuro');
      } else if (date < oneYearAgo) {
        warnings.push('Data é muito antiga');
      }
    }

    // Validação de método de pagamento
    const validPaymentMethods = ['cash', 'debit', 'credit', 'pix'];
    if (transaction.paymentMethod && !validPaymentMethods.includes(transaction.paymentMethod)) {
      errors.push('Método de pagamento inválido');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Validação de parcelamento
  static validateInstallment(installment: Partial<Installment>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validações obrigatórias
    if (!installment.description?.trim()) {
      errors.push('Descrição é obrigatória');
    } else if (installment.description.length > 100) {
      errors.push('Descrição não pode ter mais de 100 caracteres');
    }

    if (!installment.store?.trim()) {
      errors.push('Loja é obrigatória');
    }

    if (!installment.totalAmount || installment.totalAmount <= 0) {
      errors.push('Valor total deve ser maior que zero');
    }

    if (!installment.totalInstallments || installment.totalInstallments <= 0) {
      errors.push('Número de parcelas deve ser maior que zero');
    } else if (installment.totalInstallments > 120) {
      errors.push('Número máximo de parcelas é 120');
    }

    // Validação de valores
    if (installment.totalAmount && installment.totalInstallments && installment.installmentValue) {
      const expectedValue = installment.totalAmount / installment.totalInstallments;
      const tolerance = 0.01;
      
      if (Math.abs(installment.installmentValue - expectedValue) > tolerance) {
        errors.push('Valor da parcela não condiz com total ÷ número de parcelas');
      }
    }

    // Validação de datas
    if (!installment.startDate) {
      errors.push('Data de início é obrigatória');
    }

    if (!installment.endDate) {
      errors.push('Data de término é obrigatória');
    }

    if (installment.startDate && installment.endDate) {
      const startDate = new Date(installment.startDate);
      const endDate = new Date(installment.endDate);
      
      if (startDate >= endDate) {
        errors.push('Data de término deve ser posterior à data de início');
      }
    }

    // Validação de categoria
    if (!installment.category?.trim()) {
      errors.push('Categoria é obrigatória');
    }

    // Validação de parcelas pagas
    if (installment.paidInstallments && installment.totalInstallments) {
      const invalidInstallments = installment.paidInstallments.filter(
        num => num < 1 || num > installment.totalInstallments
      );
      
      if (invalidInstallments.length > 0) {
        errors.push('Números de parcelas pagas inválidos');
      }
      
      const duplicates = installment.paidInstallments.filter(
        (num, index) => installment.paidInstallments!.indexOf(num) !== index
      );
      
      if (duplicates.length > 0) {
        errors.push('Parcelas pagas duplicadas');
      }
    }

    // Avisos
    if (installment.totalInstallments && installment.totalInstallments > 24) {
      warnings.push('Parcelamento muito longo - considere revisar');
    }

    if (installment.totalAmount && installment.totalAmount > 50000) {
      warnings.push('Valor muito alto - verifique se está correto');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Validação de entrada numérica
  static validateNumericInput(value: string, options: {
    min?: number;
    max?: number;
    allowDecimals?: boolean;
    decimalPlaces?: number;
  } = {}): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar se é um número válido
    const numericValue = parseFloat(value.replace(',', '.'));
    
    if (isNaN(numericValue)) {
      errors.push('Valor deve ser um número válido');
      return { isValid: false, errors };
    }

    // Verificar limites
    if (options.min !== undefined && numericValue < options.min) {
      errors.push(`Valor deve ser maior ou igual a ${options.min}`);
    }

    if (options.max !== undefined && numericValue > options.max) {
      errors.push(`Valor deve ser menor ou igual a ${options.max}`);
    }

    // Verificar casas decimais
    if (options.allowDecimals === false && numericValue % 1 !== 0) {
      errors.push('Valor deve ser um número inteiro');
    }

    if (options.decimalPlaces !== undefined) {
      const decimalPart = value.includes(',') ? value.split(',')[1] : value.split('.')[1];
      if (decimalPart && decimalPart.length > options.decimalPlaces) {
        errors.push(`Máximo ${options.decimalPlaces} casas decimais permitidas`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Validação de texto
  static validateTextInput(value: string, options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}): ValidationResult {
    const errors: string[] = [];

    // Verificar se é obrigatório
    if (options.required && !value?.trim()) {
      errors.push('Campo obrigatório');
      return { isValid: false, errors };
    }

    if (value) {
      // Verificar comprimento
      if (options.minLength && value.length < options.minLength) {
        errors.push(`Mínimo ${options.minLength} caracteres`);
      }

      if (options.maxLength && value.length > options.maxLength) {
        errors.push(`Máximo ${options.maxLength} caracteres`);
      }

      // Verificar padrão
      if (options.pattern && !options.pattern.test(value)) {
        errors.push(options.patternMessage || 'Formato inválido');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitização de dados
  static sanitizeTransaction(transaction: Partial<Transaction>): Partial<Transaction> {
    return {
      ...transaction,
      description: transaction.description?.trim(),
      category: transaction.category?.trim(),
      amount: transaction.amount ? Math.round(transaction.amount * 100) / 100 : undefined, // Arredondar para 2 casas decimais
    };
  }

  static sanitizeInstallment(installment: Partial<Installment>): Partial<Installment> {
    return {
      ...installment,
      description: installment.description?.trim(),
      store: installment.store?.trim(),
      category: installment.category?.trim(),
      totalAmount: installment.totalAmount ? Math.round(installment.totalAmount * 100) / 100 : undefined,
      installmentValue: installment.installmentValue ? Math.round(installment.installmentValue * 100) / 100 : undefined,
      notes: installment.notes?.trim(),
    };
  }

  // Verificação de integridade dos dados
  static checkDataIntegrity(transactions: Transaction[], installments: Installment[]): {
    orphanTransactions: Transaction[];
    missingTransactions: { installmentId: string; missingNumbers: number[] }[];
    inconsistentInstallments: string[];
  } {
    const orphanTransactions: Transaction[] = [];
    const missingTransactions: { installmentId: string; missingNumbers: number[] }[] = [];
    const inconsistentInstallments: string[] = [];

    // Verificar transações órfãs (sem parcelamento correspondente)
    transactions.forEach(transaction => {
      if (transaction.installmentId) {
        const installment = installments.find(inst => inst.id === transaction.installmentId);
        if (!installment) {
          orphanTransactions.push(transaction);
        }
      }
    });

    // Verificar transações faltantes em parcelamentos
    installments.forEach(installment => {
      const installmentTransactions = transactions.filter(t => t.installmentId === installment.id);
      const transactionNumbers = installmentTransactions.map(t => t.installmentNumber).filter(Boolean);
      const allPaidNumbers = [...new Set([...installment.paidInstallments, ...transactionNumbers])];
      
      const expectedNumbers = Array.from({ length: installment.paidInstallments.length }, (_, i) => i + 1);
      const missingNumbers = expectedNumbers.filter(num => !allPaidNumbers.includes(num));
      
      if (missingNumbers.length > 0) {
        missingTransactions.push({
          installmentId: installment.id,
          missingNumbers
        });
      }

      // Verificar inconsistências no parcelamento
      const validation = this.validateInstallment(installment);
      if (!validation.isValid) {
        inconsistentInstallments.push(installment.id);
      }
    });

    return {
      orphanTransactions,
      missingTransactions,
      inconsistentInstallments
    };
  }
}