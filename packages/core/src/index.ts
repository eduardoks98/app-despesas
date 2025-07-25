// Entities
export { Transaction, TransactionType, type TransactionProps } from './domain/entities/Transaction';
export { Category, type CategoryProps } from './domain/entities/Category';
export { Installment, type InstallmentProps } from './domain/entities/Installment';
export { Subscription, BillingCycle, type SubscriptionProps } from './domain/entities/Subscription';

// Value Objects
export { Money } from './domain/value-objects/Money';
export { DateRange } from './domain/value-objects/DateRange';

// Repository Interfaces
export { type ITransactionRepository, type TransactionFilter } from './domain/repositories/ITransactionRepository';
export { type ICategoryRepository } from './domain/repositories/ICategoryRepository';
export { type IInstallmentRepository } from './domain/repositories/IInstallmentRepository';
export { type ISubscriptionRepository } from './domain/repositories/ISubscriptionRepository';

// Use Cases
export { AddTransactionUseCase, type AddTransactionRequest, type AddTransactionResponse } from './application/use-cases/transaction/AddTransactionUseCase';
export { GetTransactionsUseCase, type GetTransactionsRequest, type GetTransactionsResponse } from './application/use-cases/transaction/GetTransactionsUseCase';
export { UpdateTransactionUseCase, type UpdateTransactionRequest, type UpdateTransactionResponse } from './application/use-cases/transaction/UpdateTransactionUseCase';
export { GetCategoriesUseCase, type GetCategoriesResponse } from './application/use-cases/category/GetCategoriesUseCase';
export { GenerateMonthlyReportUseCase, type MonthlyReportRequest, type MonthlyReportResponse, type CategorySummary } from './application/use-cases/reports/GenerateMonthlyReportUseCase';

// Infrastructure
export { DIContainer, type ServiceContainer } from './infrastructure/di/Container';
export { registerServices, SERVICE_KEYS } from './infrastructure/di/ServiceRegistry';
export { SQLiteTransactionRepository } from './infrastructure/database/sqlite/SQLiteTransactionRepository';
export { SQLiteCategoryRepository } from './infrastructure/database/sqlite/SQLiteCategoryRepository';