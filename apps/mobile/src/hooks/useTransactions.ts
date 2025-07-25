import { useState, useEffect, useCallback } from 'react';
import { Transaction, GetTransactionsRequest, AddTransactionRequest } from '@app-despesas/core';
import { appContainer } from '../services/core';

export interface UseTransactionsResult {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTransaction: (request: AddTransactionRequest) => Promise<void>;
}

export function useTransactions(filter?: GetTransactionsRequest): UseTransactionsResult {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await appContainer.getTransactionsUseCase.execute(filter);
      
      setTransactions(response.transactions);
      setTotalIncome(response.totalIncome);
      setTotalExpense(response.totalExpense);
      setBalance(response.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const addTransaction = useCallback(async (request: AddTransactionRequest) => {
    try {
      setError(null);
      await appContainer.addTransactionUseCase.execute(request);
      await loadTransactions(); // Refresh list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction');
      throw err;
    }
  }, [loadTransactions]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    totalIncome,
    totalExpense,
    balance,
    loading,
    error,
    refresh: loadTransactions,
    addTransaction,
  };
}