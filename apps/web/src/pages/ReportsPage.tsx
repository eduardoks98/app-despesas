import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import styles from './ReportsPage.module.css';

export const ReportsPage: React.FC = () => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [chartType, setChartType] = useState<'category' | 'trend'>('category');

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['reports', period],
    queryFn: () => apiService.getReports(period),
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando relatórios...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Relatórios</h1>
        <p className={styles.subtitle}>
          Análise detalhada das suas finanças
        </p>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Período</label>
          <div className={styles.periodButtons}>
            {[
              { value: '7d', label: '7 dias' },
              { value: '30d', label: '30 dias' },
              { value: '90d', label: '3 meses' },
              { value: '1y', label: '1 ano' },
            ].map((option) => (
              <button
                key={option.value}
                className={`${styles.periodButton} ${period === option.value ? styles.active : ''}`}
                onClick={() => setPeriod(option.value as any)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>Visualização</label>
          <div className={styles.chartButtons}>
            <button
              className={`${styles.chartButton} ${chartType === 'category' ? styles.active : ''}`}
              onClick={() => setChartType('category')}
            >
              Por Categoria
            </button>
            <button
              className={`${styles.chartButton} ${chartType === 'trend' ? styles.active : ''}`}
              onClick={() => setChartType('trend')}
            >
              Tendência
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Receitas Totais</h3>
            <span className={styles.cardIcon}>💰</span>
          </div>
          <div className={styles.cardValue}>
            <span className={`${styles.value} ${styles.income}`}>
              R$ {reportData?.totalIncome?.toFixed(2).replace('.', ',') || '0,00'}
            </span>
            <span className={styles.change}>
              +12.5% vs período anterior
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Despesas Totais</h3>
            <span className={styles.cardIcon}>💸</span>
          </div>
          <div className={styles.cardValue}>
            <span className={`${styles.value} ${styles.expense}`}>
              R$ {reportData?.totalExpense?.toFixed(2).replace('.', ',') || '0,00'}
            </span>
            <span className={styles.change}>
              -5.2% vs período anterior
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Economia</h3>
            <span className={styles.cardIcon}>🎯</span>
          </div>
          <div className={styles.cardValue}>
            <span className={`${styles.value} ${styles.savings}`}>
              R$ {((reportData?.totalIncome || 0) - (reportData?.totalExpense || 0)).toFixed(2).replace('.', ',') || '0,00'}
            </span>
            <span className={styles.change}>
              +18.7% vs período anterior
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Transações</h3>
            <span className={styles.cardIcon}>📊</span>
          </div>
          <div className={styles.cardValue}>
            <span className={styles.value}>
              {reportData?.totalTransactions || 0}
            </span>
            <span className={styles.change}>
              +3 vs período anterior
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.chartsGrid}>
        {/* Main Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <h3 className={styles.chartTitle}>
              {chartType === 'category' ? 'Gastos por Categoria' : 'Tendência de Gastos'}
            </h3>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <div className={`${styles.legendColor} ${styles.income}`}></div>
                <span>Receitas</span>
              </div>
              <div className={styles.legendItem}>
                <div className={`${styles.legendColor} ${styles.expense}`}></div>
                <span>Despesas</span>
              </div>
            </div>
          </div>
          <div className={styles.chartContent}>
            {/* Chart placeholder - Em um app real, usaria uma lib como Chart.js ou Recharts */}
            <div className={styles.chartPlaceholder}>
              <div className={styles.chartBars}>
                {chartType === 'category' ? (
                  // Gráfico de barras por categoria
                  <>
                    <div className={styles.barGroup}>
                      <div className={`${styles.bar} ${styles.expense}`} style={{height: '80%'}}></div>
                      <span className={styles.barLabel}>Alimentação</span>
                    </div>
                    <div className={styles.barGroup}>
                      <div className={`${styles.bar} ${styles.expense}`} style={{height: '60%'}}></div>
                      <span className={styles.barLabel}>Transporte</span>
                    </div>
                    <div className={styles.barGroup}>
                      <div className={`${styles.bar} ${styles.expense}`} style={{height: '40%'}}></div>
                      <span className={styles.barLabel}>Lazer</span>
                    </div>
                    <div className={styles.barGroup}>
                      <div className={`${styles.bar} ${styles.income}`} style={{height: '90%'}}></div>
                      <span className={styles.barLabel}>Salário</span>
                    </div>
                  </>
                ) : (
                  // Gráfico de linha para tendências
                  <div className={styles.lineChart}>
                    <div className={styles.chartLine}></div>
                    <div className={styles.chartPoints}>
                      <div className={styles.chartPoint} style={{left: '10%', bottom: '30%'}}></div>
                      <div className={styles.chartPoint} style={{left: '30%', bottom: '50%'}}></div>
                      <div className={styles.chartPoint} style={{left: '50%', bottom: '40%'}}></div>
                      <div className={styles.chartPoint} style={{left: '70%', bottom: '70%'}}></div>
                      <div className={styles.chartPoint} style={{left: '90%', bottom: '60%'}}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Categories */}
        <div className={styles.categoriesCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Top Categorias</h3>
            <span className={styles.cardIcon}>🏆</span>
          </div>
          <div className={styles.categoriesList}>
            {[
              { name: 'Alimentação', amount: 1250.00, percentage: 35, color: '#dc2626' },
              { name: 'Transporte', amount: 850.00, percentage: 24, color: '#ea580c' },
              { name: 'Lazer', amount: 620.00, percentage: 17, color: '#d97706' },
              { name: 'Educação', amount: 400.00, percentage: 11, color: '#059669' },
              { name: 'Outros', amount: 480.00, percentage: 13, color: '#6b7280' },
            ].map((category, index) => (
              <div key={index} className={styles.categoryItem}>
                <div className={styles.categoryInfo}>
                  <div 
                    className={styles.categoryColor} 
                    style={{ backgroundColor: category.color }}
                  ></div>
                  <div className={styles.categoryDetails}>
                    <span className={styles.categoryName}>{category.name}</span>
                    <span className={styles.categoryAmount}>
                      R$ {category.amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                <div className={styles.categoryPercentage}>
                  {category.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className={styles.insightsCard}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Insights e Recomendações</h3>
          <span className={styles.cardIcon}>💡</span>
        </div>
        <div className={styles.insightsList}>
          <div className={styles.insightItem}>
            <div className={styles.insightIcon}>📈</div>
            <div className={styles.insightContent}>
              <h4 className={styles.insightTitle}>Gastos com alimentação aumentaram</h4>
              <p className={styles.insightText}>
                Seus gastos com alimentação aumentaram 15% este mês. 
                Considere cozinhar mais em casa para economizar.
              </p>
            </div>
          </div>
          
          <div className={styles.insightItem}>
            <div className={styles.insightIcon}>🎯</div>
            <div className={styles.insightContent}>
              <h4 className={styles.insightTitle}>Meta de economia alcançada</h4>
              <p className={styles.insightText}>
                Parabéns! Você economizou R$ 500 este mês, 
                superando sua meta em 20%.
              </p>
            </div>
          </div>
          
          <div className={styles.insightItem}>
            <div className={styles.insightIcon}>⚠️</div>
            <div className={styles.insightContent}>
              <h4 className={styles.insightTitle}>Atenção aos gastos com lazer</h4>
              <p className={styles.insightText}>
                Seus gastos com lazer representam 17% do total. 
                Avalie se está dentro do seu orçamento planejado.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};