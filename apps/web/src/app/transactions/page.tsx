'use client';

import { useState, useMemo } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  tags?: string[];
  notes?: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data - this would come from your API
  const transactions: Transaction[] = [
    {
      id: '1',
      description: 'Supermercado ABC',
      amount: -125.50,
      type: 'expense',
      category: 'Alimentação',
      date: '2024-01-15',
      tags: ['mercado', 'essencial'],
      notes: 'Compras da semana',
      status: 'completed',
    },
    {
      id: '2',
      description: 'Salário Janeiro',
      amount: 4500.00,
      type: 'income',
      category: 'Salário',
      date: '2024-01-01',
      status: 'completed',
    },
    {
      id: '3',
      description: 'Farmácia Central',
      amount: -45.30,
      type: 'expense',
      category: 'Saúde',
      date: '2024-01-14',
      status: 'completed',
    },
    {
      id: '4',
      description: 'Freelance Design',
      amount: 800.00,
      type: 'income',
      category: 'Freelance',
      date: '2024-01-13',
      tags: ['trabalho', 'extra'],
      status: 'pending',
    },
    {
      id: '5',
      description: 'Conta de Luz',
      amount: -220.75,
      type: 'expense',
      category: 'Utilidades',
      date: '2024-01-12',
      status: 'completed',
    },
    {
      id: '6',
      description: 'Uber para trabalho',
      amount: -25.80,
      type: 'expense',
      category: 'Transporte',
      date: '2024-01-11',
      status: 'completed',
    },
  ];

  const categories = ['all', 'Alimentação', 'Salário', 'Saúde', 'Freelance', 'Utilidades', 'Transporte'];

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter((transaction) => {
      const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      const matchesType = selectedType === 'all' || transaction.type === selectedType;
      
      return matchesSearch && matchesCategory && matchesType;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, selectedCategory, selectedType, sortBy, sortOrder]);

  const totalIncome = transactions
    .filter(t => t.type === 'income' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  const handleSort = (field: 'date' | 'amount' | 'description') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const viewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
              Transações
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Gerencie suas receitas e despesas
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <Button size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowUpIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Receitas
                  </dt>
                  <dd className="text-2xl font-semibold text-green-600">
                    R$ {totalIncome.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowDownIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Despesas
                  </dt>
                  <dd className="text-2xl font-semibold text-red-600">
                    R$ {totalExpenses.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`h-6 w-6 rounded-full ${balance >= 0 ? 'bg-green-400' : 'bg-red-400'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Saldo
                  </dt>
                  <dd className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    R$ {balance.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <Input
                type="text"
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                icon={<MagnifyingGlassIcon className="h-4 w-4" />}
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === 'all' ? 'Todas Categorias' : category}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">Todos os Tipos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
            </select>

            <Button variant="outline" size="sm">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </Card>

        {/* Transactions Table */}
        <Card>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Transações ({filteredAndSortedTransactions.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Descrição</span>
                      {sortBy === 'description' && (
                        sortOrder === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4" /> : 
                        <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Valor</span>
                      {sortBy === 'amount' && (
                        sortOrder === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4" /> : 
                        <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Data</span>
                      {sortBy === 'date' && (
                        sortOrder === 'asc' ? 
                        <ArrowUpIcon className="h-4 w-4" /> : 
                        <ArrowDownIcon className="h-4 w-4" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAndSortedTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            {transaction.type === 'income' ? (
                              <ArrowUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowDownIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {transaction.description}
                          </div>
                          {transaction.tags && transaction.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {transaction.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline" size="sm">
                        {transaction.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {Math.abs(transaction.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(transaction.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={
                          transaction.status === 'completed' ? 'success' : 
                          transaction.status === 'pending' ? 'warning' : 'error'
                        }
                        size="sm"
                      >
                        {transaction.status === 'completed' ? 'Concluída' :
                         transaction.status === 'pending' ? 'Pendente' : 'Cancelada'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewTransaction(transaction)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredAndSortedTransactions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400">
                <MagnifyingGlassIcon className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma transação encontrada</h3>
                <p>Tente ajustar os filtros ou adicione uma nova transação.</p>
              </div>
            </div>
          )}
        </Card>

        {/* Transaction Detail Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Detalhes da Transação"
        >
          {selectedTransaction && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {selectedTransaction.description}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Valor
                  </label>
                  <p className={`text-lg font-semibold ${
                    selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedTransaction.type === 'income' ? '+' : '-'}R$ {Math.abs(selectedTransaction.amount).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Categoria
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedTransaction.category}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Data
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(selectedTransaction.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <Badge 
                    variant={
                      selectedTransaction.status === 'completed' ? 'success' : 
                      selectedTransaction.status === 'pending' ? 'warning' : 'error'
                    }
                    size="sm"
                  >
                    {selectedTransaction.status === 'completed' ? 'Concluída' :
                     selectedTransaction.status === 'pending' ? 'Pendente' : 'Cancelada'}
                  </Badge>
                </div>
              </div>

              {selectedTransaction.tags && selectedTransaction.tags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTransaction.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notas
                  </label>
                  <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                    {selectedTransaction.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Fechar
                </Button>
                <Button>
                  Editar
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}