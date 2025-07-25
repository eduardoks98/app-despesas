'use client';

import { useState, useMemo } from 'react';
import { 
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TagIcon,
  ChartBarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, Input, Modal } from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';
import { CategoryDistributionChart } from '@/components/charts';

interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  isDefault: boolean;
  isPremium: boolean;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
  totalAmount: number;
  monthlyAverage: number;
  subcategories?: Category[];
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
  parentId?: string;
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'both'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: '=°',
    type: 'expense',
  });

  // Mock data - this would come from your API
  const categories: Category[] = [
    {
      id: '1',
      name: 'Alimentação',
      description: 'Gastos com comida, restaurantes e delivery',
      color: '#10B981',
      icon: '<}',
      type: 'expense',
      isDefault: true,
      isPremium: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-15',
      transactionCount: 25,
      totalAmount: 1250.30,
      monthlyAverage: 1180.50,
      subcategories: [
        {
          id: '1a',
          name: 'Supermercado',
          color: '#059669',
          icon: '=Ò',
          type: 'expense',
          isDefault: false,
          isPremium: false,
          parentId: '1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
          transactionCount: 15,
          totalAmount: 800.20,
          monthlyAverage: 750.00,
        },
        {
          id: '1b',
          name: 'Restaurantes',
          color: '#047857',
          icon: '<U',
          type: 'expense',
          isDefault: false,
          isPremium: false,
          parentId: '1',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
          transactionCount: 10,
          totalAmount: 450.10,
          monthlyAverage: 430.50,
        },
      ],
    },
    {
      id: '2',
      name: 'Transporte',
      description: 'Gastos com combustível, transporte público e viagens',
      color: '#3B82F6',
      icon: '=—',
      type: 'expense',
      isDefault: true,
      isPremium: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-14',
      transactionCount: 18,
      totalAmount: 650.80,
      monthlyAverage: 620.00,
    },
    {
      id: '3',
      name: 'Salário',
      description: 'Receitas do trabalho principal',
      color: '#10B981',
      icon: '=¼',
      type: 'income',
      isDefault: true,
      isPremium: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      transactionCount: 1,
      totalAmount: 4500.00,
      monthlyAverage: 4500.00,
    },
    {
      id: '4',
      name: 'Freelance',
      description: 'Receitas de trabalhos extras e projetos',
      color: '#8B5CF6',
      icon: '=»',
      type: 'income',
      isDefault: false,
      isPremium: true,
      createdAt: '2024-01-05',
      updatedAt: '2024-01-13',
      transactionCount: 3,
      totalAmount: 1200.00,
      monthlyAverage: 950.00,
    },
    {
      id: '5',
      name: 'Saúde',
      description: 'Gastos com medicamentos, consultas e planos de saúde',
      color: '#EF4444',
      icon: '<å',
      type: 'expense',
      isDefault: true,
      isPremium: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-14',
      transactionCount: 5,
      totalAmount: 380.20,
      monthlyAverage: 350.00,
    },
    {
      id: '6',
      name: 'Lazer',
      description: 'Entretenimento, cinema, jogos e hobbies',
      color: '#F59E0B',
      icon: '<®',
      type: 'expense',
      isDefault: true,
      isPremium: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-12',
      transactionCount: 8,
      totalAmount: 420.90,
      monthlyAverage: 400.00,
    },
    {
      id: '7',
      name: 'Investimentos',
      description: 'Ações, fundos e outras aplicações financeiras',
      color: '#059669',
      icon: '=È',
      type: 'both',
      isDefault: false,
      isPremium: true,
      createdAt: '2024-01-03',
      updatedAt: '2024-01-10',
      transactionCount: 4,
      totalAmount: 800.00,
      monthlyAverage: 750.00,
    },
  ];

  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ];

  const icons = [
    '=°', '<}', '=—', '<à', '=Ò', '=¼', '<å', '<®', '=ñ', '=U',
    '', '=Ú', '<µ', '=»', '¡', '=§', '=È', '<¯', '='', '<¨'
  ];

  // Filter categories
  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           category.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = selectedType === 'all' || category.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  }, [categories, searchTerm, selectedType]);

  // Calculate statistics
  const totalCategories = categories.length;
  const customCategories = categories.filter(c => !c.isDefault).length;
  const premiumCategories = categories.filter(c => c.isPremium).length;
  const totalTransactions = categories.reduce((sum, c) => sum + c.transactionCount, 0);

  // Prepare chart data
  const chartData = {
    labels: filteredCategories.filter(c => c.type === 'expense').map(c => c.name),
    values: filteredCategories.filter(c => c.type === 'expense').map(c => c.totalAmount),
    colors: filteredCategories.filter(c => c.type === 'expense').map(c => c.color),
  };

  const handleViewCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsViewModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon,
      type: category.type,
      parentId: category.parentId,
    });
    setIsEditing(true);
    setIsFormModalOpen(true);
  };

  const handleNewCategory = () => {
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: '=°',
      type: 'expense',
    });
    setIsEditing(false);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = () => {
    // Here you would submit to your API
    console.log('Submitting category:', formData);
    setIsFormModalOpen(false);
  };

  const CategoryCard = ({ category }: { category: Category }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
            style={{ backgroundColor: category.color }}
          >
            {category.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600">
              {category.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <Badge 
                variant={category.type === 'income' ? 'success' : category.type === 'expense' ? 'error' : 'info'}
                size="sm"
              >
                {category.type === 'income' ? 'Receita' : category.type === 'expense' ? 'Despesa' : 'Ambos'}
              </Badge>
              {category.isPremium && (
                <Badge variant="warning" size="sm">
                  <StarIcon className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
              {category.isDefault && (
                <Badge variant="secondary" size="sm">
                  Padrão
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewCategory(category);
            }}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditCategory(category);
            }}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          {!category.isDefault && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle delete
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {category.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
          {category.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Transações
          </p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {category.transactionCount}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Total
          </p>
          <p className={`text-lg font-semibold ${
            category.type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}>
            R$ {category.totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {category.subcategories && category.subcategories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Subcategorias ({category.subcategories.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {category.subcategories.slice(0, 3).map((sub) => (
              <Badge key={sub.id} variant="outline" size="sm">
                {sub.icon} {sub.name}
              </Badge>
            ))}
            {category.subcategories.length > 3 && (
              <Badge variant="secondary" size="sm">
                +{category.subcategories.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}
    </Card>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
              Categorias
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Organize suas transações por categoria
            </p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
            <Button variant="outline" size="sm">
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Relatório
            </Button>
            <Button size="sm" onClick={handleNewCategory}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TagIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Total Categorias
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {totalCategories}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PlusIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Personalizadas
                  </dt>
                  <dd className="text-2xl font-semibold text-green-600">
                    {customCategories}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <StarIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Premium
                  </dt>
                  <dd className="text-2xl font-semibold text-yellow-600">
                    {premiumCategories}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                    Transações
                  </dt>
                  <dd className="text-2xl font-semibold text-purple-600">
                    {totalTransactions}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Controls */}
        <Card className="p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-0">
                <Input
                  type="text"
                  placeholder="Buscar categorias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full min-w-[200px]"
                  icon={<MagnifyingGlassIcon className="h-4 w-4" />}
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="all">Todos os Tipos</option>
                <option value="income">Receitas</option>
                <option value="expense">Despesas</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Lista
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories */}
          <div className="lg:col-span-2">
            <Card>
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Categorias ({filteredCategories.length})
                </h3>
              </div>
              
              <div className="p-6">
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredCategories.map((category) => (
                      <CategoryCard key={category.id} category={category} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredCategories.map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.icon}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {category.name}
                            </h4>
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                              <span>{category.transactionCount} transações</span>
                              <span>"</span>
                              <span>R$ {category.totalAmount.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={category.type === 'income' ? 'success' : category.type === 'expense' ? 'error' : 'info'}
                            size="sm"
                          >
                            {category.type === 'income' ? 'Receita' : category.type === 'expense' ? 'Despesa' : 'Ambos'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCategory(category)}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">
                      <TagIcon className="mx-auto h-12 w-12 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhuma categoria encontrada</h3>
                      <p className="mb-4">Tente ajustar os filtros ou crie uma nova categoria.</p>
                      <Button onClick={handleNewCategory}>
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Criar Categoria
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Chart */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Distribuição de Gastos
              </h3>
              
              {chartData.labels.length > 0 ? (
                <CategoryDistributionChart 
                  data={chartData}
                  height={400}
                />
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <ChartBarIcon className="mx-auto h-12 w-12 mb-2" />
                    <p>Sem dados para exibir</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Category Detail Modal */}
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Detalhes da Categoria"
        >
          {selectedCategory && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl"
                  style={{ backgroundColor: selectedCategory.color }}
                >
                  {selectedCategory.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedCategory.name}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant={selectedCategory.type === 'income' ? 'success' : selectedCategory.type === 'expense' ? 'error' : 'info'}
                      size="sm"
                    >
                      {selectedCategory.type === 'income' ? 'Receita' : selectedCategory.type === 'expense' ? 'Despesa' : 'Ambos'}
                    </Badge>
                    {selectedCategory.isPremium && (
                      <Badge variant="warning" size="sm">
                        <StarIcon className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedCategory.description && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Descrição</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedCategory.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Estatísticas</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Transações:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">{selectedCategory.transactionCount}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Total:</dt>
                      <dd className={`text-sm font-medium ${
                        selectedCategory.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        R$ {selectedCategory.totalAmount.toFixed(2)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Média mensal:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        R$ {selectedCategory.monthlyAverage.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informações</h4>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Criada:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedCategory.createdAt).toLocaleDateString('pt-BR')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Atualizada:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(selectedCategory.updatedAt).toLocaleDateString('pt-BR')}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Tipo:</dt>
                      <dd className="text-sm font-medium text-gray-900 dark:text-white">
                        {selectedCategory.isDefault ? 'Padrão' : 'Personalizada'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Subcategorias ({selectedCategory.subcategories.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedCategory.subcategories.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                            style={{ backgroundColor: sub.color }}
                          >
                            {sub.icon}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {sub.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {sub.transactionCount} transações
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            R$ {sub.totalAmount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditCategory(selectedCategory);
                }}>
                  Editar
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Category Form Modal */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          title={isEditing ? 'Editar Categoria' : 'Nova Categoria'}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome da categoria"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da categoria"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-gray-400' : 'border-gray-200 dark:border-gray-600'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ícone
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {icons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      className={`w-8 h-8 rounded border ${
                        formData.icon === icon 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900' 
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setFormData({ ...formData, icon })}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitForm}>
                {isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}