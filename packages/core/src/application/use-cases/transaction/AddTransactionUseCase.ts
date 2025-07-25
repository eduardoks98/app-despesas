import { Transaction, TransactionProps, TransactionType } from '../../../domain/entities/Transaction';
import { ITransactionRepository } from '../../../domain/repositories/ITransactionRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';

export interface AddTransactionRequest {
  amount: number;
  description: string;
  date: Date;
  type: 'income' | 'expense';
  categoryId: string;
  tags?: string[];
  notes?: string;
}

export interface AddTransactionResponse {
  transaction: Transaction;
}

export class AddTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(request: AddTransactionRequest): Promise<AddTransactionResponse> {
    // Validate category exists
    const category = await this.categoryRepository.findById(request.categoryId);
    if (!category) {
      throw new Error('Category not found');
    }

    // Create transaction
    const transactionProps: TransactionProps = {
      amount: request.amount,
      description: request.description,
      date: request.date,
      type: request.type === 'income' ? TransactionType.INCOME : TransactionType.EXPENSE,
      categoryId: request.categoryId,
      tags: request.tags,
      notes: request.notes,
    };

    const transaction = new Transaction(transactionProps);

    // Save transaction
    await this.transactionRepository.save(transaction);

    return {
      transaction,
    };
  }
}