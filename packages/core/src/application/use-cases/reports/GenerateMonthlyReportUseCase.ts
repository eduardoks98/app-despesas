import { ITransactionRepository } from '../../../domain/repositories/ITransactionRepository';
import { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';
import { TransactionType } from '../../../domain/entities/Transaction';
import { DateRange } from '../../../domain/value-objects/DateRange';

export interface MonthlyReportRequest {
  year: number;
  month: number; // 1-12
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface MonthlyReportResponse {
  period: {
    year: number;
    month: number;
    monthName: string;
  };
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
  };
  incomeByCategory: CategorySummary[];
  expenseByCategory: CategorySummary[];
}

export class GenerateMonthlyReportUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly categoryRepository: ICategoryRepository
  ) {}

  async execute(request: MonthlyReportRequest): Promise<MonthlyReportResponse> {
    const { year, month } = request;
    
    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const dateRange = new DateRange(startDate, endDate);

    // Get all transactions for the period
    const transactions = await this.transactionRepository.findAll({ dateRange });
    
    // Get all categories
    const categories = await this.categoryRepository.findAll();
    const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    const incomeByCategory = new Map<string, { amount: number; count: number }>();
    const expenseByCategory = new Map<string, { amount: number; count: number }>();

    transactions.forEach(transaction => {
      const categoryData = { amount: transaction.amount, count: 1 };
      
      if (transaction.type === TransactionType.INCOME) {
        totalIncome += transaction.amount;
        const existing = incomeByCategory.get(transaction.categoryId);
        incomeByCategory.set(transaction.categoryId, {
          amount: (existing?.amount || 0) + categoryData.amount,
          count: (existing?.count || 0) + categoryData.count,
        });
      } else {
        totalExpense += transaction.amount;
        const existing = expenseByCategory.get(transaction.categoryId);
        expenseByCategory.set(transaction.categoryId, {
          amount: (existing?.amount || 0) + categoryData.amount,
          count: (existing?.count || 0) + categoryData.count,
        });
      }
    });

    const balance = totalIncome - totalExpense;

    // Create category summaries
    const createCategorySummary = (
      categoryMap: Map<string, string>,
      dataMap: Map<string, { amount: number; count: number }>,
      total: number
    ): CategorySummary[] => {
      return Array.from(dataMap.entries())
        .map(([categoryId, data]) => ({
          categoryId,
          categoryName: categoryMap.get(categoryId) || 'Unknown Category',
          totalAmount: data.amount,
          transactionCount: data.count,
          percentage: total > 0 ? (data.amount / total) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount);
    };

    const incomeCategories = createCategorySummary(categoryMap, incomeByCategory, totalIncome);
    const expenseCategories = createCategorySummary(categoryMap, expenseByCategory, totalExpense);

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    return {
      period: {
        year,
        month,
        monthName: monthNames[month - 1],
      },
      summary: {
        totalIncome,
        totalExpense,
        balance,
      },
      incomeByCategory: incomeCategories,
      expenseByCategory: expenseCategories,
    };
  }
}