/**
 * Performance Tests for Premium Features
 */

import { DatabaseService } from '../../services/core/DatabaseService';
import { AdvancedReportsService } from '../../services/premium/AdvancedReportsService';
import { ExportService } from '../../services/premium/ExportService';
import { CloudBackupService } from '../../services/premium/CloudBackupService';
import { CustomCategoriesService } from '../../services/premium/CustomCategoriesService';
import { TransactionTagsService } from '../../services/premium/TransactionTagsService';

// Performance monitoring utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private measurements: Map<string, number[]> = new Map();

  start(): void {
    this.startTime = performance.now();
  }

  end(label: string): number {
    const duration = performance.now() - this.startTime;
    if (!this.measurements.has(label)) {
      this.measurements.set(label, []);
    }
    this.measurements.get(label)!.push(duration);
    return duration;
  }

  getStats(label: string) {
    const measurements = this.measurements.get(label) || [];
    if (measurements.length === 0) return null;

    const sorted = [...measurements].sort((a, b) => a - b);
    const sum = measurements.reduce((a, b) => a + b, 0);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: measurements.length,
    };
  }

  reset(): void {
    this.measurements.clear();
  }
}

describe('Performance Tests', () => {
  let dbService: DatabaseService;
  let reportsService: AdvancedReportsService;
  let exportService: ExportService;
  let backupService: CloudBackupService;
  let categoriesService: CustomCategoriesService;
  let tagsService: TransactionTagsService;
  let perfMonitor: PerformanceMonitor;

  // Test data generators
  const generateTransactions = (count: number) => {
    const transactions = [];
    const categories = ['cat_1', 'cat_2', 'cat_3', 'cat_4', 'cat_5'];
    const types = ['income', 'expense'];
    
    for (let i = 0; i < count; i++) {
      transactions.push({
        id: `tx_${i}`,
        amount: Math.random() * 1000,
        description: `Transaction ${i}`,
        date: new Date(2024, 0, 1 + (i % 365)).toISOString().split('T')[0],
        categoryId: categories[i % categories.length],
        type: types[i % types.length],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return transactions;
  };

  const generateCategories = (count: number) => {
    const categories = [];
    for (let i = 0; i < count; i++) {
      categories.push({
        id: `cat_${i}`,
        name: `Category ${i}`,
        icon: 'icon-name',
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        type: 'both',
        isSystem: false,
        isCustom: true,
        sortOrder: i,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    return categories;
  };

  beforeEach(async () => {
    dbService = DatabaseService.getInstance();
    reportsService = AdvancedReportsService.getInstance();
    exportService = ExportService.getInstance();
    backupService = CloudBackupService.getInstance();
    categoriesService = CustomCategoriesService.getInstance();
    tagsService = TransactionTagsService.getInstance();
    perfMonitor = new PerformanceMonitor();

    await dbService.initialize();
    
    // Mock premium user
    const mockAuth = {
      getCurrentUser: jest.fn().mockResolvedValue({
        id: 'test-user',
        isPremium: true,
        subscriptionStatus: 'active',
      }),
      getAccessToken: jest.fn().mockResolvedValue('mock-token'),
    };
    
    (reportsService as any).authService = mockAuth;
    (exportService as any).authService = mockAuth;
    (backupService as any).authService = mockAuth;
    (categoriesService as any).authService = mockAuth;
    (tagsService as any).authService = mockAuth;
  });

  afterEach(async () => {
    await dbService.close();
    perfMonitor.reset();
  });

  describe('Database Performance', () => {
    test('should handle large transaction inserts efficiently', async () => {
      const testSizes = [100, 500, 1000, 5000];
      const results: any[] = [];

      for (const size of testSizes) {
        const transactions = generateTransactions(size);
        
        perfMonitor.start();
        
        // Batch insert
        await dbService.beginTransaction();
        for (const tx of transactions) {
          await dbService.query(
            `INSERT INTO transactions (id, amount, description, date, categoryId, type, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [tx.id, tx.amount, tx.description, tx.date, tx.categoryId, tx.type, tx.createdAt, tx.updatedAt]
          );
        }
        await dbService.commitTransaction();
        
        const duration = perfMonitor.end(`insert_${size}`);
        const opsPerSecond = (size / duration) * 1000;
        
        results.push({
          size,
          duration,
          opsPerSecond,
        });
      }

      // Assert performance thresholds
      results.forEach(result => {
        console.log(`Insert ${result.size} transactions: ${result.duration.toFixed(2)}ms (${result.opsPerSecond.toFixed(0)} ops/sec)`);
        
        // Should maintain at least 1000 inserts per second
        expect(result.opsPerSecond).toBeGreaterThan(1000);
      });
    });

    test('should query transactions with filters efficiently', async () => {
      // Setup test data
      const transactions = generateTransactions(10000);
      jest.spyOn(dbService, 'query').mockImplementation(async (sql, params) => {
        // Simulate filtered results
        return transactions.slice(0, 100);
      });

      const queries = [
        {
          name: 'date_range',
          sql: 'SELECT * FROM transactions WHERE date BETWEEN ? AND ?',
          params: ['2024-01-01', '2024-01-31'],
        },
        {
          name: 'category_filter',
          sql: 'SELECT * FROM transactions WHERE categoryId = ?',
          params: ['cat_1'],
        },
        {
          name: 'complex_filter',
          sql: `SELECT * FROM transactions 
                WHERE date BETWEEN ? AND ? 
                AND categoryId IN (?, ?, ?) 
                AND type = ?
                ORDER BY date DESC`,
          params: ['2024-01-01', '2024-01-31', 'cat_1', 'cat_2', 'cat_3', 'expense'],
        },
      ];

      for (const query of queries) {
        perfMonitor.start();
        await dbService.query(query.sql, query.params);
        const duration = perfMonitor.end(query.name);
        
        console.log(`Query ${query.name}: ${duration.toFixed(2)}ms`);
        
        // Queries should complete within 50ms
        expect(duration).toBeLessThan(50);
      }
    });

    test('should handle concurrent operations efficiently', async () => {
      const operations = [];
      const operationCount = 100;
      
      perfMonitor.start();
      
      // Simulate concurrent operations
      for (let i = 0; i < operationCount; i++) {
        operations.push(
          dbService.query('SELECT COUNT(*) as count FROM transactions'),
          dbService.query('SELECT * FROM categories'),
          dbService.query('SELECT * FROM transactions WHERE id = ?', [`tx_${i}`])
        );
      }
      
      await Promise.all(operations);
      const duration = perfMonitor.end('concurrent_operations');
      
      console.log(`${operations.length} concurrent operations: ${duration.toFixed(2)}ms`);
      
      // Should handle 300 concurrent operations within 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Report Generation Performance', () => {
    test('should generate reports for large datasets efficiently', async () => {
      const testCases = [
        { transactions: 1000, expectedTime: 500 },
        { transactions: 5000, expectedTime: 2000 },
        { transactions: 10000, expectedTime: 5000 },
      ];

      for (const testCase of testCases) {
        // Mock large dataset
        const transactions = generateTransactions(testCase.transactions);
        jest.spyOn(dbService, 'query').mockImplementation(async () => {
          return transactions.slice(0, Math.min(100, transactions.length));
        });
        jest.spyOn(dbService, 'queryOne').mockResolvedValue({
          totalIncome: 50000,
          totalExpenses: 45000,
          transactionCount: testCase.transactions,
          averageTransaction: 100,
        });

        perfMonitor.start();
        
        const report = await reportsService.generateAdvancedReport({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });
        
        const duration = perfMonitor.end(`report_${testCase.transactions}`);
        
        console.log(`Generate report for ${testCase.transactions} transactions: ${duration.toFixed(2)}ms`);
        
        expect(report).toBeDefined();
        expect(duration).toBeLessThan(testCase.expectedTime);
      }
    });

    test('should calculate category statistics efficiently', async () => {
      const categories = generateCategories(50);
      const transactionsPerCategory = 200;
      
      // Mock data
      jest.spyOn(dbService, 'query').mockImplementation(async (sql) => {
        if (sql.includes('GROUP BY c.id')) {
          return categories.map(cat => ({
            categoryId: cat.id,
            categoryName: cat.name,
            categoryIcon: cat.icon,
            categoryColor: cat.color,
            totalAmount: Math.random() * 10000,
            transactionCount: transactionsPerCategory,
          }));
        }
        return [];
      });

      perfMonitor.start();
      
      const categoryStats = await reportsService.getExpensesByCategory({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      
      const duration = perfMonitor.end('category_stats');
      
      console.log(`Calculate stats for ${categories.length} categories: ${duration.toFixed(2)}ms`);
      
      expect(categoryStats).toHaveLength(categories.length);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Export Performance', () => {
    test('should export large datasets to PDF efficiently', async () => {
      const testSizes = [100, 500, 1000];
      
      for (const size of testSizes) {
        const transactions = generateTransactions(size);
        
        // Mock data retrieval
        jest.spyOn(exportService as any, 'getTransactionsForExport')
          .mockResolvedValue(transactions);
        
        // Mock file operations
        jest.spyOn(exportService as any, 'generatePDFHTML')
          .mockReturnValue('<html>Test PDF</html>');
        
        const mockPrint = {
          printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file://test.pdf' }),
        };
        jest.doMock('expo-print', () => mockPrint);
        
        const mockFileSystem = {
          documentDirectory: 'file://docs/',
          makeDirectoryAsync: jest.fn(),
          moveAsync: jest.fn(),
          getInfoAsync: jest.fn().mockResolvedValue({ size: 1024 * 10 }),
        };
        jest.doMock('expo-file-system', () => mockFileSystem);

        perfMonitor.start();
        
        const result = await exportService.exportTransactions({
          format: 'pdf',
          dateRange: {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
          },
        });
        
        const duration = perfMonitor.end(`export_pdf_${size}`);
        
        console.log(`Export ${size} transactions to PDF: ${duration.toFixed(2)}ms`);
        
        expect(result.success).toBe(true);
        // PDF generation should be under 3 seconds for 1000 transactions
        expect(duration).toBeLessThan(size * 3);
      }
    });

    test('should export to CSV with minimal memory usage', async () => {
      const largeDataset = generateTransactions(10000);
      
      // Mock streaming approach
      jest.spyOn(exportService as any, 'getTransactionsForExport')
        .mockResolvedValue(largeDataset);
      
      const mockFileSystem = {
        documentDirectory: 'file://docs/',
        makeDirectoryAsync: jest.fn(),
        writeAsStringAsync: jest.fn(),
        getInfoAsync: jest.fn().mockResolvedValue({ size: 1024 * 100 }),
      };
      jest.doMock('expo-file-system', () => mockFileSystem);

      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
      
      perfMonitor.start();
      
      const result = await exportService.exportTransactions({
        format: 'csv',
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      });
      
      const duration = perfMonitor.end('export_csv_large');
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = memoryAfter - memoryBefore;
      
      console.log(`Export 10000 transactions to CSV: ${duration.toFixed(2)}ms`);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(2000); // Under 2 seconds
    });
  });

  describe('Backup Performance', () => {
    test('should create backups with compression efficiently', async () => {
      const datasetSizes = [
        { transactions: 1000, categories: 20 },
        { transactions: 5000, categories: 50 },
        { transactions: 10000, categories: 100 },
      ];

      for (const dataset of datasetSizes) {
        // Mock data
        jest.spyOn(dbService, 'query').mockImplementation(async (sql) => {
          if (sql.includes('FROM transactions')) {
            return generateTransactions(dataset.transactions);
          }
          if (sql.includes('FROM categories')) {
            return generateCategories(dataset.categories);
          }
          return [];
        });

        // Mock upload
        jest.spyOn(backupService as any, 'uploadBackup')
          .mockResolvedValue({ success: true });

        perfMonitor.start();
        
        const result = await backupService.createBackup();
        
        const duration = perfMonitor.end(`backup_${dataset.transactions}`);
        
        console.log(`Create backup with ${dataset.transactions} transactions: ${duration.toFixed(2)}ms`);
        
        expect(result.success).toBe(true);
        // Backup should complete within reasonable time
        expect(duration).toBeLessThan(dataset.transactions * 0.5);
      }
    });

    test('should restore backups efficiently', async () => {
      const backupSizes = [1000, 5000, 10000];
      
      for (const size of backupSizes) {
        const backupData = {
          metadata: {
            id: 'backup_test',
            checksum: 'test_checksum',
            transactionCount: size,
            categoryCount: 50,
          },
          transactions: generateTransactions(size),
          categories: generateCategories(50),
          userPreferences: {},
          version: '1.0.0',
        };

        // Mock download and verification
        jest.spyOn(backupService as any, 'downloadBackup')
          .mockResolvedValue(backupData);
        jest.spyOn(backupService as any, 'verifyBackupIntegrity')
          .mockResolvedValue(true);
        jest.spyOn(backupService as any, 'createLocalBackupBeforeRestore')
          .mockResolvedValue(true);

        // Mock database operations
        jest.spyOn(dbService, 'beginTransaction').mockResolvedValue();
        jest.spyOn(dbService, 'query').mockResolvedValue([]);
        jest.spyOn(dbService, 'commitTransaction').mockResolvedValue();

        perfMonitor.start();
        
        const result = await backupService.restoreFromBackup('backup_test');
        
        const duration = perfMonitor.end(`restore_${size}`);
        
        console.log(`Restore backup with ${size} transactions: ${duration.toFixed(2)}ms`);
        
        expect(result.success).toBe(true);
        // Restore should be efficient
        expect(duration).toBeLessThan(size * 0.8);
      }
    });
  });

  describe('Memory Management', () => {
    test('should handle memory efficiently during large operations', async () => {
      const operations = [
        {
          name: 'large_report',
          fn: async () => {
            jest.spyOn(dbService, 'query').mockResolvedValue(generateTransactions(5000));
            return reportsService.generateAdvancedReport({
              startDate: '2024-01-01',
              endDate: '2024-12-31',
            });
          },
        },
        {
          name: 'bulk_category_creation',
          fn: async () => {
            const results = [];
            for (let i = 0; i < 100; i++) {
              results.push(categoriesService.createCustomCategory({
                name: `Category ${i}`,
                icon: 'icon',
                color: '#000000',
                type: 'expense',
                isSystem: false,
                isCustom: true,
                sortOrder: i,
              }));
            }
            return Promise.all(results);
          },
        },
      ];

      for (const operation of operations) {
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
        
        perfMonitor.start();
        await operation.fn();
        const duration = perfMonitor.end(operation.name);
        
        const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
        const memoryIncrease = (memoryAfter - memoryBefore) / 1024 / 1024;
        
        console.log(`${operation.name}: ${duration.toFixed(2)}ms, Memory: +${memoryIncrease.toFixed(2)}MB`);
        
        // Memory increase should be reasonable
        expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
      }
    });
  });

  describe('UI Responsiveness', () => {
    test('should maintain UI responsiveness during heavy operations', async () => {
      const heavyOperations = [
        async () => reportsService.generateAdvancedReport({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        }),
        async () => backupService.createBackup(),
        async () => exportService.exportTransactions({
          format: 'pdf',
          dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
        }),
      ];

      // Simulate UI thread checks
      const uiThreadChecks: number[] = [];
      const checkInterval = setInterval(() => {
        const checkStart = performance.now();
        // Simulate UI operation
        setTimeout(() => {
          const checkDuration = performance.now() - checkStart;
          uiThreadChecks.push(checkDuration);
        }, 0);
      }, 16); // 60 FPS = ~16ms per frame

      // Run heavy operations
      await Promise.all(heavyOperations);
      
      clearInterval(checkInterval);
      
      // Analyze UI thread responsiveness
      const blockedFrames = uiThreadChecks.filter(duration => duration > 16.67);
      const blockingPercentage = (blockedFrames.length / uiThreadChecks.length) * 100;
      
      console.log(`UI thread blocking: ${blockingPercentage.toFixed(2)}% of frames`);
      
      // Should maintain 90% smooth frames (allowing 10% frame drops)
      expect(blockingPercentage).toBeLessThan(10);
    });
  });
});