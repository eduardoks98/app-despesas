import { DIContainer } from './Container';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';
import { SQLiteTransactionRepository } from '../database/sqlite/SQLiteTransactionRepository';
import { SQLiteCategoryRepository } from '../database/sqlite/SQLiteCategoryRepository';
import { AddTransactionUseCase } from '../../application/use-cases/transaction/AddTransactionUseCase';
import { GetTransactionsUseCase } from '../../application/use-cases/transaction/GetTransactionsUseCase';
import { UpdateTransactionUseCase } from '../../application/use-cases/transaction/UpdateTransactionUseCase';
import { GetCategoriesUseCase } from '../../application/use-cases/category/GetCategoriesUseCase';
import { GenerateMonthlyReportUseCase } from '../../application/use-cases/reports/GenerateMonthlyReportUseCase';

export const SERVICE_KEYS = {
  // Repositories
  TRANSACTION_REPOSITORY: 'TransactionRepository',
  CATEGORY_REPOSITORY: 'CategoryRepository',
  
  // Use Cases
  ADD_TRANSACTION_USE_CASE: 'AddTransactionUseCase',
  GET_TRANSACTIONS_USE_CASE: 'GetTransactionsUseCase',
  UPDATE_TRANSACTION_USE_CASE: 'UpdateTransactionUseCase',
  GET_CATEGORIES_USE_CASE: 'GetCategoriesUseCase',
  GENERATE_MONTHLY_REPORT_USE_CASE: 'GenerateMonthlyReportUseCase',
} as const;

export function registerServices(container: DIContainer): void {
  // Register repositories
  container.register<ITransactionRepository>(
    SERVICE_KEYS.TRANSACTION_REPOSITORY,
    () => new SQLiteTransactionRepository()
  );

  container.register<ICategoryRepository>(
    SERVICE_KEYS.CATEGORY_REPOSITORY,
    () => new SQLiteCategoryRepository()
  );

  // Register use cases
  container.register<AddTransactionUseCase>(
    SERVICE_KEYS.ADD_TRANSACTION_USE_CASE,
    () => new AddTransactionUseCase(
      container.get<ITransactionRepository>(SERVICE_KEYS.TRANSACTION_REPOSITORY),
      container.get<ICategoryRepository>(SERVICE_KEYS.CATEGORY_REPOSITORY)
    )
  );

  container.register<GetTransactionsUseCase>(
    SERVICE_KEYS.GET_TRANSACTIONS_USE_CASE,
    () => new GetTransactionsUseCase(
      container.get<ITransactionRepository>(SERVICE_KEYS.TRANSACTION_REPOSITORY)
    )
  );

  container.register<UpdateTransactionUseCase>(
    SERVICE_KEYS.UPDATE_TRANSACTION_USE_CASE,
    () => new UpdateTransactionUseCase(
      container.get<ITransactionRepository>(SERVICE_KEYS.TRANSACTION_REPOSITORY),
      container.get<ICategoryRepository>(SERVICE_KEYS.CATEGORY_REPOSITORY)
    )
  );

  container.register<GetCategoriesUseCase>(
    SERVICE_KEYS.GET_CATEGORIES_USE_CASE,
    () => new GetCategoriesUseCase(
      container.get<ICategoryRepository>(SERVICE_KEYS.CATEGORY_REPOSITORY)
    )
  );

  container.register<GenerateMonthlyReportUseCase>(
    SERVICE_KEYS.GENERATE_MONTHLY_REPORT_USE_CASE,
    () => new GenerateMonthlyReportUseCase(
      container.get<ITransactionRepository>(SERVICE_KEYS.TRANSACTION_REPOSITORY),
      container.get<ICategoryRepository>(SERVICE_KEYS.CATEGORY_REPOSITORY)
    )
  );
}