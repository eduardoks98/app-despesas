import { Share } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Transaction, Installment } from '../../types';
import { StorageService } from '../core';

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  dateRange?: {
    start: Date;
    end: Date;
  };
  includeTransactions?: boolean;
  includeInstallments?: boolean;
  includeReports?: boolean;
}

export class ExportService {
  /**
   * Export data in the specified format
   */
  static async exportData(options: ExportOptions): Promise<boolean> {
    try {
      const data = await this.prepareExportData(options);
      
      switch (options.format) {
        case 'csv':
          return await this.exportCSV(data, options);
        case 'pdf':
          return await this.exportPDF(data, options);
        case 'json':
          return await this.exportJSON(data, options);
        default:
          throw new Error('Formato de exportação não suportado');
      }
    } catch (error) {
      console.error('Export error:', error);
      return false;
    }
  }

  /**
   * Prepare data for export based on options
   */
  private static async prepareExportData(options: ExportOptions) {
    const [transactions, installments] = await Promise.all([
      StorageService.getTransactions(),
      StorageService.getInstallments()
    ]);

    // Filter by date range if specified
    let filteredTransactions = transactions;
    let filteredInstallments = installments;

    if (options.dateRange) {
      const { start, end } = options.dateRange;
      
      filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= start && date <= end;
      });

      filteredInstallments = installments.filter(i => {
        const startDate = new Date(i.startDate);
        const endDate = new Date(i.endDate);
        return (startDate >= start && startDate <= end) || 
               (endDate >= start && endDate <= end) ||
               (startDate <= start && endDate >= end);
      });
    }

    // Generate summary reports
    const summary = this.generateSummary(filteredTransactions, filteredInstallments);

    return {
      transactions: options.includeTransactions !== false ? filteredTransactions : [],
      installments: options.includeInstallments !== false ? filteredInstallments : [],
      summary: options.includeReports !== false ? summary : null,
      exportDate: new Date(),
      dateRange: options.dateRange
    };
  }

  /**
   * Generate summary statistics
   */
  private static generateSummary(transactions: Transaction[], installments: Installment[]) {
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const activeInstallments = installments.filter(i => i.status === 'active');
    const monthlyInstallmentValue = activeInstallments
      .reduce((sum, i) => sum + i.installmentValue, 0);

    const categoryBreakdown = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      totalInstallments: installments.length,
      activeInstallments: activeInstallments.length,
      monthlyInstallmentValue,
      categoryBreakdown
    };
  }

  /**
   * Export data as CSV
   */
  private static async exportCSV(data: any, options: ExportOptions): Promise<boolean> {
    try {
      let csvContent = '';
      
      // Add summary if included
      if (data.summary) {
        csvContent += 'RESUMO FINANCEIRO\n';
        csvContent += `Data da Exportação,${data.exportDate.toLocaleDateString('pt-BR')}\n`;
        if (data.dateRange) {
          csvContent += `Período,${data.dateRange.start.toLocaleDateString('pt-BR')} até ${data.dateRange.end.toLocaleDateString('pt-BR')}\n`;
        }
        csvContent += `Total de Transações,${data.summary.totalTransactions}\n`;
        csvContent += `Total de Receitas,R$ ${data.summary.totalIncome.toFixed(2)}\n`;
        csvContent += `Total de Despesas,R$ ${data.summary.totalExpenses.toFixed(2)}\n`;
        csvContent += `Saldo,R$ ${data.summary.balance.toFixed(2)}\n`;
        csvContent += `Parcelamentos Ativos,${data.summary.activeInstallments}\n`;
        csvContent += `Valor Mensal de Parcelamentos,R$ ${data.summary.monthlyInstallmentValue.toFixed(2)}\n\n`;
      }

      // Add transactions
      if (data.transactions.length > 0) {
        csvContent += 'TRANSAÇÕES\n';
        csvContent += 'Data,Tipo,Descrição,Categoria,Valor,Método de Pagamento,Parcela\n';
        
        data.transactions.forEach((t: Transaction) => {
          const date = new Date(t.date).toLocaleDateString('pt-BR');
          const type = t.type === 'income' ? 'Receita' : 'Despesa';
          const amount = t.type === 'income' ? t.amount : -t.amount;
          const installmentInfo = t.installmentNumber ? `${t.installmentNumber}ª parcela` : '';
          
          csvContent += `${date},${type},"${t.description}","${t.category}",R$ ${amount.toFixed(2)},${t.paymentMethod || ''},${installmentInfo}\n`;
        });
        csvContent += '\n';
      }

      // Add installments
      if (data.installments.length > 0) {
        csvContent += 'PARCELAMENTOS\n';
        csvContent += 'Descrição,Loja,Categoria,Valor Total,Parcelas,Valor da Parcela,Data Início,Data Fim,Status,Parcelas Pagas\n';
        
        data.installments.forEach((i: Installment) => {
          const startDate = new Date(i.startDate).toLocaleDateString('pt-BR');
          const endDate = new Date(i.endDate).toLocaleDateString('pt-BR');
          const status = i.status === 'active' ? 'Ativo' : 'Concluído';
          
          csvContent += `"${i.description}","${i.store}","${i.category}",R$ ${i.totalAmount.toFixed(2)},${i.totalInstallments},R$ ${i.installmentValue.toFixed(2)},${startDate},${endDate},${status},${i.paidInstallments.length}\n`;
        });
      }

      // Save and share file
      const fileName = `despesas-${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar dados CSV'
        });
      } else {
        await Share.share({
          message: csvContent,
          title: 'Dados Financeiros CSV'
        });
      }

      return true;
    } catch (error) {
      console.error('CSV export error:', error);
      return false;
    }
  }

  /**
   * Export data as PDF
   */
  private static async exportPDF(data: any, options: ExportOptions): Promise<boolean> {
    try {
      const html = this.generatePDFHTML(data);
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exportar relatório PDF'
        });
      }

      return true;
    } catch (error) {
      console.error('PDF export error:', error);
      return false;
    }
  }

  /**
   * Generate HTML for PDF export
   */
  private static generatePDFHTML(data: any): string {
    const formatCurrency = (value: number) => 
      `R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;

    const formatDate = (date: string | Date) => 
      new Date(date).toLocaleDateString('pt-BR');

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Financeiro</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #6B46C1; padding-bottom: 10px; }
          .header h1 { color: #6B46C1; margin: 0; }
          .header p { margin: 5px 0; color: #666; }
          .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .summary h2 { color: #6B46C1; margin-top: 0; }
          .summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .summary-item { padding: 10px; background: white; border-radius: 4px; }
          .summary-label { font-size: 12px; color: #666; margin-bottom: 4px; }
          .summary-value { font-size: 18px; font-weight: bold; }
          .income { color: #10B981; }
          .expense { color: #EF4444; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #6B46C1; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .text-right { text-align: right; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>App Despesas - Relatório Financeiro</h1>
          <p>Gerado em ${formatDate(data.exportDate)}</p>
          ${data.dateRange ? `<p>Período: ${formatDate(data.dateRange.start)} até ${formatDate(data.dateRange.end)}</p>` : ''}
        </div>
    `;

    // Add summary
    if (data.summary) {
      html += `
        <div class="summary">
          <h2>Resumo Financeiro</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-label">Total de Receitas</div>
              <div class="summary-value income">${formatCurrency(data.summary.totalIncome)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Total de Despesas</div>
              <div class="summary-value expense">${formatCurrency(data.summary.totalExpenses)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Saldo</div>
              <div class="summary-value ${data.summary.balance >= 0 ? 'income' : 'expense'}">${formatCurrency(data.summary.balance)}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Parcelamentos Ativos</div>
              <div class="summary-value">${data.summary.activeInstallments}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Add transactions table
    if (data.transactions.length > 0) {
      html += `
        <div class="section">
          <h2>Transações (${data.transactions.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Tipo</th>
                <th class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
      `;

      data.transactions.forEach((t: Transaction) => {
        const isIncome = t.type === 'income';
        const value = isIncome ? t.amount : -t.amount;
        html += `
          <tr>
            <td>${formatDate(t.date)}</td>
            <td>${t.description}</td>
            <td>${t.category}</td>
            <td>${isIncome ? 'Receita' : 'Despesa'}</td>
            <td class="text-right ${isIncome ? 'income' : 'expense'}">${formatCurrency(value)}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    // Add installments table
    if (data.installments.length > 0) {
      html += `
        <div class="section">
          <h2>Parcelamentos (${data.installments.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Loja</th>
                <th>Categoria</th>
                <th class="text-right">Valor Total</th>
                <th class="text-right">Parcelas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
      `;

      data.installments.forEach((i: Installment) => {
        const status = i.status === 'active' ? 'Ativo' : 'Concluído';
        html += `
          <tr>
            <td>${i.description}</td>
            <td>${i.store}</td>
            <td>${i.category}</td>
            <td class="text-right">${formatCurrency(i.totalAmount)}</td>
            <td class="text-right">${i.paidInstallments.length}/${i.totalInstallments}</td>
            <td>${status}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    html += `
        <div class="footer">
          <p>Relatório gerado pelo App Despesas em ${formatDate(data.exportDate)}</p>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Export data as JSON
   */
  private static async exportJSON(data: any, options: ExportOptions): Promise<boolean> {
    try {
      const jsonData = {
        exportInfo: {
          format: 'json',
          exportDate: data.exportDate,
          dateRange: data.dateRange,
          appVersion: '1.0.0'
        },
        summary: data.summary,
        transactions: data.transactions,
        installments: data.installments
      };

      const jsonString = JSON.stringify(jsonData, null, 2);
      
      await Share.share({
        message: jsonString,
        title: 'Backup Completo - App Despesas'
      });

      return true;
    } catch (error) {
      console.error('JSON export error:', error);
      return false;
    }
  }
}