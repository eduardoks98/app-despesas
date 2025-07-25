import { Transaction, TransactionType, TransactionProps } from '../../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilter } from '../../../domain/repositories/ITransactionRepository';
import { DateRange } from '../../../domain/value-objects/DateRange';

// This is a mock implementation for now - will be replaced with actual SQLite
export class SQLiteTransactionRepository implements ITransactionRepository {
  private transactions: Transaction[] = [];

  async save(transaction: Transaction): Promise<void> {
    this.transactions.push(transaction);
  }

  async update(transaction: Transaction): Promise<void> {
    const index = this.transactions.findIndex(t => t.id === transaction.id);
    if (index !== -1) {
      this.transactions[index] = transaction;
    }
  }

  async delete(id: string): Promise<void> {
    this.transactions = this.transactions.filter(t => t.id !== id);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.find(t => t.id === id) || null;
  }

  async findAll(filter?: TransactionFilter): Promise<Transaction[]> {
    let result = [...this.transactions];

    if (filter) {
      if (filter.type) {
        result = result.filter(t => t.type === filter.type);
      }

      if (filter.categoryId) {
        result = result.filter(t => t.categoryId === filter.categoryId);
      }

      if (filter.dateRange) {
        result = result.filter(t => filter.dateRange!.contains(t.date));
      }

      if (filter.minAmount) {
        result = result.filter(t => t.amount >= filter.minAmount!);
      }

      if (filter.maxAmount) {
        result = result.filter(t => t.amount <= filter.maxAmount!);
      }

      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        result = result.filter(t => 
          t.description.toLowerCase().includes(searchLower) ||
          t.notes?.toLowerCase().includes(searchLower) ||
          t.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }

      if (filter.installmentId) {
        result = result.filter(t => t.installmentId === filter.installmentId);
      }

      if (filter.subscriptionId) {
        result = result.filter(t => t.subscriptionId === filter.subscriptionId);
      }
    }

    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    return this.transactions.filter(t => t.categoryId === categoryId);
  }

  async findByInstallment(installmentId: string): Promise<Transaction[]> {
    return this.transactions.filter(t => t.installmentId === installmentId);
  }

  async findBySubscription(subscriptionId: string): Promise<Transaction[]> {
    return this.transactions.filter(t => t.subscriptionId === subscriptionId);
  }

  async getTotalByType(type: TransactionType, dateRange?: DateRange): Promise<number> {
    let filtered = this.transactions.filter(t => t.type === type);
    
    if (dateRange) {
      filtered = filtered.filter(t => dateRange.contains(t.date));
    }

    return filtered.reduce((total, t) => total + t.amount, 0);
  }

  async getMonthlyBalance(year: number, month: number): Promise<{
    income: number;
    expense: number;
    balance: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const dateRange = new DateRange(startDate, endDate);

    const income = await this.getTotalByType(TransactionType.INCOME, dateRange);
    const expense = await this.getTotalByType(TransactionType.EXPENSE, dateRange);

    return {
      income,
      expense,
      balance: income - expense,
    };
  }
}