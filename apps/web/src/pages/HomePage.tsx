import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { Card, Button, SyncStatusIndicator } from '../components/shared';
import styles from './HomePage.module.css';

export const HomePage: React.FC = () => {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => apiService.getTransactions({ limit: 5 }),
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <SyncStatusIndicator />
      
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>
          Bem-vindo ao seu controle financeiro inteligente
        </p>
      </div>

      <div className={styles.grid}>
        {/* Card de Resumo */}
        <Card
          variant="elevated"
          header={
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Resumo Mensal</h2>
              <span className={styles.cardIcon}>💰</span>
            </div>
          }
        >
          <div className={styles.cardContent}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Receitas</span>
              <span className={`${styles.summaryValue} ${styles.income}`}>
                R$ 0,00
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Despesas</span>
              <span className={`${styles.summaryValue} ${styles.expense}`}>
                R$ 0,00
              </span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Saldo</span>
              <span className={`${styles.summaryValue} ${styles.balance}`}>
                R$ 0,00
              </span>
            </div>
          </div>
        </Card>

        {/* Card de Transações Recentes */}
        <div className={styles.transactionsCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Transações Recentes</h2>
            <span className={styles.cardIcon}>📊</span>
          </div>
          <div className={styles.cardContent}>
            {transactions?.transactions.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyText}>
                  Nenhuma transação encontrada
                </p>
                <p className={styles.emptySubtext}>
                  Comece adicionando suas primeiras transações
                </p>
              </div>
            ) : (
              <div className={styles.transactionsList}>
                {transactions?.transactions.map((transaction) => (
                  <div key={transaction.id} className={styles.transactionItem}>
                    <div className={styles.transactionInfo}>
                      <span className={styles.transactionDescription}>
                        {transaction.description}
                      </span>
                      <span className={styles.transactionCategory}>
                        {transaction.category}
                      </span>
                    </div>
                    <span
                      className={`${styles.transactionAmount} ${
                        transaction.type === 'income'
                          ? styles.income
                          : styles.expense
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'} R${' '}
                      {transaction.amount.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card de Recursos Premium */}
        <div className={styles.premiumCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recursos Premium</h2>
            <span className={styles.premiumBadge}>✨ Premium</span>
          </div>
          <div className={styles.cardContent}>
            <ul className={styles.featuresList}>
              <li className={styles.feature}>
                <span className={styles.featureIcon}>☁️</span>
                Sincronização em nuvem
              </li>
              <li className={styles.feature}>
                <span className={styles.featureIcon}>👥</span>
                Conta conjunta/família
              </li>
              <li className={styles.feature}>
                <span className={styles.featureIcon}>📱</span>
                Acesso web e mobile
              </li>
              <li className={styles.feature}>
                <span className={styles.featureIcon}>📊</span>
                Relatórios avançados
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};