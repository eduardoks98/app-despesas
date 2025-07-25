import axios, { AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Configuração do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar respostas de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Interfaces
interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    plan: 'free' | 'premium';
  };
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: string;
  installmentId?: string;
  subscriptionId?: string;
}

// Serviços da API
export const apiService = {
  // Autenticação
  async login(email: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  async register(email: string, password: string, name: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Transações
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    type?: 'income' | 'expense';
    startDate?: string;
    endDate?: string;
  }): Promise<{
    transactions: Transaction[];
    total: number;
    totalPages: number;
  }> {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  async createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
    const response = await api.post('/transactions', transaction);
    return response.data;
  },

  async updateTransaction(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
    const response = await api.put(`/transactions/${id}`, transaction);
    return response.data;
  },

  async deleteTransaction(id: string): Promise<void> {
    await api.delete(`/transactions/${id}`);
  },

  // Health check
  async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  },
};