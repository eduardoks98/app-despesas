import { DIContainer, registerServices, SERVICE_KEYS } from '@app-despesas/core';
import { 
  AddTransactionUseCase,
  GetTransactionsUseCase,
  UpdateTransactionUseCase,
  GetCategoriesUseCase,
  GenerateMonthlyReportUseCase
} from '@app-despesas/core';

// Global app container
class AppContainer {
  private container: DIContainer;
  private initialized = false;

  constructor() {
    this.container = new DIContainer();
  }

  initialize(): void {
    if (this.initialized) {
      return;
    }

    registerServices(this.container);
    this.initialized = true;
  }

  // Use Case getters
  get addTransactionUseCase(): AddTransactionUseCase {
    return this.container.get<AddTransactionUseCase>(SERVICE_KEYS.ADD_TRANSACTION_USE_CASE);
  }

  get getTransactionsUseCase(): GetTransactionsUseCase {
    return this.container.get<GetTransactionsUseCase>(SERVICE_KEYS.GET_TRANSACTIONS_USE_CASE);
  }

  get updateTransactionUseCase(): UpdateTransactionUseCase {
    return this.container.get<UpdateTransactionUseCase>(SERVICE_KEYS.UPDATE_TRANSACTION_USE_CASE);
  }

  get getCategoriesUseCase(): GetCategoriesUseCase {
    return this.container.get<GetCategoriesUseCase>(SERVICE_KEYS.GET_CATEGORIES_USE_CASE);
  }

  get generateMonthlyReportUseCase(): GenerateMonthlyReportUseCase {
    return this.container.get<GenerateMonthlyReportUseCase>(SERVICE_KEYS.GENERATE_MONTHLY_REPORT_USE_CASE);
  }
}

// Singleton instance
export const appContainer = new AppContainer();

// Initialize on import
appContainer.initialize();