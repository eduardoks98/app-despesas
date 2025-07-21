import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipos
export interface Expense {
  id?: string;
  title: string;
  amount: number;
  date: string;
  category: string;
  description?: string;
  isRecurring: boolean;
  recurrenceType?: 'monthly' | 'weekly' | 'yearly';
  installments?: number;
  currentInstallment?: number;
  isFinancing?: boolean;
  interestRate?: number;
  monthlyAdjustment?: number;
  isPaid?: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface FinanceState {
  expenses: Expense[];
  totalExpenses: number;
  monthlyExpenses: number;
  loading: boolean;
}

type FinanceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_EXPENSES'; payload: Expense[] }
  | { type: 'ADD_EXPENSE'; payload: Expense }
  | { type: 'UPDATE_EXPENSE'; payload: Expense }
  | { type: 'DELETE_EXPENSE'; payload: string }
  | { type: 'CALCULATE_TOTALS' };

const initialState: FinanceState = {
  expenses: [],
  totalExpenses: 0,
  monthlyExpenses: 0,
  loading: false,
};

const financeReducer = (state: FinanceState, action: FinanceAction): FinanceState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_EXPENSES':
      return { ...state, expenses: action.payload };
    
    case 'ADD_EXPENSE':
      return { 
        ...state, 
        expenses: [...state.expenses, action.payload] 
      };
    
    case 'UPDATE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.map(expense =>
          expense.id === action.payload.id ? action.payload : expense
        ),
      };
    
    case 'DELETE_EXPENSE':
      return {
        ...state,
        expenses: state.expenses.filter(expense => expense.id !== action.payload),
      };
    
    case 'CALCULATE_TOTALS':
      const total = state.expenses
        .filter(expense => !expense.isPaid) // Apenas despesas não pagas
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthly = state.expenses
        .filter(expense => {
          const expenseDate = new Date(expense.date);
          return expenseDate.getMonth() === currentMonth && 
                 expenseDate.getFullYear() === currentYear &&
                 !expense.isPaid; // Apenas despesas não pagas do mês atual
        })
        .reduce((sum, expense) => sum + expense.amount, 0);
      
      return { ...state, totalExpenses: total, monthlyExpenses: monthly };
    
    default:
      return state;
  }
};

interface FinanceContextType {
  state: FinanceState;
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addInstallmentExpenses: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addRecurringExpenses: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  duplicateRecurringExpense: (expense: Expense, targetDate: Date) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  updateRelatedExpenses: (expense: Expense, mode: 'single' | 'future' | 'all' | 'all_including_past') => Promise<void>;
  markAsPaid: (id: string, isPaid: boolean, paidDate?: string) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  loadExpenses: () => Promise<void>;
  calculateFinancingAdjustment: (expense: Expense, months: number) => number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEY = '@finance_expenses';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financeReducer, initialState);

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    dispatch({ type: 'CALCULATE_TOTALS' });
  }, [state.expenses]);

  const loadExpenses = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const storedExpenses = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedExpenses) {
        const expenses = JSON.parse(storedExpenses);
        dispatch({ type: 'SET_EXPENSES', payload: expenses });
      }
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const saveExpenses = async (expenses: Expense[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch (error) {
      console.error('Erro ao salvar despesas:', error);
    }
  };

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const expense: Expense = {
      ...expenseData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Se for parcelado, criar múltiplas despesas
    if (expenseData.installments && expenseData.installments > 1) {
      await addInstallmentExpenses(expenseData);
    } 
    // Se for recorrente (não parcelado), criar para os próximos meses
    else if (expenseData.isRecurring && !expenseData.installments) {
      await addRecurringExpenses(expenseData);
    } 
    // Despesa normal
    else {
      dispatch({ type: 'ADD_EXPENSE', payload: expense });
      await saveExpenses([...state.expenses, expense]);
    }
  };

  const addInstallmentExpenses = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const installments = expenseData.installments || 1;
    const currentInstallment = expenseData.currentInstallment || 1;
    const totalAmount = expenseData.amount;
    const baseDate = new Date(expenseData.date);
    const newExpenses: Expense[] = [];

    // Calcular valor da parcela
    let installmentAmount: number;
    if (expenseData.isFinancing && expenseData.interestRate) {
      // Se for financiamento com juros, usar a fórmula da prestação
      const rate = expenseData.interestRate / 100;
      if (rate === 0) {
        installmentAmount = totalAmount / installments;
      } else {
        // Fórmula da prestação
        installmentAmount = totalAmount * (rate * Math.pow(1 + rate, installments)) / (Math.pow(1 + rate, installments) - 1);
      }
    } else {
      // Sem juros, dividir igualmente
      installmentAmount = totalAmount / installments;
    }

    // Calcular a data de início baseada na parcela atual
    // Se estamos na parcela 2, a primeira parcela deve ser do mês anterior
    const startMonthOffset = currentInstallment - 1;
    const startDate = new Date(baseDate);
    startDate.setMonth(baseDate.getMonth() - startMonthOffset);

    for (let i = 0; i < installments; i++) {
      const installmentDate = new Date(startDate);
      installmentDate.setMonth(startDate.getMonth() + i);
      
      const id = `${Date.now()}_${i}`;
      const now = new Date().toISOString();
      
      // Aplicar ajuste mensal se for financiamento
      let finalAmount = installmentAmount;
      if (expenseData.isFinancing && expenseData.monthlyAdjustment) {
        for (let j = 0; j < i; j++) {
          finalAmount = finalAmount * (1 - expenseData.monthlyAdjustment / 100);
        }
      }
      
      // Determinar se a parcela deve ser marcada como paga
      // Parcelas anteriores à atual são pagas
      const isPaid = i < currentInstallment - 1;
      const paidAt = isPaid ? installmentDate.toISOString() : undefined;
      
      const installmentExpense: Expense = {
        ...expenseData,
        id,
        amount: finalAmount,
        date: installmentDate.toISOString(),
        currentInstallment: i + 1,
        title: `${expenseData.title} (${i + 1}/${installments})`,
        isPaid,
        ...(paidAt && { paidAt }),
        createdAt: now,
        updatedAt: now,
      };

      newExpenses.push(installmentExpense);
    }

    // Adicionar todas as parcelas de uma vez
    const updatedExpenses = [...state.expenses, ...newExpenses];
    dispatch({ type: 'SET_EXPENSES', payload: updatedExpenses });
    await saveExpenses(updatedExpenses);
  };

  const addRecurringExpenses = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const baseDate = new Date(expenseData.date);
    const newExpenses: Expense[] = [];
    
    // Criar despesas para os próximos 12 meses (ou mais se necessário)
    const monthsToCreate = 12;
    
    for (let i = 0; i < monthsToCreate; i++) {
      const expenseDate = new Date(baseDate);
      
      // Calcular a data baseada no tipo de recorrência
      switch (expenseData.recurrenceType) {
        case 'weekly':
          expenseDate.setDate(baseDate.getDate() + (i * 7));
          break;
        case 'monthly':
          expenseDate.setMonth(baseDate.getMonth() + i);
          break;
        case 'yearly':
          expenseDate.setFullYear(baseDate.getFullYear() + i);
          break;
        default:
          expenseDate.setMonth(baseDate.getMonth() + i);
      }
      
      const id = `${Date.now()}_recurring_${i}`;
      const now = new Date().toISOString();
      
      const recurringExpense: Expense = {
        ...expenseData,
        id,
        date: expenseDate.toISOString(),
        createdAt: now,
        updatedAt: now,
      };

      newExpenses.push(recurringExpense);
    }

    // Adicionar todas as despesas recorrentes de uma vez
    const updatedExpenses = [...state.expenses, ...newExpenses];
    dispatch({ type: 'SET_EXPENSES', payload: updatedExpenses });
    await saveExpenses(updatedExpenses);
  };

  const updateExpense = async (expense: Expense) => {
    const updatedExpense = {
      ...expense,
      updatedAt: new Date().toISOString(),
    };

    dispatch({ type: 'UPDATE_EXPENSE', payload: updatedExpense });
    const updatedExpenses = state.expenses.map(e => 
      e.id === updatedExpense.id ? updatedExpense : e
    );
    await saveExpenses(updatedExpenses);
  };

  const updateRelatedExpenses = async (expense: Expense, mode: 'single' | 'future' | 'all' | 'all_including_past') => {
    console.log('updateRelatedExpenses chamada:', { mode, expenseTitle: expense.title });
    
    const updatedExpenses: Expense[] = [];
    const currentDate = new Date();

    // Extrair o título base (sem sufixos de parcela)
    const baseTitle = expense.title.replace(/\s*\(\d+\/\d+\)$/, '');
    console.log('Título base:', baseTitle);

    for (const e of state.expenses) {
      // Extrair o título base da despesa atual
      const currentBaseTitle = e.title.replace(/\s*\(\d+\/\d+\)$/, '');
      
      // Se é a despesa principal, sempre atualiza
      if (e.id === expense.id) {
        console.log('Atualizando despesa principal:', e.title);
        updatedExpenses.push(expense);
      } 
      // Se é uma despesa relacionada (mesmo título base)
      else if (currentBaseTitle === baseTitle) {
        console.log('Despesa relacionada encontrada:', e.title);
        
        if (mode === 'single') {
          // Mantém apenas a despesa original inalterada
          console.log('Modo single - mantendo inalterada:', e.title);
          updatedExpenses.push(e);
        } else if (mode === 'future') {
          // Atualiza apenas despesas futuras
          const expenseDate = new Date(e.date);
          if (expenseDate >= currentDate) {
            console.log('Modo future - atualizando:', e.title);
            const updatedRelatedExpense = {
              ...e,
              ...expense,
              id: e.id,
              date: e.date,
              createdAt: e.createdAt,
              updatedAt: new Date().toISOString(),
            };
            updatedExpenses.push(updatedRelatedExpense);
          } else {
            console.log('Modo future - mantendo passada:', e.title);
            updatedExpenses.push(e);
          }
        } else if (mode === 'all') {
          // Atualiza todas as despesas relacionadas
          console.log('Modo all - atualizando:', e.title);
          const updatedRelatedExpense = {
            ...e,
            ...expense,
            id: e.id,
            date: e.date,
            createdAt: e.createdAt,
            updatedAt: new Date().toISOString(),
          };
          updatedExpenses.push(updatedRelatedExpense);
        } else if (mode === 'all_including_past') {
          // Atualiza todas as despesas relacionadas, incluindo passadas
          console.log('Modo all_including_past - atualizando:', e.title);
          const updatedRelatedExpense = {
            ...e,
            ...expense,
            id: e.id,
            date: e.date,
            createdAt: e.createdAt,
            updatedAt: new Date().toISOString(),
          };
          updatedExpenses.push(updatedRelatedExpense);
        }
      } else {
        // Despesas não relacionadas permanecem inalteradas
        updatedExpenses.push(e);
      }
    }

    console.log('Total de despesas atualizadas:', updatedExpenses.length);
    dispatch({ type: 'SET_EXPENSES', payload: updatedExpenses });
    await saveExpenses(updatedExpenses);
  };

  const markAsPaid = async (id: string, isPaid: boolean, paidDate?: string) => {
    const updatedExpenses = state.expenses.map(expense =>
      expense.id === id ? { 
        ...expense, 
        isPaid, 
        paidAt: isPaid ? (paidDate || new Date().toISOString()) : undefined 
      } : expense
    );
    dispatch({ type: 'SET_EXPENSES', payload: updatedExpenses });
    await saveExpenses(updatedExpenses);
  };

  const deleteExpense = async (id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', payload: id });
    const updatedExpenses = state.expenses.filter(e => e.id !== id);
    await saveExpenses(updatedExpenses);
  };

  const calculateFinancingAdjustment = (expense: Expense, months: number): number => {
    if (!expense.isFinancing || !expense.interestRate || !expense.monthlyAdjustment) {
      return expense.amount;
    }

    // Calcula a prestação inicial usando a fórmula de financiamento
    const principal = expense.amount;
    const rate = expense.interestRate / 100;
    const periods = expense.installments || 1;
    
    if (rate === 0) {
      const monthlyPayment = principal / periods;
      let adjustedAmount = monthlyPayment;
      for (let i = 0; i < months; i++) {
        adjustedAmount = adjustedAmount * (1 - expense.monthlyAdjustment / 100);
      }
      return adjustedAmount;
    }
    
    // Fórmula da prestação
    const monthlyPayment = principal * (rate * Math.pow(1 + rate, periods)) / (Math.pow(1 + rate, periods) - 1);
    
    // Aplica a redução mensal dos juros
    let adjustedAmount = monthlyPayment;
    for (let i = 0; i < months; i++) {
      adjustedAmount = adjustedAmount * (1 - expense.monthlyAdjustment / 100);
    }
    
    return adjustedAmount;
  };

  const value: FinanceContextType = {
    state,
    addExpense,
    addInstallmentExpenses,
    addRecurringExpenses,
    duplicateRecurringExpense: async (expense, targetDate) => {
      const newExpense: Expense = {
        ...expense,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        date: targetDate.toISOString(),
      };
      dispatch({ type: 'ADD_EXPENSE', payload: newExpense });
      await saveExpenses([...state.expenses, newExpense]);
    },
    updateExpense,
    updateRelatedExpenses,
    markAsPaid,
    deleteExpense,
    loadExpenses,
    calculateFinancingAdjustment,
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance deve ser usado dentro de um FinanceProvider');
  }
  return context;
}; 