import { AddTransactionUseCase } from '../application/use-cases/transaction/AddTransactionUseCase';
import { Category } from '../domain/entities/Category';
import { Transaction, TransactionType } from '../domain/entities/Transaction';
import { ICategoryRepository } from '../domain/repositories/ICategoryRepository';
import { ITransactionRepository } from '../domain/repositories/ITransactionRepository';

// Mock implementations
class MockTransactionRepository implements ITransactionRepository {
  private transactions: Transaction[] = [];

  async save(transaction: Transaction): Promise<void> {
    this.transactions.push(transaction);
  }

  async update(transaction: Transaction): Promise<void> {
    const index = this.transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) {
      this.transactions[index] = transaction;
    }
  }

  async delete(id: string): Promise<void> {
    this.transactions = this.transactions.filter(t => t.id !== id);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.find(t => t.id === id) || null;
  }

  async findAll(): Promise<Transaction[]> {
    return [...this.transactions];
  }

  async findByCategory(): Promise<Transaction[]> {
    return [];
  }

  async findByInstallment(): Promise<Transaction[]> {
    return [];
  }

  async findBySubscription(): Promise<Transaction[]> {
    return [];
  }

  async getTotalByType(): Promise<number> {
    return 0;
  }

  async getMonthlyBalance(): Promise<{ income: number; expense: number; balance: number }> {
    return { income: 0, expense: 0, balance: 0 };
  }
}

class MockCategoryRepository implements ICategoryRepository {
  private categories: Category[] = [];

  constructor() {
    // Add a test category
    this.categories.push(new Category({
      id: 'test-category',
      name: 'Test Category',
      icon: 'test-icon',
      color: '#FF0000'
    }));
  }

  async save(category: Category): Promise<void> {
    this.categories.push(category);
  }

  async update(category: Category): Promise<void> {
    const index = this.categories.findIndex(c => c.id === category.id);
    if (index >= 0) {
      this.categories[index] = category;
    }
  }

  async delete(id: string): Promise<void> {
    this.categories = this.categories.filter(c => c.id !== id);
  }

  async findById(id: string): Promise<Category | null> {
    return this.categories.find(c => c.id === id) || null;
  }

  async findAll(): Promise<Category[]> {
    return [...this.categories];
  }

  async findByParent(): Promise<Category[]> {
    return [];
  }

  async findSystemCategories(): Promise<Category[]> {
    return this.categories.filter(c => c.isSystem);
  }
}

describe('AddTransactionUseCase', () => {
  let useCase: AddTransactionUseCase;
  let transactionRepository: MockTransactionRepository;
  let categoryRepository: MockCategoryRepository;

  beforeEach(() => {
    transactionRepository = new MockTransactionRepository();
    categoryRepository = new MockCategoryRepository();
    useCase = new AddTransactionUseCase(transactionRepository, categoryRepository);
  });

  it('should add a new transaction successfully', async () => {
    // Arrange
    const request = {
      amount: 100.50,
      description: 'Test transaction',
      date: new Date('2024-01-15'),
      type: 'expense' as const,
      categoryId: 'test-category',
      tags: ['test', 'example'],
      notes: 'This is a test transaction'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.transaction).toBeDefined();
    expect(result.transaction.amount).toBe(100.50);
    expect(result.transaction.description).toBe('Test transaction');
    expect(result.transaction.type).toBe(TransactionType.EXPENSE);
    expect(result.transaction.categoryId).toBe('test-category');
    expect(result.transaction.tags).toEqual(['test', 'example']);
    expect(result.transaction.notes).toBe('This is a test transaction');

    // Verify transaction was saved
    const savedTransactions = await transactionRepository.findAll();
    expect(savedTransactions).toHaveLength(1);
    expect(savedTransactions[0].id).toBe(result.transaction.id);
  });

  it('should create income transaction correctly', async () => {
    // Arrange
    const request = {
      amount: 2500.00,
      description: 'Salary',
      date: new Date('2024-01-01'),
      type: 'income' as const,
      categoryId: 'test-category'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.transaction.type).toBe(TransactionType.INCOME);
    expect(result.transaction.amount).toBe(2500.00);
  });

  it('should throw error when category does not exist', async () => {
    // Arrange
    const request = {
      amount: 50.00,
      description: 'Test transaction',
      date: new Date(),
      type: 'expense' as const,
      categoryId: 'non-existent-category'
    };

    // Act & Assert
    await expect(useCase.execute(request)).rejects.toThrow('Category not found');
  });

  it('should handle transactions without optional fields', async () => {
    // Arrange
    const request = {
      amount: 25.99,
      description: 'Simple transaction',
      date: new Date('2024-02-01'),
      type: 'expense' as const,
      categoryId: 'test-category'
    };

    // Act
    const result = await useCase.execute(request);

    // Assert
    expect(result.transaction.tags).toEqual([]);
    expect(result.transaction.notes).toBeUndefined();
  });

  it('should validate transaction data through entity', async () => {
    // Arrange
    const request = {
      amount: -50.00, // Invalid amount
      description: 'Invalid transaction',
      date: new Date(),
      type: 'expense' as const,
      categoryId: 'test-category'
    };

    // Act & Assert
    await expect(useCase.execute(request)).rejects.toThrow('Transaction amount must be greater than 0');
  });
});