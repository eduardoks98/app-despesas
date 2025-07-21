export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  installmentId?: string;
  installmentNumber?: number;
  paymentMethod?: 'cash' | 'debit' | 'credit' | 'pix';
  tags?: string[];
  isRecurring?: boolean;
  recurringDay?: number;
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