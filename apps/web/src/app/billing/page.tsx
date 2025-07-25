'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { stripeApi, formatPrice, PaymentMethod, Invoice } from '@/lib/stripe';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    subscription,
    isSubscribed,
    isTrialing,
    isPremium,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    cancelSubscription,
    manageBilling,
    formatNextBilling,
    getRemainingTrialDays
  } = useSubscription();

  useEffect(() => {
    loadBillingData();
  }, []);

  useEffect(() => {
    // Handle success/error messages from URL params
    const message = searchParams.get('message');
    if (message === 'subscription_canceled') {
      setError(null);
    } else if (message === 'subscription_will_cancel') {
      setError(null);
    }
  }, [searchParams]);

  const loadBillingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [paymentMethodsResponse, invoicesResponse] = await Promise.all([
        stripeApi.getPaymentMethods(),
        stripeApi.getInvoices()
      ]);

      setPaymentMethods(paymentMethodsResponse.paymentMethods);
      setInvoices(invoicesResponse.invoices);
    } catch (err) {
      console.error('Failed to load billing data:', err);
      setError('Falha ao carregar dados de cobrança');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async (immediately: boolean = false) => {
    try {
      setIsUpdating(true);
      await cancelSubscription(immediately);
      await loadBillingData(); // Refresh data
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setIsUpdating(true);
      await manageBilling();
    } catch (err) {
      console.error('Failed to open billing portal:', err);
      setError('Falha ao abrir portal de cobrança');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      active: { variant: 'default' as const, label: 'Ativa', icon: CheckCircle },
      trialing: { variant: 'secondary' as const, label: 'Teste Grátis', icon: Clock },
      canceled: { variant: 'destructive' as const, label: 'Cancelada', icon: XCircle },
      past_due: { variant: 'destructive' as const, label: 'Pagamento Pendente', icon: AlertCircle },
      unpaid: { variant: 'destructive' as const, label: 'Não Paga', icon: AlertCircle }
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

  const getInvoiceStatusBadge = (status: string) => {
    const statusMap = {
      paid: { variant: 'default' as const, label: 'Paga', icon: CheckCircle },
      open: { variant: 'secondary' as const, label: 'Pendente', icon: Clock },
      void: { variant: 'outline' as const, label: 'Cancelada', icon: XCircle },
      uncollectible: { variant: 'destructive' as const, label: 'Incobrável', icon: AlertCircle }
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

  if (subscriptionLoading || isLoading) {
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
          <h1 className="text-3xl font-bold">Cobrança e Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie sua assinatura, métodos de pagamento e faturas
          </p>
        </div>
        
        {isPremium && (
          <Button onClick={handleManageBilling} disabled={isUpdating}>
            <CreditCard className="w-4 h-4 mr-2" />
            Gerenciar Cobrança
          </Button>
        )}
      </div>

      {(error || subscriptionError) && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Erro</span>
          </div>
          <p className="text-sm text-destructive/90 mt-1">
            {error || subscriptionError}
          </p>
        </div>
      )}

      <Tabs defaultValue="subscription" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subscription">Assinatura</TabsTrigger>
          <TabsTrigger value="payment-methods">Métodos de Pagamento</TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Sua Assinatura
                {subscription && getStatusBadge(subscription.status)}
              </CardTitle>
              <CardDescription>
                Status atual da sua assinatura premium
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isPremium ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma assinatura ativa</h3>
                  <p className="text-muted-foreground mb-4">
                    Assine o plano premium para acessar recursos avançados
                  </p>
                  <Button onClick={() => router.push('/upgrade')}>
                    Ver Planos Premium
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Plano Atual</h4>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.items?.[0] ? 
                        `Premium - ${formatPrice(subscription.items[0].amount, subscription.items[0].currency)}` :
                        'Premium'
                      }
                    </p>
                  </div>

                  {isTrialing && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Teste Grátis</h4>
                      <p className="text-sm text-muted-foreground">
                        {getRemainingTrialDays()} dias restantes
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="font-semibold">Próxima Cobrança</h4>
                    <p className="text-sm text-muted-foreground">
                      {formatNextBilling() || 'Não disponível'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold">Status</h4>
                    <p className="text-sm text-muted-foreground">
                      {subscription?.cancelAtPeriodEnd ? 
                        'Será cancelada no final do período' : 
                        'Renovação automática ativa'
                      }
                    </p>
                  </div>
                </div>
              )}

              {isPremium && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={handleManageBilling}
                    disabled={isUpdating}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Gerenciar Pagamento
                  </Button>

                  {subscription && !subscription.cancelAtPeriodEnd && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={isUpdating}>
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar Assinatura
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar sua assinatura? Você manterá 
                            acesso aos recursos premium até {formatNextBilling()}.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Manter Assinatura</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleCancelSubscription(false)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Cancelar no Final do Período
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
              <CardDescription>
                Gerencie seus cartões e métodos de pagamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum método de pagamento</h3>
                  <p className="text-muted-foreground mb-4">
                    Adicione um cartão para gerenciar sua assinatura
                  </p>
                  <Button onClick={handleManageBilling} disabled={isUpdating}>
                    Adicionar Método de Pagamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div 
                      key={method.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {method.card ? 
                              `${method.card.brand.toUpperCase()} """" ${method.card.last4}` :
                              method.type.toUpperCase()
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {method.card && 
                              `Expira em ${String(method.card.expMonth).padStart(2, '0')}/${method.card.expYear}`
                            }
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleManageBilling}
                        disabled={isUpdating}
                      >
                        Gerenciar
                      </Button>
                    </div>
                  ))}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleManageBilling}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Adicionar Novo Método
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Faturas</CardTitle>
              <CardDescription>
                Visualize e baixe suas faturas anteriores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma fatura encontrada</h3>
                  <p className="text-muted-foreground">
                    Suas faturas aparecerão aqui após os pagamentos
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-12 bg-gradient-to-b from-primary to-primary/50 rounded" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">Fatura #{invoice.number}</p>
                            {getInvoiceStatusBadge(invoice.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Intl.DateTimeFormat('pt-BR').format(new Date(invoice.created * 1000))}
                          </p>
                          <p className="text-lg font-semibold text-primary">
                            {formatPrice(invoice.amountPaid || invoice.amountDue, invoice.currency)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {invoice.hostedInvoiceUrl && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                          >
                            Visualizar
                          </Button>
                        )}
                        {invoice.invoicePdf && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(invoice.invoicePdf, '_blank')}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}