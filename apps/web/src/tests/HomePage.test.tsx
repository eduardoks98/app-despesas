import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HomePage } from '../pages/HomePage';
import { apiService } from '../services/api';

// Mock da API
jest.mock('../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock do CSS modules
jest.mock('../pages/HomePage.module.css', () => ({
  container: 'container',
  header: 'header',
  title: 'title',
  subtitle: 'subtitle',
  loading: 'loading',
  spinner: 'spinner',
  grid: 'grid',
  summaryCard: 'summaryCard',
  transactionsCard: 'transactionsCard',
  premiumCard: 'premiumCard',
  emptyState: 'emptyState',
  emptyText: 'emptyText',
}));

describe('HomePage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('should render loading state initially', () => {
    mockApiService.getTransactions.mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<HomePage />);

    expect(screen.getByText('Carregando dashboard...')).toBeInTheDocument();
  });

  it('should render dashboard with transactions', async () => {
    const mockTransactions = {
      transactions: [
        {
          id: '1',
          amount: 100,
          type: 'expense' as const,
          category: 'Alimentação',
          description: 'Almoço',
          date: new Date().toISOString(),
        },
        {
          id: '2',
          amount: 500,
          type: 'income' as const,
          category: 'Salário',
          description: 'Freelance',
          date: new Date().toISOString(),
        },
      ],
      total: 2,
    };

    mockApiService.getTransactions.mockResolvedValue(mockTransactions);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    expect(screen.getByText('Bem-vindo ao seu controle financeiro inteligente')).toBeInTheDocument();
    expect(screen.getByText('Resumo Mensal')).toBeInTheDocument();
    expect(screen.getByText('Transações Recentes')).toBeInTheDocument();
    expect(screen.getByText('Recursos Premium')).toBeInTheDocument();
  });

  it('should show empty state when no transactions', async () => {
    const mockTransactions = {
      transactions: [],
      total: 0,
    };

    mockApiService.getTransactions.mockResolvedValue(mockTransactions);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma transação encontrada')).toBeInTheDocument();
    });

    expect(screen.getByText('Comece adicionando suas primeiras transações')).toBeInTheDocument();
  });

  it('should display transaction data correctly', async () => {
    const mockTransactions = {
      transactions: [
        {
          id: '1',
          amount: 150.50,
          type: 'expense' as const,
          category: 'Alimentação',
          description: 'Restaurante',
          date: new Date().toISOString(),
        },
      ],
      total: 1,
    };

    mockApiService.getTransactions.mockResolvedValue(mockTransactions);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Restaurante')).toBeInTheDocument();
    });

    expect(screen.getByText('Alimentação')).toBeInTheDocument();
    expect(screen.getByText('- R$ 150,50')).toBeInTheDocument();
  });

  it('should display premium features', async () => {
    const mockTransactions = {
      transactions: [],
      total: 0,
    };

    mockApiService.getTransactions.mockResolvedValue(mockTransactions);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('Recursos Premium')).toBeInTheDocument();
    });

    expect(screen.getByText('Sincronização em nuvem')).toBeInTheDocument();
    expect(screen.getByText('Conta conjunta/família')).toBeInTheDocument();
    expect(screen.getByText('Acesso web e mobile')).toBeInTheDocument();
    expect(screen.getByText('Relatórios avançados')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    mockApiService.getTransactions.mockRejectedValue(
      new Error('API Error')
    );

    renderWithProviders(<HomePage />);

    // O React Query deve lidar com o erro, mas ainda renderizar algo
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('should format currency values correctly', async () => {
    const mockTransactions = {
      transactions: [
        {
          id: '1',
          amount: 1234.56,
          type: 'income' as const,
          category: 'Salário',
          description: 'Pagamento mensal',
          date: new Date().toISOString(),
        },
      ],
      total: 1,
    };

    mockApiService.getTransactions.mockResolvedValue(mockTransactions);

    renderWithProviders(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('+ R$ 1234,56')).toBeInTheDocument();
    });
  });
});