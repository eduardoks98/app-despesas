export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  installmentId?: string;
  installmentNumber?: number;
  subscriptionId?: string; // Vincula a uma assinatura
  paymentMethod?: 'cash' | 'debit' | 'credit' | 'pix';
  tags?: string[];
  isRecurring?: boolean;
  recurringDay?: number;
  isPaid?: boolean; // Se a transação foi paga/recebida
  paidDate?: string; // Data em que foi efetivamente paga/recebida
}

export interface Installment {
  id: string;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  currentInstallment: number;
  installmentValue: number;
  startDate: string;
  endDate: string;
  category: string;
  store: string;
  status: 'active' | 'completed' | 'cancelled';
  paidInstallments: number[];
  paymentMethod: 'credit' | 'boleto' | 'other';
  notes?: string;
}

export interface Subscription {
  id: string;
  name: string;
  description?: string;
  amount: number;
  category: string;
  billingDay: number; // Dia do mês para cobrança (1-31)
  status: 'active' | 'paused' | 'cancelled';
  startDate: string;
  lastPaymentDate?: string;
  nextPaymentDate: string;
  paymentMethod: 'credit' | 'debit' | 'pix' | 'boleto';
  tags?: string[];
  reminder?: boolean; // Lembrete de pagamento
  reminderDays?: number; // Dias antes para lembrar
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
  budget?: number;
  isCustom: boolean;
}

export interface MonthlyBalance {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  installmentsDue: number;
  installmentsPaid: number;
}

export interface UserPreferences {
  currency: string;
  language: string;
  hideValues: boolean;
  enableNotifications: boolean;
  notificationTime?: string;
  biometricEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}