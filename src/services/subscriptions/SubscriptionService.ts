import { StorageService } from '../storage/StorageService';
import { Subscription, Transaction } from '../../types';
import { isAfter, addMonths, setDate, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export class SubscriptionService {
  // Verificar e criar transações para assinaturas vencidas
  static async processSubscriptions(): Promise<void> {
    const subscriptions = await StorageService.getSubscriptions();
    const today = new Date();

    for (const subscription of subscriptions) {
      if (subscription.status !== 'active') continue;

      const nextPaymentDate = new Date(subscription.nextPaymentDate);
      
      // Se a data de pagamento já passou
      if (isAfter(today, nextPaymentDate)) {
        // Verificar se já foi pago neste mês para evitar duplicação
        const alreadyPaidThisMonth = await this.isSubscriptionPaidThisMonth(
          subscription.id, 
          nextPaymentDate
        );

        if (!alreadyPaidThisMonth) {
          // Criar transação apenas se não foi pago ainda
          const transaction: Transaction = {
            id: `transaction_${Date.now()}_${subscription.id}`,
            type: 'expense',
            amount: subscription.amount,
            description: subscription.name,
            category: subscription.category,
            date: nextPaymentDate.toISOString(),
            subscriptionId: subscription.id,
            isRecurring: true,
            paymentMethod: subscription.paymentMethod === 'boleto' ? 'credit' : subscription.paymentMethod,
          };

          await StorageService.saveTransaction(transaction);
        }

        // Atualizar próxima data de pagamento independentemente
        const updatedSubscription = {
          ...subscription,
          lastPaymentDate: nextPaymentDate.toISOString(),
          nextPaymentDate: addMonths(nextPaymentDate, 1).toISOString(),
        };

        await StorageService.updateSubscription(updatedSubscription);
      }
    }
  }

  // Obter assinaturas que vencem nos próximos dias
  static async getUpcomingSubscriptions(days: number = 7): Promise<Subscription[]> {
    const subscriptions = await StorageService.getSubscriptions();
    const today = new Date();
    const futureDate = addMonths(today, days);

    return subscriptions.filter(sub => {
      if (sub.status !== 'active') return false;
      const nextPayment = new Date(sub.nextPaymentDate);
      return nextPayment >= today && nextPayment <= futureDate;
    });
  }

  // Obter assinaturas vencidas
  static async getOverdueSubscriptions(): Promise<Subscription[]> {
    const subscriptions = await StorageService.getSubscriptions();
    const today = new Date();

    return subscriptions.filter(sub => {
      if (sub.status !== 'active') return false;
      const nextPayment = new Date(sub.nextPaymentDate);
      return isAfter(today, nextPayment);
    });
  }

  // Calcular total mensal de assinaturas ativas
  static async getMonthlyTotal(): Promise<number> {
    const subscriptions = await StorageService.getSubscriptions();
    return subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((total, sub) => total + sub.amount, 0);
  }

  // Verificar se uma assinatura já foi paga no mês atual
  static async isSubscriptionPaidThisMonth(subscriptionId: string, month?: Date): Promise<boolean> {
    const transactions = await StorageService.getTransactions();
    const targetMonth = month || new Date();
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);

    // Procurar transações da assinatura no mês especificado
    const paidThisMonth = transactions.some(transaction => {
      // Verificar se é da assinatura
      if (transaction.subscriptionId !== subscriptionId) return false;
      
      // Verificar se está no mês correto
      const transactionDate = new Date(transaction.date);
      if (!isWithinInterval(transactionDate, { start: monthStart, end: monthEnd })) return false;
      
      // Verificar se foi paga (assumir true se isPaid não estiver definido)
      return transaction.isPaid !== false;
    });

    return paidThisMonth;
  }

  // Obter última transação paga de uma assinatura no mês atual
  static async getLastPaymentThisMonth(subscriptionId: string, month?: Date): Promise<Transaction | null> {
    const transactions = await StorageService.getTransactions();
    const targetMonth = month || new Date();
    const monthStart = startOfMonth(targetMonth);
    const monthEnd = endOfMonth(targetMonth);

    // Procurar transações da assinatura no mês especificado
    const monthTransactions = transactions.filter(transaction => {
      if (transaction.subscriptionId !== subscriptionId) return false;
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, { start: monthStart, end: monthEnd }) &&
             transaction.isPaid !== false;
    });

    // Retornar a mais recente
    if (monthTransactions.length === 0) return null;
    
    return monthTransactions.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
  }

  // Obter estatísticas das assinaturas
  static async getSubscriptionStats() {
    const subscriptions = await StorageService.getSubscriptions();
    const active = subscriptions.filter(s => s.status === 'active');
    const paused = subscriptions.filter(s => s.status === 'paused');
    const cancelled = subscriptions.filter(s => s.status === 'cancelled');

    return {
      total: subscriptions.length,
      active: active.length,
      paused: paused.length,
      cancelled: cancelled.length,
      monthlyTotal: active.reduce((sum, sub) => sum + sub.amount, 0),
    };
  }
} 