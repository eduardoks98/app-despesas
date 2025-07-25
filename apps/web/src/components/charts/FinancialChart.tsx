'use client';

import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions,
  ChartData,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface FinancialChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: ChartData<any>;
  options?: ChartOptions<any>;
  height?: number;
  className?: string;
}

export function FinancialChart({ 
  type, 
  data, 
  options = {}, 
  height = 300,
  className = ''
}: FinancialChartProps) {
  const chartRef = useRef<any>(null);

  const defaultOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
          color: '#6B7280',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F9FAFB',
        borderColor: '#374151',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (type === 'doughnut') {
              const label = context.label || '';
              const value = context.parsed;
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: R$ ${value.toFixed(2)} (${percentage}%)`;
            }
            return `${context.dataset.label}: R$ ${context.parsed.y?.toFixed(2) || context.parsed?.toFixed(2)}`;
          },
        },
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          color: '#E5E7EB',
          display: true,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: '#E5E7EB',
          display: true,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value) {
            return `R$ ${Number(value).toFixed(0)}`;
          },
        },
      },
    } : undefined,
    ...options,
  };

  useEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      // Update chart on theme change
      const handleThemeChange = () => {
        const isDark = document.documentElement.classList.contains('dark');
        const gridColor = isDark ? '#374151' : '#E5E7EB';
        const textColor = isDark ? '#9CA3AF' : '#6B7280';

        if (chart.options.scales) {
          chart.options.scales.x.grid.color = gridColor;
          chart.options.scales.x.ticks.color = textColor;
          chart.options.scales.y.grid.color = gridColor;
          chart.options.scales.y.ticks.color = textColor;
        }

        if (chart.options.plugins?.legend?.labels) {
          chart.options.plugins.legend.labels.color = textColor;
        }

        chart.update();
      };

      // Observer for theme changes
      const observer = new MutationObserver(handleThemeChange);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    }
  }, []);

  const chartComponents = {
    line: Line,
    bar: Bar,
    doughnut: Doughnut,
  };

  const ChartComponent = chartComponents[type];

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      <ChartComponent
        ref={chartRef}
        data={data}
        options={defaultOptions}
      />
    </div>
  );
}

// Specialized chart components
export function IncomeExpenseChart({ 
  data, 
  className = '',
  height = 300 
}: { 
  data: { labels: string[]; income: number[]; expenses: number[] };
  className?: string;
  height?: number;
}) {
  const chartData: ChartData<'bar'> = {
    labels: data.labels,
    datasets: [
      {
        label: 'Receitas',
        data: data.income,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
      {
        label: 'Despesas',
        data: data.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    plugins: {
      title: {
        display: true,
        text: 'Receitas vs Despesas',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
  };

  return (
    <FinancialChart
      type="bar"
      data={chartData}
      options={options}
      height={height}
      className={className}
    />
  );
}

export function CategoryDistributionChart({ 
  data, 
  className = '',
  height = 300 
}: { 
  data: { labels: string[]; values: number[]; colors?: string[] };
  className?: string;
  height?: number;
}) {
  const defaultColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6B7280'
  ];

  const chartData: ChartData<'doughnut'> = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: data.colors || defaultColors.slice(0, data.values.length),
        borderColor: '#FFFFFF',
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options: ChartOptions<'doughnut'> = {
    plugins: {
      title: {
        display: true,
        text: 'Distribuição por Categoria',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true,
        },
      },
    },
    cutout: '60%',
  };

  return (
    <FinancialChart
      type="doughnut"
      data={chartData}
      options={options}
      height={height}
      className={className}
    />
  );
}

export function TrendChart({ 
  data, 
  className = '',
  height = 300 
}: { 
  data: { 
    labels: string[]; 
    datasets: Array<{
      label: string;
      data: number[];
      color: string;
    }>;
  };
  className?: string;
  height?: number;
}) {
  const chartData: ChartData<'line'> = {
    labels: data.labels,
    datasets: data.datasets.map(dataset => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.color,
      backgroundColor: `${dataset.color}20`,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: dataset.color,
      pointBorderColor: '#FFFFFF',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
    })),
  };

  const options: ChartOptions<'line'> = {
    plugins: {
      title: {
        display: true,
        text: 'Tendência Temporal',
        color: '#374151',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

  return (
    <FinancialChart
      type="line"
      data={chartData}
      options={options}
      height={height}
      className={className}
    />
  );
}