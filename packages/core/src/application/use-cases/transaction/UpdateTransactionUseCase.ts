import { Transaction } from '../../../domain/entities/Transaction';
import { ITransactionRepository } from '../../../domain/repositories/ITransactionRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';

export interface UpdateTransactionRequest {
  id: string;
  amount?: number;
  description?: string;
  categoryId?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateTransactionResponse {
  transaction: Transaction;
}

export class UpdateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(request: UpdateTransactionRequest): Promise<UpdateTransactionResponse> {
    // Find existing transaction
    const transaction = await this.transactionRepository.findById(request.id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Validate category if provided
    if (request.categoryId) {
      const category = await this.categoryRepository.findById(request.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
    }

    // Update fields
    if (request.amount !== undefined) {
      transaction.updateAmount(request.amount);
    }

    if (request.description !== undefined) {
      transaction.updateDescription(request.description);
    }

    if (request.categoryId) {
      transaction.updateCategory(request.categoryId);
    }

    // Update tags
    if (request.tags !== undefined) {
      // Remove all existing tags and add new ones
      const currentTags = transaction.tags;
      currentTags.forEach(tag => transaction.removeTag(tag));
      request.tags.forEach(tag => transaction.addTag(tag));
    }

    // Save updated transaction
    await this.transactionRepository.update(transaction);

    return {
      transaction,
    };
  }
}