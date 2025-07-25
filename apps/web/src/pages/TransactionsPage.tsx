import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import styles from './TransactionsPage.module.css';

export const TransactionsPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', { page, limit, type: filter !== 'all' ? filter : undefined }],
    queryFn: () => apiService.getTransactions({ 
      page, 
      limit, 
      type: filter !== 'all' ? filter : undefined 
    }),
  });

  const handleFilterChange = (newFilter: 'all' | 'income' | 'expense') => {
    setFilter(newFilter);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando transações...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Erro ao carregar transações</h2>
        <p>Tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Transações</h1>
        <p className={styles.subtitle}>
          Gerencie todas as suas receitas e despesas
        </p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterButtons}>
          <button
            className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            Todas
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'income' ? styles.active : ''}`}
            onClick={() => handleFilterChange('income')}
          >
            Receitas
          </button>
          <button
            className={`${styles.filterButton} ${filter === 'expense' ? styles.active : ''}`}
            onClick={() => handleFilterChange('expense')}
          >
            Despesas
          </button>
        </div>

        <button className={styles.addButton}>
          <span className={styles.addIcon}>+</span>
          Nova Transação
        </button>
      </div>

      {/* Summary Cards */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💰</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total de Receitas</span>
            <span className={`${styles.summaryValue} ${styles.income}`}>
              R$ {data?.summary?.totalIncome?.toFixed(2).replace('.', ',') || '0,00'}
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>💸</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Total de Despesas</span>
            <span className={`${styles.summaryValue} ${styles.expense}`}>
              R$ {data?.summary?.totalExpense?.toFixed(2).replace('.', ',') || '0,00'}
            </span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryIcon}>📊</div>
          <div className={styles.summaryContent}>
            <span className={styles.summaryLabel}>Saldo Total</span>
            <span className={`${styles.summaryValue} ${styles.balance}`}>
              R$ {data?.summary?.balance?.toFixed(2).replace('.', ',') || '0,00'}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className={styles.transactionsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {filter === 'all' && 'Todas as Transações'}
            {filter === 'income' && 'Receitas'}
            {filter === 'expense' && 'Despesas'}
          </h2>
          <span className={styles.transactionCount}>
            {data?.total || 0} transações
          </span>
        </div>

        {data?.transactions.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📝</div>
            <h3 className={styles.emptyTitle}>Nenhuma transação encontrada</h3>
            <p className={styles.emptyText}>
              {filter === 'all' 
                ? 'Comece adicionando sua primeira transação'
                : `Nenhuma ${filter === 'income' ? 'receita' : 'despesa'} encontrada`
              }
            </p>
            <button className={styles.emptyButton}>
              Adicionar Transação
            </button>
          </div>
        ) : (
          <>
            <div className={styles.transactionsList}>
              {data?.transactions.map((transaction) => (
                <div key={transaction.id} className={styles.transactionCard}>
                  <div className={styles.transactionMain}>
                    <div className={styles.transactionInfo}>
                      <h3 className={styles.transactionDescription}>
                        {transaction.description}
                      </h3>
                      <div className={styles.transactionMeta}>
                        <span className={styles.transactionCategory}>
                          {transaction.category}
                        </span>
                        <span className={styles.transactionDate}>
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.transactionAmount}>
                      <span className={`${styles.amount} ${transaction.type === 'income' ? styles.income : styles.expense}`}>
                        {transaction.type === 'income' ? '+' : '-'} R$ {transaction.amount.toFixed(2).replace('.', ',')}
                      </span>
                      <div className={styles.transactionActions}>
                        <button className={styles.actionButton}>✏️</button>
                        <button className={styles.actionButton}>🗑️</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {data && data.total > limit && (
              <div className={styles.pagination}>
                <button
                  className={styles.paginationButton}
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </button>
                
                <span className={styles.paginationInfo}>
                  Página {page} de {Math.ceil(data.total / limit)}
                </span>
                
                <button
                  className={styles.paginationButton}
                  disabled={page >= Math.ceil(data.total / limit)}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};