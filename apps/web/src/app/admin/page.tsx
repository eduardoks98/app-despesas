'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  DollarSign, 
  CreditCard, 
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Interfaces for admin data
interface AdminStats {
  totalUsers: number;
  premiumUsers: number;
  trialUsers: number;
  monthlyRevenue: number;
  conversionRate: number;
  churnRate: number;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  joinDate: string;
  lastActive: string;
  revenue: number;
}

interface SubscriptionAnalytics {
  newSubscriptions: number[];
  cancellations: number[];
  revenue: number[];
  labels: string[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock data - in real implementation, these would be API calls
      const mockStats: AdminStats = {
        totalUsers: 2847,
        premiumUsers: 892,
        trialUsers: 234,
        monthlyRevenue: 127450,
        conversionRate: 18.5,
        churnRate: 3.2
      };

      const mockUsers: UserInfo[] = Array.from({ length: 50 }, (_, i) => ({
        id: `user_${i + 1}`,
        name: `Usuário ${i + 1}`,
        email: `usuario${i + 1}@exemplo.com`,
        subscriptionStatus: ['active', 'trialing', 'canceled', 'past_due'][Math.floor(Math.random() * 4)],
        subscriptionPlan: ['premium', 'basic'][Math.floor(Math.random() * 2)],
        joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        revenue: Math.floor(Math.random() * 500) + 50
      }));

      const mockAnalytics: SubscriptionAnalytics = {
        newSubscriptions: [45, 52, 38, 67, 89, 72, 95, 103, 87, 91, 105, 98],
        cancellations: [12, 8, 15, 22, 18, 25, 19, 16, 21, 14, 17, 20],
        revenue: [42500, 48200, 39800, 67300, 89100, 72800, 95600, 103400, 87200, 91500, 105300, 98700],
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      };

      setStats(mockStats);
      setUsers(mockUsers);
      setAnalytics(mockAnalytics);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setError('Falha ao carregar dados administrativos');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: 'default' as const, label: 'Ativo', icon: CheckCircle },
      trialing: { variant: 'secondary' as const, label: 'Teste', icon: Calendar },
      canceled: { variant: 'destructive' as const, label: 'Cancelado', icon: XCircle },
      past_due: { variant: 'destructive' as const, label: 'Pendente', icon: AlertCircle }
    };

    const config = statusMap[status as keyof typeof statusMap] || { 
      variant: 'outline' as const, 
      label: status, 
      icon: AlertCircle 
    };

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'all' || user.subscriptionStatus === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
          <p className="text-muted-foreground">
            Visão geral e gerenciamento da plataforma
          </p>
        </div>
        
        <Button onClick={loadAdminData} disabled={isLoading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Erro</span>
          </div>
          <p className="text-sm text-destructive/90 mt-1">{error}</p>
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {stats.premiumUsers} premium, {stats.trialUsers} em teste
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +12.5% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.churnRate}%</div>
              <p className="text-xs text-muted-foreground">
                -0.5% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Novas Assinaturas vs Cancelamentos</CardTitle>
                  <CardDescription>Evolução mensal</CardDescription>
                </CardHeader>
                <CardContent>
                  <Line 
                    data={{
                      labels: analytics.labels,
                      datasets: [
                        {
                          label: 'Novas Assinaturas',
                          data: analytics.newSubscriptions,
                          borderColor: 'rgb(139, 92, 246)',
                          backgroundColor: 'rgba(139, 92, 246, 0.1)',
                          tension: 0.1
                        },
                        {
                          label: 'Cancelamentos',
                          data: analytics.cancellations,
                          borderColor: 'rgb(239, 68, 68)',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          tension: 0.1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Receita Mensal</CardTitle>
                  <CardDescription>Evolução da receita em R$</CardDescription>
                </CardHeader>
                <CardContent>
                  <Bar 
                    data={{
                      labels: analytics.labels,
                      datasets: [
                        {
                          label: 'Receita (R$)',
                          data: analytics.revenue,
                          backgroundColor: 'rgba(139, 92, 246, 0.8)',
                          borderColor: 'rgb(139, 92, 246)',
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'top' as const,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return 'R$ ' + value.toLocaleString();
                            }
                          }
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Status</CardTitle>
                  <CardDescription>Status das assinaturas</CardDescription>
                </CardHeader>
                <CardContent>
                  <Doughnut 
                    data={{
                      labels: ['Ativo', 'Teste', 'Cancelado', 'Pendente'],
                      datasets: [
                        {
                          data: [65, 15, 12, 8],
                          backgroundColor: [
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(239, 68, 68, 0.8)',
                            'rgba(245, 158, 11, 0.8)'
                          ],
                          borderColor: [
                            'rgb(34, 197, 94)',
                            'rgb(59, 130, 246)',
                            'rgb(239, 68, 68)',
                            'rgb(245, 158, 11)'
                          ],
                          borderWidth: 1
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom' as const,
                        }
                      }
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Métricas de Crescimento</CardTitle>
                  <CardDescription>Indicadores principais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">LTV (Lifetime Value)</span>
                    <span className="text-lg font-bold text-green-600">R$ 2.847</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">CAC (Customer Acquisition Cost)</span>
                    <span className="text-lg font-bold text-blue-600">R$ 142</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">LTV/CAC Ratio</span>
                    <span className="text-lg font-bold text-purple-600">20:1</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Payback Period</span>
                    <span className="text-lg font-bold text-orange-600">4.2 meses</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Lista e status de todos os usuários da plataforma
              </CardDescription>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativo</option>
                  <option value="trialing">Teste</option>
                  <option value="canceled">Cancelado</option>
                  <option value="past_due">Pendente</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.slice(0, 20).map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Entrou em {formatDate(user.joinDate)} • Último acesso: {formatDate(user.lastActive)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(user.revenue)}</p>
                        <p className="text-sm text-muted-foreground">{user.subscriptionPlan}</p>
                      </div>
                      {getStatusBadge(user.subscriptionStatus)}
                    </div>
                  </div>
                ))}
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Assinaturas</CardTitle>
              <CardDescription>
                Análise detalhada das assinaturas ativas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-medium">Assinaturas Ativas</span>
                  </div>
                  <p className="text-2xl font-bold">892</p>
                  <p className="text-sm text-muted-foreground">+15% este mês</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Testes Grátis</span>
                  </div>
                  <p className="text-2xl font-bold">234</p>
                  <p className="text-sm text-muted-foreground">18% convertem</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium">Cancelamentos</span>
                  </div>
                  <p className="text-2xl font-bold">47</p>
                  <p className="text-sm text-muted-foreground">3.2% churn rate</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-3">
                <h4 className="font-semibold">Próximas Renovações</h4>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">usuario{i + 1}@exemplo.com</p>
                      <p className="text-sm text-muted-foreground">
                        Plano Premium • Renova em {new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <Badge variant="outline">R$ 99,90/mês</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}