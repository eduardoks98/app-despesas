import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession, signOut } from 'next-auth/react';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const session = await getSession();
        
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Try to refresh token
          const session = await getSession();
          
          if (session?.error === 'RefreshAccessTokenError') {
            // Refresh token is invalid, sign out
            signOut({ callbackUrl: '/auth/login' });
            return Promise.reject(error);
          }

          // If we have a valid session, retry the request
          if (session?.accessToken) {
            originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
            return this.api(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic request methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.put(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.patch(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.api.delete(url, config);
    return response.data;
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.post('/auth/login', credentials);
  }

  async register(userData: { name: string; email: string; password: string }) {
    return this.post('/auth/register', userData);
  }

  async refreshToken(refreshToken: string) {
    return this.post('/auth/refresh', { refreshToken });
  }

  async logout(refreshToken: string) {
    return this.post('/auth/logout', { refreshToken });
  }

  // User endpoints
  async getProfile() {
    return this.get('/users/profile');
  }

  async updateProfile(data: any) {
    return this.patch('/users/profile', data);
  }

  // Transactions endpoints
  async getTransactions(params?: any) {
    return this.get('/transactions', { params });
  }

  async getTransaction(id: string) {
    return this.get(`/transactions/${id}`);
  }

  async createTransaction(data: any) {
    return this.post('/transactions', data);
  }

  async updateTransaction(id: string, data: any) {
    return this.put(`/transactions/${id}`, data);
  }

  async deleteTransaction(id: string) {
    return this.delete(`/transactions/${id}`);
  }

  // Categories endpoints
  async getCategories() {
    return this.get('/categories');
  }

  async createCategory(data: any) {
    return this.post('/categories', data);
  }

  async updateCategory(id: string, data: any) {
    return this.put(`/categories/${id}`, data);
  }

  async deleteCategory(id: string) {
    return this.delete(`/categories/${id}`);
  }

  // Reports endpoints (Premium)
  async getAdvancedReport(filters: any) {
    return this.post('/reports/advanced', filters);
  }

  async getCategoryReport(filters: any) {
    return this.post('/reports/categories', filters);
  }

  async getSpendingPatterns(filters: any) {
    return this.post('/reports/patterns', filters);
  }

  async getForecast(filters: any) {
    return this.post('/reports/forecast', filters);
  }

  // Export endpoints (Premium)
  async exportData(options: any) {
    return this.post('/export', options, {
      responseType: 'blob',
    });
  }

  // Backup endpoints (Premium)
  async createBackup() {
    return this.post('/backups');
  }

  async getBackups() {
    return this.get('/backups');
  }

  async restoreBackup(backupId: string) {
    return this.post(`/backups/${backupId}/restore`);
  }

  async deleteBackup(backupId: string) {
    return this.delete(`/backups/${backupId}`);
  }

  // Subscription endpoints
  async getSubscription() {
    return this.get('/subscriptions/current');
  }

  async createSubscription(priceId: string) {
    return this.post('/subscriptions', { priceId });
  }

  async cancelSubscription() {
    return this.post('/subscriptions/cancel');
  }

  async reactivateSubscription() {
    return this.post('/subscriptions/reactivate');
  }

  async changePlan(priceId: string) {
    return this.post('/subscriptions/change-plan', { priceId });
  }

  // Sync endpoints
  async syncData(data: any) {
    return this.post('/sync', data);
  }

  async getLastSync() {
    return this.get('/sync/status');
  }
}

export const apiService = new ApiService();
export default apiService;