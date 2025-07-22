import { Installment, Transaction } from '../../types';

export interface InstallmentForecast {
  installmentId: string;
  description: string;
  installmentNumber: number;
  totalInstallments: number;
  value: number;
  dueDate: Date;
  store: string;
  isOverdue: boolean;
  isPaid: boolean;
}

export interface OverdueInstallment {
  installmentId: string;
  description: string;
  installmentNumber: number;
  value: number;
  dueDate: Date;
  daysOverdue: number;
  store: string;
}

export interface InstallmentSummary {
  totalActive: number;
  totalCompleted: number;
  totalCancelled: number;
  monthlyPayment: number;
  totalDebt: number;
  overduePayments: number;
  overdueAmount: number;
  nextPaymentDue: Date | null;
  averageInstallmentValue: number;
}

export class InstallmentCalculations {
  /**
   * Calcular próximas parcelas nos próximos meses
   */
  static getUpcomingInstallments(
    installments: Installment[], 
    transactions: Transaction[],
    monthsAhead: number = 3
  ): InstallmentForecast[] {
    const forecasts: InstallmentForecast[] = [];
    const today = new Date();

    installments.forEach(installment => {
      if (installment.status !== 'active') return;

      for (let i = 0; i < monthsAhead; i++) {
        const futureDate = new Date(today);
        futureDate.setMonth(futureDate.getMonth() + i);
        
        // Calcular qual parcela deve ser paga neste mês
        const startDate = new Date(installment.startDate);
        const monthsDiff = (futureDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (futureDate.getMonth() - startDate.getMonth()) + 1;

        if (monthsDiff > 0 && monthsDiff <= installment.totalInstallments) {
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + monthsDiff - 1);
          
          const isPaid = installment.paidInstallments.includes(monthsDiff) ||
                        transactions.some(t => 
                          t.installmentId === installment.id && 
                          t.installmentNumber === monthsDiff
                        );
          
          const isOverdue = dueDate < today && !isPaid;

          forecasts.push({
            installmentId: installment.id,
            description: installment.description,
            installmentNumber: monthsDiff,
            totalInstallments: installment.totalInstallments,
            value: installment.installmentValue,
            dueDate,
            store: installment.store,
            isOverdue,
            isPaid,
          });
        }
      }
    });

    return forecasts.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Calcular total da dívida em parcelamentos
   */
  static getTotalDebt(installments: Installment[]): number {
    return installments.reduce((total, inst) => {
      if (inst.status !== 'active') return total;
      const remainingInstallments = inst.totalInstallments - inst.paidInstallments.length;
      return total + (remainingInstallments * inst.installmentValue);
    }, 0);
  }

  /**
   * Verificar parcelas vencidas
   */
  static getOverdueInstallments(
    installments: Installment[],
    transactions: Transaction[]
  ): OverdueInstallment[] {
    const overdue: OverdueInstallment[] = [];
    const today = new Date();

    installments.forEach(installment => {
      if (installment.status !== 'active') return;

      const startDate = new Date(installment.startDate);
      
      // Verificar cada parcela que deveria ter sido paga até hoje
      for (let i = 1; i <= installment.totalInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i - 1);
        
        if (dueDate < today) {
          // Verificar se existe transação para esta parcela
          const hasTransaction = transactions.some(t => 
            t.installmentId === installment.id && 
            t.installmentNumber === i
          );

          const isPaidInInstallment = installment.paidInstallments.includes(i);

          if (!hasTransaction && !isPaidInInstallment) {
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            overdue.push({
              installmentId: installment.id,
              description: installment.description,
              installmentNumber: i,
              value: installment.installmentValue,
              dueDate,
              daysOverdue,
              store: installment.store,
            });
          }
        }
      }
    });

    return overdue.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  /**
   * Gerar resumo geral dos parcelamentos
   */
  static getInstallmentSummary(
    installments: Installment[],
    transactions: Transaction[]
  ): InstallmentSummary {
    const totalActive = installments.filter(i => i.status === 'active').length;
    const totalCompleted = installments.filter(i => i.status === 'completed').length;
    const totalCancelled = installments.filter(i => i.status === 'cancelled').length;

    const activeInstallments = installments.filter(i => i.status === 'active');
    
    // Calcular pagamento mensal (apenas parcelas que vencem este mês)
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    const monthlyPayment = activeInstallments.reduce((sum, inst) => {
      const startDate = new Date(inst.startDate);
      const monthsSinceStart = (thisYear - startDate.getFullYear()) * 12 + (thisMonth - startDate.getMonth());
      const currentInstallmentNumber = monthsSinceStart + 1;
      
      // Se há uma parcela que vence este mês e ainda não foi paga
      if (currentInstallmentNumber >= 1 && 
          currentInstallmentNumber <= inst.totalInstallments &&
          !inst.paidInstallments.includes(currentInstallmentNumber)) {
        return sum + inst.installmentValue;
      }
      return sum;
    }, 0);
    
    // Calcular dívida total
    const totalDebt = this.getTotalDebt(installments);
    
    // Parcelas vencidas
    const overduePayments = this.getOverdueInstallments(installments, transactions);
    const overdueAmount = overduePayments.reduce((sum, payment) => sum + payment.value, 0);
    
    // Próximo vencimento
    const upcoming = this.getUpcomingInstallments(installments, transactions, 1);
    const nextPaymentDue = upcoming.length > 0 && !upcoming[0].isPaid ? upcoming[0].dueDate : null;
    
    // Valor médio das parcelas
    const averageInstallmentValue = activeInstallments.length > 0 ? 
      monthlyPayment / activeInstallments.length : 0;

    return {
      totalActive,
      totalCompleted,
      totalCancelled,
      monthlyPayment,
      totalDebt,
      overduePayments: overduePayments.length,
      overdueAmount,
      nextPaymentDue,
      averageInstallmentValue,
    };
  }

  /**
   * Simular quitação antecipada
   */
  static simulateEarlyPayoff(installment: Installment, payoffDate: Date = new Date()): {
    remainingInstallments: number;
    remainingAmount: number;
    savings: number;
    totalPaid: number;
  } {
    const remainingInstallments = installment.totalInstallments - installment.paidInstallments.length;
    const remainingAmount = remainingInstallments * installment.installmentValue;
    
    // Simular desconto de 5% para quitação antecipada (pode ser customizado)
    const discountPercentage = 0.05;
    const savings = remainingAmount * discountPercentage;
    const totalPaid = installment.paidInstallments.length * installment.installmentValue;

    return {
      remainingInstallments,
      remainingAmount,
      savings,
      totalPaid,
    };
  }

  /**
   * Calcular estatísticas por período
   */
  static getInstallmentStatsByPeriod(
    installments: Installment[],
    transactions: Transaction[],
    startDate: Date,
    endDate: Date
  ): {
    newInstallments: number;
    completedInstallments: number;
    totalPaid: number;
    averageInstallmentValue: number;
  } {
    // Parcelamentos criados no período
    const newInstallments = installments.filter(inst => {
      const createdDate = new Date(inst.startDate);
      return createdDate >= startDate && createdDate <= endDate;
    }).length;

    // Parcelamentos completados no período
    const completedInstallments = installments.filter(inst => {
      if (inst.status !== 'completed') return false;
      const completedDate = new Date(inst.endDate);
      return completedDate >= startDate && completedDate <= endDate;
    }).length;

    // Total pago em parcelas no período
    const installmentTransactions = transactions.filter(t => {
      if (!t.installmentId) return false;
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const totalPaid = installmentTransactions.reduce((sum, t) => sum + t.amount, 0);
    const averageInstallmentValue = installmentTransactions.length > 0 ? 
      totalPaid / installmentTransactions.length : 0;

    return {
      newInstallments,
      completedInstallments,
      totalPaid,
      averageInstallmentValue,
    };
  }

  /**
   * Validar consistência dos dados de parcelamento
   */
  static validateInstallmentData(installment: Installment): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validações básicas
    if (installment.totalInstallments <= 0) {
      errors.push('Número total de parcelas deve ser maior que zero');
    }

    if (installment.installmentValue <= 0) {
      errors.push('Valor da parcela deve ser maior que zero');
    }

    if (installment.totalAmount <= 0) {
      errors.push('Valor total deve ser maior que zero');
    }

    // Validar se o valor total está correto
    const expectedTotal = installment.installmentValue * installment.totalInstallments;
    const tolerance = 0.01; // Tolerância para diferenças de centavos
    
    if (Math.abs(installment.totalAmount - expectedTotal) > tolerance) {
      errors.push('Valor total não condiz com o valor da parcela multiplicado pelo número de parcelas');
    }

    // Validar datas
    const startDate = new Date(installment.startDate);
    const endDate = new Date(installment.endDate);
    
    if (endDate <= startDate) {
      errors.push('Data de término deve ser posterior à data de início');
    }

    // Validar parcelas pagas
    const invalidPaidInstallments = installment.paidInstallments.filter(
      num => num < 1 || num > installment.totalInstallments
    );
    
    if (invalidPaidInstallments.length > 0) {
      errors.push('Existem números de parcelas pagas inválidos');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}