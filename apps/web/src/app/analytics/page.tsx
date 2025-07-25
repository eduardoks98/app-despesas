'use client';

import { useState, useMemo } from 'react';
import { 
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CreditCardIcon,
  StarIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, Input } from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { IncomeExpenseChart, CategoryDistributionChart, TrendChart } from '@/components/charts';

interface AnalyticsData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
  averageTransaction: number;
  monthlyGrowth: number;
  categoryDistribution: Array<{
    category: string;
    amount: number;
    percentage: number;
    trend: number;
    color: string;
  }>;
  weeklyTrend: Array<{
    day: string;
    income: number;
    expenses: number;
  }>;
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'danger';
    title: string;
    description: string;
    value?: string;
    action?: string;
  }>;
  predictions: Array<{
    month: string;
    predicted: number;
    confidence: number;
  }>;
  goals: Array<{
    id: string;
    name: string;
    target: number;
    current: number;
    percentage: number;
    deadline: string;
    status: 'on_track' | 'behind' | 'ahead';
  }>;
}

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Mock analytics data - this would come from your API
  const analyticsData: AnalyticsData = {
    period: 'Janeiro 2024',
    totalIncome: 5300.00,
    totalExpenses: 3462.25,
    transactionCount: 47,
    averageTransaction: 112.85,
    monthlyGrowth: 8.5,
    categoryDistribution: [
      { category: 'Alimentação', amount: 1250.30, percentage: 36.1, trend: -5.2, color: '#10B981' },
      { category: 'Transporte', amount: 650.80, percentage: 18.8, trend: 12.3, color: '#3B82F6' },
      { category: 'Saúde', amount: 380.20, percentage: 11.0, trend: 2.1, color: '#EF4444' },
      { category: 'Lazer', amount: 420.90, percentage: 12.2, trend: -8.7, color: '#F59E0B' },
      { category: 'Utilidades', amount: 520.75, percentage: 15.0, trend: 3.4, color: '#8B5CF6' },
      { category: 'Outros', amount: 239.30, percentage: 6.9, trend: 1.2, color: '#6B7280' },
    ],
    weeklyTrend: [
      { day: 'Dom', income: 0, expenses: 145.50 },
      { day: 'Seg', income: 0, expenses: 89.30 },
      { day: 'Ter', income: 800, expenses: 234.80 },
      { day: 'Qua', income: 0, expenses: 156.20 },
      { day: 'Qui', income: 0, expenses: 278.90 },
      { day: 'Sex', income: 4500, expenses: 189.40 },
      { day: 'Sáb', income: 0, expenses: 198.70 },
    ],
    insights: [
      {
        type: 'success',
        title: 'Economia acima da meta',
        description: 'Você economizou 15% a mais que o planejado este mês',
        value: 'R$ 284,50',
        action: 'Ver detalhes'
      },
      {
        type: 'warning',
        title: 'Gastos com transporte em alta',
        description: 'Aumento de 23% comparado ao mês anterior',
        value: '+R$ 120,00',
        action: 'Analisar categoria'
      },
      {
        type: 'info',
        title: 'Padrão de gastos identificado',
        description: 'Quinta-feira é seu dia de maior gasto da semana',
        value: 'R$ 278,90',
        action: 'Ver padrões'
      },
      {
        type: 'danger',
        title: 'Meta de lazer ultrapassada',
        description: 'Você gastou 28% a mais que o orçado em entretenimento',
        value: 'R$ 92,00',
        action: 'Ajustar orçamento'
      },
    ],
    predictions: [
      { month: 'Fev', predicted: 3580, confidence: 85 },
      { month: 'Mar', predicted: 3420, confidence: 78 },
      { month: 'Abr', predicted: 3650, confidence: 72 },
      { month: 'Mai', predicted: 3480, confidence: 68 },
    ],
    goals: [
      {
        id: '1',
        name: 'Economia para viagem',
        target: 5000,
        current: 3750,
        percentage: 75,
        deadline: '2024-06-30',
        status: 'on_track'
      },
      {
        id: '2',
        name: 'Reserva de emergência',
        target: 15000,
        current: 8200,
        percentage: 54.7,
        deadline: '2024-12-31',
        status: 'behind'
      },
      {
        id: '3',
        name: 'Reduzir gastos com delivery',
        target: 300,
        current: 180,
        percentage: 60,
        deadline: '2024-02-29',
        status: 'ahead'
      },
    ]
  };

  const periods = [
    { value: 'thisWeek', label: 'Esta Semana' },
    { value: 'thisMonth', label: 'Este Mês' },
    { value: 'last3Months', label: 'Últimos 3 Meses' },
    { value: 'thisYear', label: 'Este Ano' },
    { value: 'custom', label: 'Personalizado' },
  ];

  const metrics = [
    { value: 'overview', label: 'Visão Geral', icon: ChartBarIcon },
    { value: 'trends', label: 'Tendências', icon: TrendingUpIcon },
    { value: 'categories', label: 'Categorias', icon: BanknotesIcon },
    { value: 'predictions', label: 'Previsões', icon: LightBulbIcon },
    { value: 'goals', label: 'Metas', icon: StarIcon },
  ];

  const balance = analyticsData.totalIncome - analyticsData.totalExpenses;
  const savingsRate = (balance / analyticsData.totalIncome) * 100;

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircleIcon;
      case 'warning': return ExclamationTriangleIcon;
      case 'danger': return ExclamationTriangleIcon;
      default: return InformationCircleIcon;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-800 dark:text-green-200';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200';
      case 'danger': return 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200';
      default: return 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-800 dark:text-blue-200';
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-green-600';
      case 'ahead': return 'text-blue-600';
      case 'behind': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getGoalStatusText = (status: string) => {
    switch (status) {
      case 'on_track': return 'No prazo';
      case 'ahead': return 'Adiantado';
      case 'behind': return 'Atrasado';
      default: return 'Indefinido';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                Analytics
              </h2>
              <Badge variant="warning" size="sm">
                <StarIcon className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Análise inteligente dos seus dados financeiros
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh' : 'Atualizar'}
            </Button>
            <Button variant="outline" size="sm">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-center">
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

            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Métrica
              </label>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                {metrics.map((metric) => (
                  <option key={metric.value} value={metric.value}>
                    {metric.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BanknotesIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Saldo
                  </dt>
                  <dd className={`text-xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {balance.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUpIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Taxa de Economia
                  </dt>
                  <dd className="text-xl font-semibold text-blue-600">
                    {savingsRate.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CreditCardIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Transações
                  </dt>
                  <dd className="text-xl font-semibold text-purple-600">
                    {analyticsData.transactionCount}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-orange-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Média/Transação
                  </dt>
                  <dd className="text-xl font-semibold text-orange-600">
                    R$ {analyticsData.averageTransaction.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUpIcon className={`h-6 w-6 ${analyticsData.monthlyGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Crescimento
                  </dt>
                  <dd className={`text-xl font-semibold ${analyticsData.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {analyticsData.monthlyGrowth >= 0 ? '+' : ''}{analyticsData.monthlyGrowth.toFixed(1)}%
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Charts Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Weekly Trend */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Tendência Semanal
                </h3>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Última semana</span>
                </div>
              </div>

              <IncomeExpenseChart
                data={{
                  labels: analyticsData.weeklyTrend.map(d => d.day),
                  income: analyticsData.weeklyTrend.map(d => d.income),
                  expenses: analyticsData.weeklyTrend.map(d => d.expenses),
                }}
                height={300}
              />
            </Card>

            {/* Category Analysis */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Análise por Categoria
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <CategoryDistributionChart
                    data={{
                      labels: analyticsData.categoryDistribution.map(c => c.category),
                      values: analyticsData.categoryDistribution.map(c => c.amount),
                      colors: analyticsData.categoryDistribution.map(c => c.color),
                    }}
                    height={250}
                  />
                </div>
                
                <div className="space-y-4">
                  {analyticsData.categoryDistribution.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {category.category}
                          </span>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {category.percentage.toFixed(1)}% do total
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          R$ {category.amount.toFixed(2)}
                        </div>
                        <div className={`text-xs flex items-center ${
                          category.trend >= 0 ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {category.trend >= 0 ? (
                            <TrendingUpIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDownIcon className="h-3 w-3 mr-1" />
                          )}
                          {Math.abs(category.trend).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Predictions */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                Previsões Inteligentes
              </h3>
              
              <TrendChart
                data={{
                  labels: analyticsData.predictions.map(p => p.month),
                  datasets: [
                    {
                      label: 'Gastos Previstos',
                      data: analyticsData.predictions.map(p => p.predicted),
                      color: '#8B5CF6',
                    },
                  ],
                }}
                height={200}
              />

              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {analyticsData.predictions.map((prediction, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {prediction.month}
                    </div>
                    <div className="text-lg font-semibold text-purple-600">
                      R$ {prediction.predicted.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {prediction.confidence}% confiança
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Insights */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Insights Personalizados
              </h3>
              <div className="space-y-4">
                {analyticsData.insights.map((insight, index) => {
                  const IconComponent = getInsightIcon(insight.type);
                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${getInsightColor(insight.type)}`}
                    >
                      <div className="flex items-start">
                        <IconComponent className="h-5 w-5 mr-3 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {insight.title}
                          </h4>
                          <p className="text-xs mt-1 opacity-80">
                            {insight.description}
                          </p>
                          {insight.value && (
                            <div className="text-sm font-bold mt-2">
                              {insight.value}
                            </div>
                          )}
                          {insight.action && (
                            <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-xs">
                              {insight.action} ’
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Goals Progress */}
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Progresso das Metas
              </h3>
              <div className="space-y-4">
                {analyticsData.goals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {goal.name}
                      </h4>
                      <Badge 
                        variant={goal.status === 'on_track' ? 'success' : goal.status === 'ahead' ? 'info' : 'error'}
                        size="sm"
                      >
                        {getGoalStatusText(goal.status)}
                      </Badge>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          goal.status === 'on_track' ? 'bg-green-500' :
                          goal.status === 'ahead' ? 'bg-blue-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(goal.percentage, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>R$ {goal.current.toFixed(0)} / R$ {goal.target.toFixed(0)}</span>
                      <span>{goal.percentage.toFixed(1)}%</span>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full mt-4">
                <StarIcon className="h-4 w-4 mr-2" />
                Criar Nova Meta
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}