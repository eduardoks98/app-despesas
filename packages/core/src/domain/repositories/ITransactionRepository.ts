import { Transaction, TransactionType } from '../entities/Transaction';
import { DateRange } from '../value-objects/DateRange';

export interface TransactionFilter {
  type?: TransactionType;
  categoryId?: string;
  dateRange?: DateRange;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  installmentId?: string;
  subscriptionId?: string;
}

export interface ITransactionRepository {
  save(transaction: Transaction): Promise<void>;
  update(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Transaction | null>;
  findAll(filter?: TransactionFilter): Promise<Transaction[]>;
  findByCategory(categoryId: string): Promise<Transaction[]>;
  findByInstallment(installmentId: string): Promise<Transaction[]>;
  findBySubscription(subscriptionId: string): Promise<Transaction[]>;
  getTotalByType(type: TransactionType, dateRange?: DateRange): Promise<number>;
  getMonthlyBalance(year: number, month: number): Promise<{
    income: number;
    expense: number;
    balance: number;
  }>;
}