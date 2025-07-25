'use client';

import { useState, useMemo } from 'react';
import { 
  CalendarIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  FunnelIcon,
  PrinterIcon,
  ShareIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, Input } from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { IncomeExpenseChart, CategoryDistributionChart, TrendChart } from '@/components/charts';

interface ReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  categoriesBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  insights: Array<{
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
    value?: string;
  }>;
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Mock data - this would come from your API
  const reportData: ReportData = {
    period: 'Janeiro 2024',
    totalIncome: 5300.00,
    totalExpenses: 3462.25,
    balance: 1837.75,
    transactionCount: 47,
    categoriesBreakdown: [
      { category: 'Alimentação', amount: 1250.30, percentage: 36.1, color: '#10B981' },
      { category: 'Transporte', amount: 650.80, percentage: 18.8, color: '#3B82F6' },
      { category: 'Saúde', amount: 380.20, percentage: 11.0, color: '#EF4444' },
      { category: 'Lazer', amount: 420.90, percentage: 12.2, color: '#F59E0B' },
      { category: 'Utilidades', amount: 520.75, percentage: 15.0, color: '#8B5CF6' },
      { category: 'Outros', amount: 239.30, percentage: 6.9, color: '#6B7280' },
    ],
    monthlyTrend: [
      { month: 'Ago', income: 4800, expenses: 3200 },
      { month: 'Set', income: 5200, expenses: 3400 },
      { month: 'Out', income: 4900, expenses: 2900 },
      { month: 'Nov', income: 5500, expenses: 3600 },
      { month: 'Dez', income: 5800, expenses: 3800 },
      { month: 'Jan', income: 5300, expenses: 3462 },
    ],
    insights: [
      {
        type: 'positive',
        title: 'Economia este mês',
        description: 'Você gastou 12% menos que o mês anterior',
        value: 'R$ 338,00'
      },
      {
        type: 'negative',
        title: 'Categoria em alta',
        description: 'Gastos com transporte aumentaram 23%',
        value: 'R$ 120,00'
      },
      {
        type: 'neutral',
        title: 'Meta de economia',
        description: 'Você está 73% próximo da sua meta mensal',
        value: '73%'
      },
      {
        type: 'positive',
        title: 'Receita estável',
        description: 'Sua receita manteve-se constante nos últimos 3 meses',
        value: 'Estável'
      },
    ]
  };

  const periods = [
    { value: 'thisMonth', label: 'Este Mês' },
    { value: 'lastMonth', label: 'Mês Anterior' },
    { value: 'thisYear', label: 'Este Ano' },
    { value: 'lastYear', label: 'Ano Anterior' },
    { value: 'custom', label: 'Período Personalizado' },
  ];

  const reportTypes = [
    { value: 'overview', label: 'Visão Geral', icon: ChartBarIcon },
    { value: 'categories', label: 'Por Categoria', icon: BanknotesIcon },
    { value: 'trends', label: 'Tendências', icon: ArrowTrendingUpIcon },
    { value: 'comparison', label: 'Comparativo', icon: FunnelIcon },
  ];

  const handleExportPDF = () => {
    console.log('Exporting PDF report...');
  };

  const handleExportExcel = () => {
    console.log('Exporting Excel report...');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    console.log('Sharing report...');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                Relatórios
              </h2>
              <Badge variant="warning" size="sm">
                <StarIcon className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Análises avançadas das suas finanças
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <PrinterIcon className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <ShareIcon className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleExportPDF}>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {periods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Inicial
                  </label>
                  <Input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Relatório
              </label>
              <select
                value={selectedReport}
                onChange={(e) => setSelectedReport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <Button>
              <FunnelIcon className="h-4 w-4 mr-2" />
              Gerar Relatório
            </Button>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Receitas
                  </dt>
                  <dd className="text-2xl font-semibold text-green-600">
                    R$ {reportData.totalIncome.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingDownIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Despesas
                  </dt>
                  <dd className="text-2xl font-semibold text-red-600">
                    R$ {reportData.totalExpenses.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className={`h-6 w-6 ${reportData.balance >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Saldo Final
                  </dt>
                  <dd className={`text-2xl font-semibold ${reportData.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {reportData.balance.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Transações
                  </dt>
                  <dd className="text-2xl font-semibold text-blue-600">
                    {reportData.transactionCount}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>

        {/* Report Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {selectedReport === 'overview' && 'Receitas vs Despesas'}
                  {selectedReport === 'categories' && 'Distribuição por Categoria'}
                  {selectedReport === 'trends' && 'Tendência dos Últimos 6 Meses'}
                  {selectedReport === 'comparison' && 'Comparativo Mensal'}
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{reportData.period}</span>
                </div>
              </div>

              {selectedReport === 'overview' && (
                <IncomeExpenseChart
                  data={{
                    labels: reportData.monthlyTrend.map(d => d.month),
                    income: reportData.monthlyTrend.map(d => d.income),
                    expenses: reportData.monthlyTrend.map(d => d.expenses),
                  }}
                  height={400}
                />
              )}

              {selectedReport === 'categories' && (
                <CategoryDistributionChart
                  data={{
                    labels: reportData.categoriesBreakdown.map(c => c.category),
                    values: reportData.categoriesBreakdown.map(c => c.amount),
                    colors: reportData.categoriesBreakdown.map(c => c.color),
                  }}
                  height={400}
                />
              )}

              {(selectedReport === 'trends' || selectedReport === 'comparison') && (
                <TrendChart
                  data={{
                    labels: reportData.monthlyTrend.map(d => d.month),
                    datasets: [
                      {
                        label: 'Receitas',
                        data: reportData.monthlyTrend.map(d => d.income),
                        color: '#10B981',
                      },
                      {
                        label: 'Despesas',
                        data: reportData.monthlyTrend.map(d => d.expenses),
                        color: '#EF4444',
                      },
                    ],
                  }}
                  height={400}
                />
              )}
            </Card>
          </div>

          {/* Insights */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Insights Financeiros
              </h3>
              <div className="space-y-4">
                {reportData.insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-l-4 ${
                      insight.type === 'positive'
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                        : insight.type === 'negative'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className={`font-medium text-sm ${
                          insight.type === 'positive'
                            ? 'text-green-800 dark:text-green-200'
                            : insight.type === 'negative'
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-blue-800 dark:text-blue-200'
                        }`}>
                          {insight.title}
                        </h4>
                        <p className={`text-xs mt-1 ${
                          insight.type === 'positive'
                            ? 'text-green-700 dark:text-green-300'
                            : insight.type === 'negative'
                            ? 'text-red-700 dark:text-red-300'
                            : 'text-blue-700 dark:text-blue-300'
                        }`}>
                          {insight.description}
                        </p>
                      </div>
                      {insight.value && (
                        <div className={`text-sm font-bold ${
                          insight.type === 'positive'
                            ? 'text-green-600 dark:text-green-400'
                            : insight.type === 'negative'
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}>
                          {insight.value}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Categories Breakdown Table */}
        {selectedReport === 'categories' && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Detalhamento por Categoria
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Percentual
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Participação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.categoriesBreakdown.map((category, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {category.category}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        R$ {category.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {category.percentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              backgroundColor: category.color,
                              width: `${category.percentage}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Monthly Comparison */}
        {selectedReport === 'comparison' && (
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Comparativo Mensal
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Mês
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Receitas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Despesas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Saldo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Variação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {reportData.monthlyTrend.map((month, index) => {
                    const balance = month.income - month.expenses;
                    const previousBalance = index > 0 ? reportData.monthlyTrend[index - 1].income - reportData.monthlyTrend[index - 1].expenses : 0;
                    const variation = index > 0 ? ((balance - previousBalance) / previousBalance) * 100 : 0;

                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {month.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          R$ {month.income.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          R$ {month.expenses.toFixed(2)}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                          balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          R$ {balance.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index > 0 && (
                            <div className={`flex items-center text-sm ${
                              variation >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {variation >= 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                              )}
                              {Math.abs(variation).toFixed(1)}%
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}