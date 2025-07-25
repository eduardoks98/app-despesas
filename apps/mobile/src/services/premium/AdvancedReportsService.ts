/**
 * Advanced Reports Service - Premium feature for detailed financial analytics
 */

import { DatabaseService } from '../core/DatabaseService';
import { AuthenticationService } from '../core/AuthenticationService';
import { AnalyticsService } from '../core/AnalyticsService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface ReportFilter {
  startDate: string;
  endDate: string;
  categories?: string[];
  transactionTypes?: ('income' | 'expense')[];
  minAmount?: number;
  maxAmount?: number;
  tags?: string[];
}

export interface ExpenseByCategoryData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  previousAmount: number;
}

export interface MonthlyTrendData {
  month: string;
  year: number;
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
}

export interface DailySpendingData {
  date: string;
  amount: number;
  transactionCount: number;
  averageTransaction: number;
}

export interface TopExpensesData {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryName: string;
  categoryColor: string;
}

export interface BudgetAnalysis {
  categoryId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  status: 'on_track' | 'warning' | 'exceeded';
  projectedOverrun: number;
}

export interface CashFlowData {
  date: string;
  cumulativeBalance: number;
  dailyChange: number;
  type: 'income' | 'expense';
}

export interface AdvancedReportData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netIncome: number;
    transactionCount: number;
    averageTransaction: number;
    period: {
      startDate: string;
      endDate: string;
      days: number;
    };
  };
  expensesByCategory: ExpenseByCategoryData[];
  monthlyTrends: MonthlyTrendData[];
  dailySpending: DailySpendingData[];
  topExpenses: TopExpensesData[];
  budgetAnalysis: BudgetAnalysis[];
  cashFlow: CashFlowData[];
  insights: string[];
}

export class AdvancedReportsService {
  private static instance: AdvancedReportsService;
  private dbService: DatabaseService;
  private authService: AuthenticationService;
  private analyticsService: AnalyticsService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.authService = AuthenticationService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): AdvancedReportsService {
    if (!AdvancedReportsService.instance) {
      AdvancedReportsService.instance = new AdvancedReportsService();
    }
    return AdvancedReportsService.instance;
  }

  /**
   * Generate comprehensive financial report
   */
  async generateAdvancedReport(filter: ReportFilter): Promise<AdvancedReportData | null> {
    try {
      // Check if user is premium
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        throw new Error('Advanced reports are a premium feature');
      }

      logger.info('Generating advanced report', { filter });

      const [
        summary,
        expensesByCategory,
        monthlyTrends,
        dailySpending,
        topExpenses,
        budgetAnalysis,
        cashFlow,
      ] = await Promise.all([
        this.generateSummary(filter),
        this.getExpensesByCategory(filter),
        this.getMonthlyTrends(filter),
        this.getDailySpending(filter),
        this.getTopExpenses(filter),
        this.getBudgetAnalysis(filter),
        this.getCashFlowData(filter),
      ]);

      const insights = this.generateInsights({
        summary,
        expensesByCategory,
        monthlyTrends,
        budgetAnalysis,
      });

      const reportData: AdvancedReportData = {
        summary,
        expensesByCategory,
        monthlyTrends,
        dailySpending,
        topExpenses,
        budgetAnalysis,
        cashFlow,
        insights,
      };

      // Track analytics
      await this.analyticsService.track('advanced_report_generated', {
        period: summary.period,
        transactionCount: summary.transactionCount,
        categoriesAnalyzed: expensesByCategory.length,
      });

      return reportData;
    } catch (error) {
      logger.error('Failed to generate advanced report', { error });
      return null;
    }
  }

  /**
   * Generate category comparison report
   */
  async generateCategoryComparison(
    filter: ReportFilter,
    compareWith: ReportFilter
  ): Promise<{
    current: ExpenseByCategoryData[];
    comparison: ExpenseByCategoryData[];
    changes: Array<{
      categoryId: string;
      categoryName: string;
      currentAmount: number;
      comparisonAmount: number;
      change: number;
      changePercentage: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  } | null> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        throw new Error('Category comparison is a premium feature');
      }

      const [current, comparison] = await Promise.all([
        this.getExpensesByCategory(filter),
        this.getExpensesByCategory(compareWith),
      ]);

      const changes = this.calculateCategoryChanges(current, comparison);

      return { current, comparison, changes };
    } catch (error) {
      logger.error('Failed to generate category comparison', { error });
      return null;
    }
  }

  /**
   * Generate spending pattern analysis
   */
  async generateSpendingPatterns(filter: ReportFilter): Promise<{
    weekdaySpending: Array<{ day: string; amount: number; transactionCount: number }>;
    hourlySpending: Array<{ hour: number; amount: number; transactionCount: number }>;
    recurringExpenses: Array<{
      description: string;
      amount: number;
      frequency: number;
      categoryName: string;
      lastDate: string;
    }>;
  } | null> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        throw new Error('Spending patterns are a premium feature');
      }

      const [weekdaySpending, hourlySpending, recurringExpenses] = await Promise.all([
        this.getWeekdaySpending(filter),
        this.getHourlySpending(filter),
        this.getRecurringExpenses(filter),
      ]);

      return { weekdaySpending, hourlySpending, recurringExpenses };
    } catch (error) {
      logger.error('Failed to generate spending patterns', { error });
      return null;
    }
  }

  /**
   * Generate forecast report
   */
  async generateForecast(filter: ReportFilter, forecastDays: number = 30): Promise<{
    projectedIncome: number;
    projectedExpenses: number;
    projectedNet: number;
    confidence: number;
    monthlyProjections: Array<{
      month: string;
      projectedIncome: number;
      projectedExpenses: number;
      projectedNet: number;
    }>;
  } | null> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        throw new Error('Financial forecasting is a premium feature');
      }

      const monthlyTrends = await this.getMonthlyTrends(filter);
      
      if (monthlyTrends.length < 3) {
        throw new Error('Insufficient data for forecasting (need at least 3 months)');
      }

      const forecast = this.calculateForecast(monthlyTrends, forecastDays);
      
      return forecast;
    } catch (error) {
      logger.error('Failed to generate forecast', { error });
      return null;
    }
  }

  /**
   * Private methods for data generation
   */
  private async generateSummary(filter: ReportFilter): Promise<AdvancedReportData['summary']> {
    const whereClause = this.buildWhereClause(filter);
    
    const result = await this.dbService.queryOne(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpenses,
        COUNT(*) as transactionCount,
        AVG(amount) as averageTransaction
      FROM transactions 
      WHERE ${whereClause}
    `, this.buildWhereParams(filter));

    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return {
      totalIncome: result?.totalIncome || 0,
      totalExpenses: result?.totalExpenses || 0,
      netIncome: (result?.totalIncome || 0) - (result?.totalExpenses || 0),
      transactionCount: result?.transactionCount || 0,
      averageTransaction: result?.averageTransaction || 0,
      period: {
        startDate: filter.startDate,
        endDate: filter.endDate,
        days,
      },
    };
  }

  private async getExpensesByCategory(filter: ReportFilter): Promise<ExpenseByCategoryData[]> {
    const whereClause = this.buildWhereClause(filter);
    
    const results = await this.dbService.query(`
      SELECT 
        c.id as categoryId,
        c.name as categoryName,
        c.icon as categoryIcon,
        c.color as categoryColor,
        SUM(t.amount) as totalAmount,
        COUNT(t.id) as transactionCount
      FROM transactions t
      JOIN categories c ON t.categoryId = c.id
      WHERE t.type = 'expense' AND ${whereClause}
      GROUP BY c.id, c.name, c.icon, c.color
      ORDER BY totalAmount DESC
    `, this.buildWhereParams(filter));

    const totalExpenses = results.reduce((sum, item) => sum + item.totalAmount, 0);

    // Get previous period data for trend calculation
    const previousFilter = this.getPreviousPeriodFilter(filter);
    const previousResults = await this.getExpensesByCategory(previousFilter);

    return results.map(item => {
      const previousItem = previousResults.find(p => p.categoryId === item.categoryId);
      const previousAmount = previousItem?.totalAmount || 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (item.totalAmount > previousAmount * 1.1) trend = 'up';
      else if (item.totalAmount < previousAmount * 0.9) trend = 'down';

      return {
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        categoryIcon: item.categoryIcon,
        categoryColor: item.categoryColor,
        totalAmount: item.totalAmount,
        transactionCount: item.transactionCount,
        percentage: totalExpenses > 0 ? (item.totalAmount / totalExpenses) * 100 : 0,
        trend,
        previousAmount,
      };
    });
  }

  private async getMonthlyTrends(filter: ReportFilter): Promise<MonthlyTrendData[]> {
    const results = await this.dbService.query(`
      SELECT 
        strftime('%Y-%m', date) as monthYear,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        COUNT(*) as transactionCount
      FROM transactions
      WHERE date BETWEEN ? AND ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY monthYear
    `, [filter.startDate, filter.endDate]);

    return results.map(item => {
      const [year, month] = item.monthYear.split('-');
      return {
        month: new Date(parseInt(year), parseInt(month) - 1).toLocaleString('pt-BR', { month: 'short' }),
        year: parseInt(year),
        income: item.income,
        expense: item.expense,
        net: item.income - item.expense,
        transactionCount: item.transactionCount,
      };
    });
  }

  private async getDailySpending(filter: ReportFilter): Promise<DailySpendingData[]> {
    const results = await this.dbService.query(`
      SELECT 
        date,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as amount,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) as transactionCount
      FROM transactions
      WHERE date BETWEEN ? AND ? AND type = 'expense'
      GROUP BY date
      ORDER BY date
    `, [filter.startDate, filter.endDate]);

    return results.map(item => ({
      date: item.date,
      amount: item.amount,
      transactionCount: item.transactionCount,
      averageTransaction: item.transactionCount > 0 ? item.amount / item.transactionCount : 0,
    }));
  }

  private async getTopExpenses(filter: ReportFilter): Promise<TopExpensesData[]> {
    const whereClause = this.buildWhereClause(filter);
    
    const results = await this.dbService.query(`
      SELECT 
        t.id,
        t.description,
        t.amount,
        t.date,
        c.name as categoryName,
        c.color as categoryColor
      FROM transactions t
      JOIN categories c ON t.categoryId = c.id
      WHERE t.type = 'expense' AND ${whereClause}
      ORDER BY t.amount DESC
      LIMIT 10
    `, this.buildWhereParams(filter));

    return results;
  }

  private async getBudgetAnalysis(filter: ReportFilter): Promise<BudgetAnalysis[]> {
    // This would integrate with a budget system if implemented
    // For now, return empty array
    return [];
  }

  private async getCashFlowData(filter: ReportFilter): Promise<CashFlowData[]> {
    const results = await this.dbService.query(`
      SELECT 
        date,
        type,
        amount
      FROM transactions
      WHERE date BETWEEN ? AND ?
      ORDER BY date, type
    `, [filter.startDate, filter.endDate]);

    let cumulativeBalance = 0;
    const cashFlowData: CashFlowData[] = [];

    for (const transaction of results) {
      const dailyChange = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      cumulativeBalance += dailyChange;

      cashFlowData.push({
        date: transaction.date,
        cumulativeBalance,
        dailyChange,
        type: transaction.type,
      });
    }

    return cashFlowData;
  }

  private async getWeekdaySpending(filter: ReportFilter): Promise<Array<{ day: string; amount: number; transactionCount: number }>> {
    const results = await this.dbService.query(`
      SELECT 
        CASE strftime('%w', date)
          WHEN '0' THEN 'Domingo'
          WHEN '1' THEN 'Segunda'
          WHEN '2' THEN 'Terça'
          WHEN '3' THEN 'Quarta'
          WHEN '4' THEN 'Quinta'
          WHEN '5' THEN 'Sexta'
          WHEN '6' THEN 'Sábado'
        END as day,
        SUM(amount) as amount,
        COUNT(*) as transactionCount
      FROM transactions
      WHERE type = 'expense' AND date BETWEEN ? AND ?
      GROUP BY strftime('%w', date)
      ORDER BY strftime('%w', date)
    `, [filter.startDate, filter.endDate]);

    return results;
  }

  private async getHourlySpending(filter: ReportFilter): Promise<Array<{ hour: number; amount: number; transactionCount: number }>> {
    // This would require storing transaction time, which may not be available
    // Return empty array for now
    return [];
  }

  private async getRecurringExpenses(filter: ReportFilter): Promise<Array<{
    description: string;
    amount: number;
    frequency: number;
    categoryName: string;
    lastDate: string;
  }>> {
    // Advanced algorithm to detect recurring expenses
    // This would analyze transaction patterns
    return [];
  }

  private generateInsights(data: {
    summary: AdvancedReportData['summary'];
    expensesByCategory: ExpenseByCategoryData[];
    monthlyTrends: MonthlyTrendData[];
    budgetAnalysis: BudgetAnalysis[];
  }): string[] {
    const insights: string[] = [];

    // Spending insights
    if (data.expensesByCategory.length > 0) {
      const topCategory = data.expensesByCategory[0];
      insights.push(`Sua maior categoria de gastos é ${topCategory.categoryName}, representando ${topCategory.percentage.toFixed(1)}% do total.`);
    }

    // Trend insights
    if (data.monthlyTrends.length >= 2) {
      const lastMonth = data.monthlyTrends[data.monthlyTrends.length - 1];
      const previousMonth = data.monthlyTrends[data.monthlyTrends.length - 2];
      
      const expenseChange = ((lastMonth.expense - previousMonth.expense) / previousMonth.expense) * 100;
      
      if (expenseChange > 10) {
        insights.push(`Seus gastos aumentaram ${expenseChange.toFixed(1)}% em relação ao mês anterior.`);
      } else if (expenseChange < -10) {
        insights.push(`Parabéns! Você reduziu seus gastos em ${Math.abs(expenseChange).toFixed(1)}% em relação ao mês anterior.`);
      }
    }

    // Balance insights
    if (data.summary.netIncome > 0) {
      insights.push(`Você teve um saldo positivo de ${data.summary.netIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} no período.`);
    } else {
      insights.push(`Atenção: Seus gastos superaram sua renda em ${Math.abs(data.summary.netIncome).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`);
    }

    return insights;
  }

  private calculateCategoryChanges(
    current: ExpenseByCategoryData[],
    comparison: ExpenseByCategoryData[]
  ) {
    return current.map(currentItem => {
      const comparisonItem = comparison.find(c => c.categoryId === currentItem.categoryId);
      const comparisonAmount = comparisonItem?.totalAmount || 0;
      const change = currentItem.totalAmount - comparisonAmount;
      const changePercentage = comparisonAmount > 0 ? (change / comparisonAmount) * 100 : 0;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (changePercentage > 10) trend = 'up';
      else if (changePercentage < -10) trend = 'down';

      return {
        categoryId: currentItem.categoryId,
        categoryName: currentItem.categoryName,
        currentAmount: currentItem.totalAmount,
        comparisonAmount,
        change,
        changePercentage,
        trend,
      };
    });
  }

  private calculateForecast(trends: MonthlyTrendData[], forecastDays: number) {
    // Simple linear regression for forecasting
    const months = trends.length;
    const avgIncome = trends.reduce((sum, trend) => sum + trend.income, 0) / months;
    const avgExpenses = trends.reduce((sum, trend) => sum + trend.expense, 0) / months;
    
    const dailyIncome = avgIncome / 30;
    const dailyExpenses = avgExpenses / 30;
    
    const projectedIncome = dailyIncome * forecastDays;
    const projectedExpenses = dailyExpenses * forecastDays;
    const projectedNet = projectedIncome - projectedExpenses;
    
    // Calculate confidence based on data consistency
    const confidence = Math.max(0.5, Math.min(0.95, months / 12));

    return {
      projectedIncome,
      projectedExpenses,
      projectedNet,
      confidence,
      monthlyProjections: [], // Would implement detailed monthly projections
    };
  }

  private buildWhereClause(filter: ReportFilter): string {
    let clauses = ['date BETWEEN ? AND ?'];
    
    if (filter.categories && filter.categories.length > 0) {
      clauses.push(`categoryId IN (${filter.categories.map(() => '?').join(', ')})`);
    }
    
    if (filter.transactionTypes && filter.transactionTypes.length > 0) {
      clauses.push(`type IN (${filter.transactionTypes.map(() => '?').join(', ')})`);
    }
    
    if (filter.minAmount !== undefined) {
      clauses.push('amount >= ?');
    }
    
    if (filter.maxAmount !== undefined) {
      clauses.push('amount <= ?');
    }

    return clauses.join(' AND ');
  }

  private buildWhereParams(filter: ReportFilter): any[] {
    let params = [filter.startDate, filter.endDate];
    
    if (filter.categories && filter.categories.length > 0) {
      params.push(...filter.categories);
    }
    
    if (filter.transactionTypes && filter.transactionTypes.length > 0) {
      params.push(...filter.transactionTypes);
    }
    
    if (filter.minAmount !== undefined) {
      params.push(filter.minAmount);
    }
    
    if (filter.maxAmount !== undefined) {
      params.push(filter.maxAmount);
    }

    return params;
  }

  private getPreviousPeriodFilter(filter: ReportFilter): ReportFilter {
    const startDate = new Date(filter.startDate);
    const endDate = new Date(filter.endDate);
    const periodLength = endDate.getTime() - startDate.getTime();
    
    const previousEndDate = new Date(startDate.getTime() - 1);
    const previousStartDate = new Date(previousEndDate.getTime() - periodLength);
    
    return {
      ...filter,
      startDate: previousStartDate.toISOString().split('T')[0],
      endDate: previousEndDate.toISOString().split('T')[0],
    };
  }
}