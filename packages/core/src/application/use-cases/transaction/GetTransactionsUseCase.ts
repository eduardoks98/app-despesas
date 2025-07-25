import { Transaction, TransactionType } from '../../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilter } from '../../../domain/repositories/ITransactionRepository';
import { DateRange } from '../../../domain/value-objects/DateRange';

export interface GetTransactionsRequest {
  type?: 'income' | 'expense';
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface GetTransactionsResponse {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export class GetTransactionsUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository
  ) {}

  async execute(request?: GetTransactionsRequest): Promise<GetTransactionsResponse> {
    const filter: TransactionFilter = {};

    if (request) {
      if (request.type) {
        filter.type = request.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE;
      }

      if (request.categoryId) {
        filter.categoryId = request.categoryId;
      }

      if (request.startDate && request.endDate) {
        filter.dateRange = new DateRange(request.startDate, request.endDate);
      }

      if (request.minAmount) {
        filter.minAmount = request.minAmount;
      }

      if (request.maxAmount) {
        filter.maxAmount = request.maxAmount;
      }

      if (request.search) {
        filter.search = request.search;
      }
    }

    const transactions = await this.transactionRepository.findAll(filter);

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      if (transaction.type === TransactionType.INCOME) {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    return {
      transactions,
      totalIncome,
      totalExpense,
      balance,
    };
  }
}