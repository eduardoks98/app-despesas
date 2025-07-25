/**
 * Export Service - Premium feature for PDF/Excel/CSV export
 */

import { DatabaseService } from '../core/DatabaseService';
import { AuthenticationService } from '../core/AuthenticationService';
import { AnalyticsService } from '../core/AnalyticsService';
import { logger } from '../../../packages/shared/src/utils/logger';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  categories?: string[];
  transactionTypes?: ('income' | 'expense')[];
  includeTags?: boolean;
  includeNotes?: boolean;
  includeCharts?: boolean;
  groupBy?: 'date' | 'category' | 'type';
  sortBy?: 'date' | 'amount' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  recordsExported?: number;
  error?: string;
}

export interface ExportProgress {
  step: string;
  progress: number;
  total: number;
  message: string;
}

export class ExportService {
  private static instance: ExportService;
  private dbService: DatabaseService;
  private authService: AuthenticationService;
  private analyticsService: AnalyticsService;

  private constructor() {
    this.dbService = DatabaseService.getInstance();
    this.authService = AuthenticationService.getInstance();
    this.analyticsService = AnalyticsService.getInstance();
  }

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * Export transactions to specified format
   */
  async exportTransactions(
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<ExportResult> {
    try {
      const user = await this.authService.getCurrentUser();
      if (!user?.isPremium) {
        return { success: false, error: 'Data export is a premium feature' };
      }

      onProgress?.({
        step: 'preparing',
        progress: 0,
        total: 100,
        message: 'Preparando exportação...',
      });

      // Get transactions data
      const transactions = await this.getTransactionsForExport(options);
      
      onProgress?.({
        step: 'fetching',
        progress: 25,
        total: 100,
        message: `${transactions.length} transações encontradas`,
      });

      if (transactions.length === 0) {
        return { 
          success: false, 
          error: 'Nenhuma transação encontrada para os filtros selecionados' 
        };
      }

      // Get additional data if needed
      let categories: any[] = [];
      let tags: any[] = [];
      let notes: any[] = [];

      if (options.includeTags || options.includeNotes) {
        categories = await this.dbService.query('SELECT * FROM categories');
        
        if (options.includeTags) {
          tags = await this.dbService.query(`
            SELECT tt.transactionId, t.name as tagName, t.color as tagColor
            FROM transaction_tags tt
            INNER JOIN tags t ON tt.tagId = t.id
            WHERE tt.transactionId IN (${transactions.map(() => '?').join(',')})
          `, transactions.map(t => t.id));
        }

        if (options.includeNotes) {
          notes = await this.dbService.query(`
            SELECT transactionId, content
            FROM transaction_notes
            WHERE transactionId IN (${transactions.map(() => '?').join(',')})
          `, transactions.map(t => t.id));
        }
      }

      onProgress?.({
        step: 'processing',
        progress: 50,
        total: 100,
        message: 'Processando dados...',
      });

      // Process data based on format
      let result: ExportResult;

      switch (options.format) {
        case 'pdf':
          result = await this.exportToPDF(transactions, categories, tags, notes, options);
          break;
        case 'excel':
          result = await this.exportToExcel(transactions, categories, tags, notes, options);
          break;
        case 'csv':
          result = await this.exportToCSV(transactions, categories, tags, notes, options);
          break;
        default:
          return { success: false, error: 'Formato de exportação não suportado' };
      }

      onProgress?.({
        step: 'finalizing',
        progress: 100,
        total: 100,
        message: 'Exportação concluída!',
      });

      if (result.success) {
        // Track analytics
        await this.analyticsService.track('data_exported', {
          format: options.format,
          recordsExported: transactions.length,
          dateRange: options.dateRange,
          includeTags: options.includeTags,
          includeNotes: options.includeNotes,
          fileSize: result.fileSize,
        });

        logger.info('Data exported successfully', {
          format: options.format,
          recordsExported: transactions.length,
          filePath: result.filePath,
        });
      }

      return result;
    } catch (error) {
      logger.error('Export failed', { error, options });
      return { success: false, error: 'Falha na exportação dos dados' };
    }
  }

  /**
   * Export to PDF format
   */
  private async exportToPDF(
    transactions: any[],
    categories: any[],
    tags: any[],
    notes: any[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const fileName = `transacoes_${this.formatDate(new Date())}.pdf`;
      const categoriesMap = new Map(categories.map(c => [c.id, c]));
      const tagsMap = new Map();
      const notesMap = new Map();

      // Group tags and notes by transaction
      tags.forEach(tag => {
        if (!tagsMap.has(tag.transactionId)) {
          tagsMap.set(tag.transactionId, []);
        }
        tagsMap.get(tag.transactionId).push(tag);
      });

      notes.forEach(note => {
        if (!notesMap.has(note.transactionId)) {
          notesMap.set(note.transactionId, []);
        }
        notesMap.get(note.transactionId).push(note);
      });

      // Calculate summary
      const summary = this.calculateSummary(transactions);

      // Generate HTML for PDF
      const html = this.generatePDFHTML(
        transactions,
        categoriesMap,
        tagsMap,
        notesMap,
        summary,
        options
      );

      // Create PDF
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      // Move to a permanent location
      const documentsDir = FileSystem.documentDirectory + 'exports/';
      await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      
      const finalPath = documentsDir + fileName;
      await FileSystem.moveAsync({
        from: uri,
        to: finalPath,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(finalPath);

      return {
        success: true,
        filePath: finalPath,
        fileName,
        fileSize: fileInfo.size,
        recordsExported: transactions.length,
      };
    } catch (error) {
      logger.error('PDF export failed', { error });
      return { success: false, error: 'Falha na geração do PDF' };
    }
  }

  /**
   * Export to Excel format (CSV-based for compatibility)
   */
  private async exportToExcel(
    transactions: any[],
    categories: any[],
    tags: any[],
    notes: any[],
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const fileName = `transacoes_${this.formatDate(new Date())}.csv`;
      const categoriesMap = new Map(categories.map(c => [c.id, c]));
      const tagsMap = new Map();
      const notesMap = new Map();

      // Group tags and notes by transaction
      tags.forEach(tag => {
        if (!tagsMap.has(tag.transactionId)) {
          tagsMap.set(tag.transactionId, []);
        }
        tagsMap.get(tag.transactionId).push(tag.tagName);
      });

      notes.forEach(note => {
        if (!notesMap.has(note.transactionId)) {
          notesMap.set(note.transactionId, []);
        }
        notesMap.get(note.transactionId).push(note.content);
      });

      // Build CSV content
      let csvContent = this.buildCSVHeaders(options);

      for (const transaction of transactions) {
        const category = categoriesMap.get(transaction.categoryId);
        const transactionTags = tagsMap.get(transaction.id) || [];
        const transactionNotes = notesMap.get(transaction.id) || [];

        const row = [
          this.formatDate(new Date(transaction.date)),
          this.escapeCSV(transaction.description),
          transaction.amount.toFixed(2).replace('.', ','),
          transaction.type === 'income' ? 'Receita' : 'Despesa',
          category ? this.escapeCSV(category.name) : '',
        ];

        if (options.includeTags) {
          row.push(this.escapeCSV(transactionTags.join('; ')));
        }

        if (options.includeNotes) {
          row.push(this.escapeCSV(transactionNotes.join('; ')));
        }

        csvContent += row.join(',') + '\n';
      }

      // Save file
      const documentsDir = FileSystem.documentDirectory + 'exports/';
      await FileSystem.makeDirectoryAsync(documentsDir, { intermediates: true });
      
      const filePath = documentsDir + fileName;
      await FileSystem.writeAsStringAsync(filePath, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      return {
        success: true,
        filePath,
        fileName,
        fileSize: fileInfo.size,
        recordsExported: transactions.length,
      };
    } catch (error) {
      logger.error('Excel export failed', { error });
      return { success: false, error: 'Falha na geração do Excel' };
    }
  }

  /**
   * Export to CSV format
   */
  private async exportToCSV(
    transactions: any[],
    categories: any[],
    tags: any[],
    notes: any[],
    options: ExportOptions
  ): Promise<ExportResult> {
    // CSV export is the same as Excel for now
    return this.exportToExcel(transactions, categories, tags, notes, options);
  }

  /**
   * Share exported file
   */
  async shareExportedFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        return { success: false, error: 'Compartilhamento não disponível neste dispositivo' };
      }

      await Sharing.shareAsync(filePath, {
        mimeType: this.getMimeType(filePath),
        dialogTitle: 'Compartilhar Exportação',
      });

      // Track analytics
      await this.analyticsService.track('export_shared', {
        filePath: filePath.split('/').pop(),
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to share exported file', { filePath, error });
      return { success: false, error: 'Falha ao compartilhar arquivo' };
    }
  }

  /**
   * Get list of exported files
   */
  async getExportedFiles(): Promise<Array<{
    fileName: string;
    filePath: string;
    size: number;
    createdAt: string;
    format: string;
  }>> {
    try {
      const exportsDir = FileSystem.documentDirectory + 'exports/';
      const dirInfo = await FileSystem.getInfoAsync(exportsDir);
      
      if (!dirInfo.exists) {
        return [];
      }

      const files = await FileSystem.readDirectoryAsync(exportsDir);
      const fileDetails = [];

      for (const fileName of files) {
        const filePath = exportsDir + fileName;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        
        if (fileInfo.exists && !fileInfo.isDirectory) {
          fileDetails.push({
            fileName,
            filePath,
            size: fileInfo.size || 0,
            createdAt: new Date(fileInfo.modificationTime || 0).toISOString(),
            format: fileName.split('.').pop()?.toLowerCase() || 'unknown',
          });
        }
      }

      return fileDetails.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      logger.error('Failed to get exported files', { error });
      return [];
    }
  }

  /**
   * Delete exported file
   */
  async deleteExportedFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      await FileSystem.deleteAsync(filePath);
      
      // Track analytics
      await this.analyticsService.track('export_deleted', {
        fileName: filePath.split('/').pop(),
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete exported file', { filePath, error });
      return { success: false, error: 'Falha ao deletar arquivo' };
    }
  }

  /**
   * Private helper methods
   */
  private async getTransactionsForExport(options: ExportOptions): Promise<any[]> {
    let whereClause = 'date BETWEEN ? AND ?';
    let params = [options.dateRange.startDate, options.dateRange.endDate];

    if (options.categories && options.categories.length > 0) {
      whereClause += ` AND categoryId IN (${options.categories.map(() => '?').join(',')})`;
      params.push(...options.categories);
    }

    if (options.transactionTypes && options.transactionTypes.length > 0) {
      whereClause += ` AND type IN (${options.transactionTypes.map(() => '?').join(',')})`;
      params.push(...options.transactionTypes);
    }

    let orderClause = 'ORDER BY ';
    switch (options.sortBy) {
      case 'amount':
        orderClause += 'amount';
        break;
      case 'category':
        orderClause += 'categoryId';
        break;
      default:
        orderClause += 'date';
    }
    orderClause += ` ${options.sortOrder === 'asc' ? 'ASC' : 'DESC'}`;

    return this.dbService.query(
      `SELECT * FROM transactions WHERE ${whereClause} ${orderClause}`,
      params
    );
  }

  private calculateSummary(transactions: any[]) {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
      incomeCount: transactions.filter(t => t.type === 'income').length,
      expenseCount: transactions.filter(t => t.type === 'expense').length,
    };
  }

  private generatePDFHTML(
    transactions: any[],
    categoriesMap: Map<string, any>,
    tagsMap: Map<string, any>,
    notesMap: Map<string, any>,
    summary: any,
    options: ExportOptions
  ): string {
    const dateRange = `${this.formatDate(new Date(options.dateRange.startDate))} a ${this.formatDate(new Date(options.dateRange.endDate))}`;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Transações</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 30px; }
          .summary h3 { margin-top: 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .income { color: #10B981; }
          .expense { color: #EF4444; }
          .tags { font-size: 12px; color: #666; }
          .notes { font-size: 12px; color: #666; font-style: italic; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Transações</h1>
          <p>Período: ${dateRange}</p>
          <p>Gerado em: ${this.formatDate(new Date())}</p>
        </div>

        <div class="summary">
          <h3>Resumo</h3>
          <p><strong>Total de Transações:</strong> ${summary.transactionCount}</p>
          <p><strong>Receitas:</strong> <span class="income">R$ ${summary.totalIncome.toFixed(2).replace('.', ',')}</span> (${summary.incomeCount} transações)</p>
          <p><strong>Despesas:</strong> <span class="expense">R$ ${summary.totalExpenses.toFixed(2).replace('.', ',')}</span> (${summary.expenseCount} transações)</p>
          <p><strong>Saldo:</strong> <span class="${summary.netIncome >= 0 ? 'income' : 'expense'}">R$ ${summary.netIncome.toFixed(2).replace('.', ',')}</span></p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Tipo</th>
              <th>Categoria</th>
              ${options.includeTags ? '<th>Tags</th>' : ''}
              ${options.includeNotes ? '<th>Notas</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${transactions.map(transaction => {
              const category = categoriesMap.get(transaction.categoryId);
              const transactionTags = tagsMap.get(transaction.id) || [];
              const transactionNotes = notesMap.get(transaction.id) || [];
              
              return `
                <tr>
                  <td>${this.formatDate(new Date(transaction.date))}</td>
                  <td>${transaction.description}</td>
                  <td class="${transaction.type}">R$ ${transaction.amount.toFixed(2).replace('.', ',')}</td>
                  <td>${transaction.type === 'income' ? 'Receita' : 'Despesa'}</td>
                  <td>${category ? category.name : ''}</td>
                  ${options.includeTags ? `<td class="tags">${transactionTags.map((t: any) => t.tagName).join(', ')}</td>` : ''}
                  ${options.includeNotes ? `<td class="notes">${transactionNotes.map((n: any) => n.content).join('; ')}</td>` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  private buildCSVHeaders(options: ExportOptions): string {
    const headers = ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria'];
    
    if (options.includeTags) {
      headers.push('Tags');
    }
    
    if (options.includeNotes) {
      headers.push('Notas');
    }
    
    return headers.join(',') + '\n';
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR');
  }

  private getMimeType(filePath: string): string {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'csv':
        return 'text/csv';
      case 'xlsx':
      case 'xls':
        return 'application/vnd.ms-excel';
      default:
        return 'application/octet-stream';
    }
  }
}