'use client';

import { Suspense } from 'react';
import { 
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  CreditCardIcon,
  CalendarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, LoadingSpinner } from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { IncomeExpenseChart, CategoryDistributionChart, TrendChart } from '@/components/charts';

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
              Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Visão geral das suas finanças
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <Suspense fallback={<StatsCardsSkeleton />}>
          <StatsCards />
        </Suspense>

        {/* Charts and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Card */}
          <Suspense fallback={<ChartCardSkeleton />}>
            <ChartCard />
          </Suspense>

          {/* Recent Transactions */}
          <Suspense fallback={<RecentTransactionsSkeleton />}>
            <RecentTransactions />
          </Suspense>
        </div>

        {/* Categories Overview */}
        <Suspense fallback={<CategoriesOverviewSkeleton />}>
          <CategoriesOverview />
        </Suspense>
      </div>
    </AppLayout>
  );
}

function StatsCards() {
  // Mock data - this would come from your API
  const stats = [
    {
      name: 'Saldo Total',
      value: 'R$ 12.450,30',
      change: '+12%',
      changeType: 'positive' as const,
      icon: BanknotesIcon,
    },
    {
      name: 'Receitas este mês',
      value: 'R$ 8.230,00',
      change: '+5%',
      changeType: 'positive' as const,
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Despesas este mês',
      value: 'R$ 3.420,50',
      change: '-2%',
      changeType: 'negative' as const,
      icon: ArrowTrendingDownIcon,
    },
    {
      name: 'Transações',
      value: '127',
      change: '+8',
      changeType: 'neutral' as const,
      icon: CreditCardIcon,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.name} className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <stat.icon className="h-6 w-6 text-gray-400" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {stat.name}
                </dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    stat.changeType === 'positive' 
                      ? 'text-green-600' 
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {stat.change}
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChartCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Evolução Mensal
        </h3>
        <Badge variant="success" size="sm">Ativo</Badge>
      </div>
      
      <IncomeExpenseChart 
        data={{
          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
          income: [5000, 5200, 4800, 5500, 5800, 6000],
          expenses: [3200, 3400, 2900, 3600, 3800, 3900],
        }}
        height={280}
      />
    </Card>
  );
}

function RecentTransactions() {
  // Mock data
  const transactions = [
    {
      id: '1',
      description: 'Supermercado ABC',
      amount: -125.50,
      category: 'Alimentação',
      date: '2024-01-15',
      type: 'expense' as const,
    },
    {
      id: '2', 
      description: 'Salário Janeiro',
      amount: 4500.00,
      category: 'Salário',
      date: '2024-01-01',
      type: 'income' as const,
    },
    {
      id: '3',
      description: 'Farmácia Central',
      amount: -45.30,
      category: 'Saúde',
      date: '2024-01-14',
      type: 'expense' as const,
    },
    {
      id: '4',
      description: 'Freelance Design',
      amount: 800.00,
      category: 'Freelance',
      date: '2024-01-13',
      type: 'income' as const,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Transações Recentes
        </h3>
        <Button variant="ghost" size="sm">
          Ver todas
        </Button>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {transaction.description}
                </p>
                <p className={`text-sm font-semibold ${
                  transaction.type === 'income' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : ''}
                  R$ {Math.abs(transaction.amount).toFixed(2)}
                </p>
              </div>
              <div className="flex items-center mt-1 space-x-2">
                <Badge variant="outline" size="sm">
                  {transaction.category}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(transaction.date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CategoriesOverview() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Gastos por Categoria
        </h3>
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Janeiro 2024
          </span>
        </div>
      </div>

      <CategoryDistributionChart 
        data={{
          labels: ['Alimentação', 'Transporte', 'Lazer', 'Saúde', 'Outros'],
          values: [1250.30, 650.80, 420.90, 380.20, 760.30],
        }}
        height={300}
      />
    </Card>
  );
}

// Skeleton components for loading states
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
              <div className="ml-5 w-full">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-2"></div>
                <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function ChartCardSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </Card>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-4"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-32"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
              <div className="mt-2 flex space-x-2">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function CategoriesOverviewSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-40 mb-6"></div>
        <div className="h-64 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </Card>
  );
}