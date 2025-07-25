import { Transaction, TransactionType, TransactionProps } from '../../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilter } from '../../../domain/repositories/ITransactionRepository';
import { DateRange } from '../../../domain/value-objects/DateRange';
import { ApiClient } from './ApiClient';

interface ApiTransactionData {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  categoryId: string;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  installmentId?: string;
  subscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export class ApiTransactionRepository implements ITransactionRepository {
  constructor(private apiClient: ApiClient) {}

  async save(transaction: Transaction): Promise<void> {
    const data = this.transactionToApiData(transaction);
    await this.apiClient.post('/transactions', data);
  }

  async update(transaction: Transaction): Promise<void> {
    const data = this.transactionToApiData(transaction);
    await this.apiClient.put(`/transactions/${transaction.id}`, data);
  }

  async delete(id: string): Promise<void> {
    await this.apiClient.delete(`/transactions/${id}`);
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const data = await this.apiClient.get<ApiTransactionData>(`/transactions/${id}`);
      return this.apiDataToTransaction(data);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  }

  async findAll(filter?: TransactionFilter): Promise<Transaction[]> {
    const params = this.buildFilterParams(filter);
    const data = await this.apiClient.get<ApiTransactionData[]>('/transactions', params);
    return data.map(item => this.apiDataToTransaction(item));
  }

  async findByCategory(categoryId: string): Promise<Transaction[]> {
    return this.findAll({ categoryId });
  }

  async findByInstallment(installmentId: string): Promise<Transaction[]> {
    return this.findAll({ installmentId });
  }

  async findBySubscription(subscriptionId: string): Promise<Transaction[]> {
    return this.findAll({ subscriptionId });
  }

  async getTotalByType(type: TransactionType, dateRange?: DateRange): Promise<number> {
    const params: any = { type: type === TransactionType.INCOME ? 'income' : 'expense' };
    
    if (dateRange) {
      params.startDate = dateRange.startDate.toISOString();
      params.endDate = dateRange.endDate.toISOString();
    }

    const response = await this.apiClient.get<{ total: number }>('/transactions/total', params);
    return response.total;
  }

  async getMonthlyBalance(year: number, month: number): Promise<{
    income: number;
    expense: number;
    balance: number;
  }> {
    const response = await this.apiClient.get<{
      income: number;
      expense: number;
      balance: number;
    }>(`/reports/balance/${year}/${month}`);
    
    return response;
  }

  private transactionToApiData(transaction: Transaction): ApiTransactionData {
    const json = transaction.toJSON();
    return {
      id: json.id!,
      amount: json.amount,
      description: json.description,
      date: json.date.toISOString(),
      type: json.type === TransactionType.INCOME ? 'income' : 'expense',
      categoryId: json.categoryId,
      tags: json.tags,
      notes: json.notes,
      isRecurring: json.isRecurring,
      installmentId: json.installmentId,
      subscriptionId: json.subscriptionId,
      createdAt: json.createdAt!.toISOString(),
      updatedAt: json.updatedAt!.toISOString(),
    };
  }

  private apiDataToTransaction(data: ApiTransactionData): Transaction {
    const props: TransactionProps = {
      id: data.id,
      amount: data.amount,
      description: data.description,
      date: new Date(data.date),
      type: data.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
      categoryId: data.categoryId,
      tags: data.tags,
      notes: data.notes,
      isRecurring: data.isRecurring,
      installmentId: data.installmentId,
      subscriptionId: data.subscriptionId,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };

    return new Transaction(props);
  }

  private buildFilterParams(filter?: TransactionFilter): Record<string, any> {
    if (!filter) return {};

    const params: Record<string, any> = {};

    if (filter.type) {
      params.type = filter.type === TransactionType.INCOME ? 'income' : 'expense';
    }

    if (filter.categoryId) {
      params.categoryId = filter.categoryId;
    }

    if (filter.dateRange) {
      params.startDate = filter.dateRange.startDate.toISOString();
      params.endDate = filter.dateRange.endDate.toISOString();
    }

    if (filter.minAmount) {
      params.minAmount = filter.minAmount;
    }

    if (filter.maxAmount) {
      params.maxAmount = filter.maxAmount;
    }

    if (filter.search) {
      params.search = filter.search;
    }

    if (filter.installmentId) {
      params.installmentId = filter.installmentId;
    }

    if (filter.subscriptionId) {
      params.subscriptionId = filter.subscriptionId;
    }

    return params;
  }

  private isNotFoundError(error: any): boolean {
    return error?.status === 404 || error?.response?.status === 404;
  }
}