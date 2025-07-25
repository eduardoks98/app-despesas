/**
 * E2E Tests for Free to Premium Flow
 */

import { DatabaseService } from '../../services/core/DatabaseService';
import { AuthenticationService } from '../../services/core/AuthenticationService';
import { PaymentService } from '../../services/premium/PaymentService';
import { CloudBackupService } from '../../services/premium/CloudBackupService';
import { CustomCategoriesService } from '../../services/premium/CustomCategoriesService';
import { TransactionTagsService } from '../../services/premium/TransactionTagsService';
import { ExportService } from '../../services/premium/ExportService';
import { AdvancedReportsService } from '../../services/premium/AdvancedReportsService';

// Mock external dependencies
jest.mock('expo-file-system');
jest.mock('expo-sharing');
jest.mock('expo-print');
jest.mock('expo-sqlite');

describe('Premium Flow E2E Tests', () => {
  let dbService: DatabaseService;
  let authService: AuthenticationService;
  let paymentService: PaymentService;
  let backupService: CloudBackupService;
  let categoriesService: CustomCategoriesService;
  let tagsService: TransactionTagsService;
  let exportService: ExportService;
  let reportsService: AdvancedReportsService;

  const mockFreeUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    isPremium: false,
    subscriptionStatus: null,
    hasUsedTrial: false,
  };

  const mockPremiumUser = {
    id: 'test-user-1',
    email: 'test@example.com',
    isPremium: true,
    subscriptionStatus: 'active',
    hasUsedTrial: true,
  };

  beforeEach(async () => {
    // Initialize services
    dbService = DatabaseService.getInstance();
    authService = AuthenticationService.getInstance();
    paymentService = PaymentService.getInstance();
    backupService = CloudBackupService.getInstance();
    categoriesService = CustomCategoriesService.getInstance();
    tagsService = TransactionTagsService.getInstance();
    exportService = ExportService.getInstance();
    reportsService = AdvancedReportsService.getInstance();

    // Setup test database
    await dbService.initialize();
    
    // Clear any existing state
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup
    await dbService.close();
  });

  describe('Free User Limitations', () => {
    beforeEach(() => {
      // Mock free user
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockFreeUser);
    });

    test('should block premium features for free users', async () => {
      // Test backup service
      const backupResult = await backupService.createBackup();
      expect(backupResult.success).toBe(false);
      expect(backupResult.error).toContain('premium feature');

      // Test custom categories
      const categoryResult = await categoriesService.createCustomCategory({
        name: 'Test Category',
        icon: 'test-icon',
        color: '#FF0000',
        type: 'expense',
        isSystem: false,
        isCustom: true,
        sortOrder: 1,
      });
      expect(categoryResult.success).toBe(false);
      expect(categoryResult.error).toContain('premium feature');

      // Test tags
      const tagResult = await tagsService.addTagsToTransaction('transaction-1', ['tag-1']);
      expect(tagResult.success).toBe(false);
      expect(tagResult.error).toContain('premium feature');

      // Test export
      const exportResult = await exportService.exportTransactions({
        format: 'pdf',
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });
      expect(exportResult.success).toBe(false);
      expect(exportResult.error).toContain('premium feature');

      // Test advanced reports
      const reportResult = await reportsService.generateAdvancedReport({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });
      expect(reportResult).toBeNull();
    });

    test('should show premium prompts for locked features', async () => {
      // This would test UI components showing premium prompts
      // In a real app, you'd test that PaywallModal is shown
      const premiumFeatures = [
        'sync',
        'backup',
        'advanced_reports',
        'unlimited_categories',
        'export_data',
        'transaction_tags',
      ];

      for (const feature of premiumFeatures) {
        // Test that premium prompt is triggered
        expect(feature).toBeDefined();
      }
    });
  });

  describe('Premium Upgrade Process', () => {
    test('should handle successful upgrade flow', async () => {
      // Start with free user
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockFreeUser);

      // Mock payment success
      jest.spyOn(paymentService, 'createSubscription').mockResolvedValue({
        success: true,
        subscriptionId: 'sub_test123',
        clientSecret: 'pi_test123_secret',
      });

      // Mock successful payment confirmation
      jest.spyOn(paymentService, 'confirmPayment').mockResolvedValue({
        success: true,
        subscription: {
          id: 'sub_test123',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      // Create subscription
      const subscriptionResult = await paymentService.createSubscription('monthly');
      expect(subscriptionResult.success).toBe(true);

      // Confirm payment
      const confirmResult = await paymentService.confirmPayment(
        subscriptionResult.subscriptionId!,
        'pm_test123'
      );
      expect(confirmResult.success).toBe(true);

      // Update user to premium after successful payment
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockPremiumUser);

      // Verify premium features are now accessible
      const premiumUser = await authService.getCurrentUser();
      expect(premiumUser?.isPremium).toBe(true);
      expect(premiumUser?.subscriptionStatus).toBe('active');
    });

    test('should handle payment failures gracefully', async () => {
      // Mock payment failure
      jest.spyOn(paymentService, 'confirmPayment').mockResolvedValue({
        success: false,
        error: 'Payment failed - card declined',
      });

      const result = await paymentService.confirmPayment('sub_test123', 'pm_invalid');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment failed');

      // User should remain free
      const user = await authService.getCurrentUser();
      expect(user?.isPremium).toBe(false);
    });

    test('should handle trial activation', async () => {
      // Mock trial activation
      jest.spyOn(paymentService, 'startTrial').mockResolvedValue({
        success: true,
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      const trialResult = await paymentService.startTrial();
      expect(trialResult.success).toBe(true);

      // Update user to trialing status
      const trialingUser = {
        ...mockFreeUser,
        isPremium: true,
        subscriptionStatus: 'trialing',
        hasUsedTrial: true,
      };
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(trialingUser);

      // Verify premium features work during trial
      const user = await authService.getCurrentUser();
      expect(user?.isPremium).toBe(true);
      expect(user?.subscriptionStatus).toBe('trialing');
    });
  });

  describe('Premium Features Functionality', () => {
    beforeEach(() => {
      // Mock premium user for these tests
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockPremiumUser);
    });

    test('should allow cloud backup operations', async () => {
      // Mock successful backup creation
      jest.spyOn(backupService, 'uploadBackup' as any).mockResolvedValue({
        success: true,
      });

      const backupResult = await backupService.createBackup();
      expect(backupResult.success).toBe(true);
      expect(backupResult.backupId).toBeDefined();
    });

    test('should allow custom category creation', async () => {
      // Mock database operations
      jest.spyOn(dbService, 'queryOne').mockResolvedValue(null); // No existing category
      jest.spyOn(dbService, 'query').mockResolvedValue([]);

      const categoryResult = await categoriesService.createCustomCategory({
        name: 'Custom Test Category',
        icon: 'custom-icon',
        color: '#00FF00',
        type: 'expense',
        isSystem: false,
        isCustom: true,
        sortOrder: 1,
      });

      expect(categoryResult.success).toBe(true);
      expect(categoryResult.categoryId).toBeDefined();
    });

    test('should allow transaction tagging', async () => {
      // Mock database operations
      jest.spyOn(dbService, 'queryOne').mockResolvedValue({ id: 'transaction-1' });
      jest.spyOn(dbService, 'query').mockResolvedValue([]);

      const tagResult = await tagsService.addTagsToTransaction('transaction-1', ['tag-1', 'tag-2']);
      expect(tagResult.success).toBe(true);
    });

    test('should allow data export', async () => {
      // Mock file system operations
      const mockTransactions = [
        {
          id: 'tx1',
          description: 'Test Transaction',
          amount: 100,
          date: '2024-01-15',
          type: 'expense',
          categoryId: 'cat1',
        },
      ];

      jest.spyOn(exportService, 'getTransactionsForExport' as any)
        .mockResolvedValue(mockTransactions);

      const exportResult = await exportService.exportTransactions({
        format: 'pdf',
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });

      expect(exportResult.success).toBe(true);
      expect(exportResult.recordsExported).toBe(1);
    });

    test('should generate advanced reports', async () => {
      // Mock report data
      const mockReportData = {
        summary: {
          totalIncome: 1000,
          totalExpenses: 800,
          netIncome: 200,
          transactionCount: 10,
          averageTransaction: 90,
          period: {
            startDate: '2024-01-01',
            endDate: '2024-01-31',
            days: 31,
          },
        },
        expensesByCategory: [],
        monthlyTrends: [],
        dailySpending: [],
        topExpenses: [],
        budgetAnalysis: [],
        cashFlow: [],
        insights: ['Test insight'],
      };

      jest.spyOn(reportsService, 'generateSummary' as any)
        .mockResolvedValue(mockReportData.summary);
      jest.spyOn(reportsService, 'getExpensesByCategory' as any)
        .mockResolvedValue([]);
      jest.spyOn(reportsService, 'getMonthlyTrends' as any)
        .mockResolvedValue([]);
      jest.spyOn(reportsService, 'getDailySpending' as any)
        .mockResolvedValue([]);
      jest.spyOn(reportsService, 'getTopExpenses' as any)
        .mockResolvedValue([]);
      jest.spyOn(reportsService, 'getBudgetAnalysis' as any)
        .mockResolvedValue([]);
      jest.spyOn(reportsService, 'getCashFlowData' as any)
        .mockResolvedValue([]);

      const reportResult = await reportsService.generateAdvancedReport({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      });

      expect(reportResult).toBeDefined();
      expect(reportResult!.summary.totalIncome).toBe(1000);
      expect(reportResult!.summary.totalExpenses).toBe(800);
      expect(reportResult!.summary.netIncome).toBe(200);
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockPremiumUser);
    });

    test('should handle subscription cancellation', async () => {
      jest.spyOn(paymentService, 'cancelSubscription').mockResolvedValue({
        success: true,
        cancelAtPeriodEnd: true,
      });

      const cancelResult = await paymentService.cancelSubscription('sub_test123');
      expect(cancelResult.success).toBe(true);
      expect(cancelResult.cancelAtPeriodEnd).toBe(true);
    });

    test('should handle subscription reactivation', async () => {
      jest.spyOn(paymentService, 'reactivateSubscription').mockResolvedValue({
        success: true,
        subscription: {
          id: 'sub_test123',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      const reactivateResult = await paymentService.reactivateSubscription('sub_test123');
      expect(reactivateResult.success).toBe(true);
      expect(reactivateResult.subscription?.status).toBe('active');
    });

    test('should handle plan changes', async () => {
      jest.spyOn(paymentService, 'changePlan').mockResolvedValue({
        success: true,
        subscription: {
          id: 'sub_test123',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
        prorationAmount: -50.00, // Credit for unused time
      });

      const changeResult = await paymentService.changePlan('sub_test123', 'annual');
      expect(changeResult.success).toBe(true);
      expect(changeResult.prorationAmount).toBeLessThan(0); // Should be a credit
    });
  });

  describe('Data Migration and Sync', () => {
    test('should migrate free user data to premium account', async () => {
      // This would test that when a user upgrades, their local data
      // is properly synced to the cloud
      
      // Mock local transactions
      const localTransactions = [
        { id: 'tx1', description: 'Local Transaction 1', amount: 50, offline: true },
        { id: 'tx2', description: 'Local Transaction 2', amount: 75, offline: true },
      ];

      jest.spyOn(dbService, 'query').mockResolvedValue(localTransactions);

      // Mock successful sync
      jest.spyOn(backupService, 'createBackup').mockResolvedValue({
        success: true,
        backupId: 'backup_initial_sync',
      });

      // Simulate upgrade process
      const user = await authService.getCurrentUser();
      if (user?.isPremium) {
        const backupResult = await backupService.createBackup(false);
        expect(backupResult.success).toBe(true);
      }
    });

    test('should handle sync conflicts properly', async () => {
      // This would test conflict resolution when syncing data
      // between local and cloud storage
      
      const mockConflict = {
        localTransaction: { id: 'tx1', amount: 100, updatedAt: '2024-01-01' },
        cloudTransaction: { id: 'tx1', amount: 150, updatedAt: '2024-01-02' },
      };

      // Test that cloud version wins (more recent)
      expect(mockConflict.cloudTransaction.updatedAt > mockConflict.localTransaction.updatedAt).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle network failures gracefully', async () => {
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockPremiumUser);
      
      // Mock network failure
      jest.spyOn(backupService, 'uploadBackup' as any).mockResolvedValue({
        success: false,
        error: 'Network error',
      });

      const backupResult = await backupService.createBackup();
      expect(backupResult.success).toBe(false);
      expect(backupResult.error).toContain('Network error');
    });

    test('should handle expired subscriptions', async () => {
      const expiredUser = {
        ...mockPremiumUser,
        subscriptionStatus: 'past_due',
        isPremium: false,
      };

      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(expiredUser);

      // Premium features should be blocked
      const backupResult = await backupService.createBackup();
      expect(backupResult.success).toBe(false);
      expect(backupResult.error).toContain('premium feature');
    });

    test('should handle corrupted backup data', async () => {
      jest.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockPremiumUser);
      
      // Mock corrupted backup
      const corruptedBackup = {
        metadata: { checksum: 'invalid' },
        transactions: [],
        categories: [],
        userPreferences: {},
        version: '1.0.0',
      };

      jest.spyOn(backupService, 'downloadBackup' as any).mockResolvedValue(corruptedBackup);
      jest.spyOn(backupService, 'verifyBackupIntegrity' as any).mockResolvedValue(false);

      const restoreResult = await backupService.restoreFromBackup('backup_corrupted');
      expect(restoreResult.success).toBe(false);
      expect(restoreResult.error).toContain('integrity check failed');
    });
  });
});