'use client';

import { useState } from 'react';
import { 
  CheckIcon,
  XMarkIcon,
  StarIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  CloudIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  DocumentArrowDownIcon,
  TagIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Card, Badge, Button, Modal } from '@/components/ui';
import { AppLayout } from '@/components/layout/AppLayout';

interface PlanFeature {
  name: string;
  free: boolean | string;
  premium: boolean | string;
  description?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: any;
  recommended?: boolean;
}

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  const features: PlanFeature[] = [
    {
      name: 'Transações ilimitadas',
      free: 'Até 100/mês',
      premium: true,
      description: 'Registre quantas transações quiser sem limitações'
    },
    {
      name: 'Categorias personalizadas',
      free: 'Até 5',
      premium: 'Ilimitadas',
      description: 'Crie suas próprias categorias para organizar melhor suas finanças'
    },
    {
      name: 'Relatórios avançados',
      free: false,
      premium: true,
      description: 'Gráficos detalhados, tendências e insights financeiros'
    },
    {
      name: 'Backup na nuvem',
      free: false,
      premium: true,
      description: 'Sincronização automática entre dispositivos'
    },
    {
      name: 'Exportação de dados',
      free: false,
      premium: true,
      description: 'Exporte seus dados em PDF, Excel ou CSV'
    },
    {
      name: 'Tags e notas',
      free: false,
      premium: true,
      description: 'Adicione tags e notas detalhadas às suas transações'
    },
    {
      name: 'Acesso via web',
      free: false,
      premium: true,
      description: 'Acesse suas finanças de qualquer computador'
    },
    {
      name: 'Suporte prioritário',
      free: 'Email básico',
      premium: 'Chat e email prioritário',
      description: 'Atendimento rápido e personalizado'
    },
    {
      name: 'Metas financeiras',
      free: false,
      premium: true,
      description: 'Defina e acompanhe suas metas de economia'
    },
    {
      name: 'Previsões inteligentes',
      free: false,
      premium: true,
      description: 'IA que analisa seus gastos e sugere melhorias'
    },
  ];

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'pix',
      name: 'PIX',
      description: 'Pagamento instantâneo com desconto de 10%',
      icon: CreditCardIcon,
      recommended: true
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo e American Express',
      icon: CreditCardIcon
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      description: 'Vencimento em até 3 dias úteis',
      icon: DocumentArrowDownIcon
    }
  ];

  const pricing = {
    monthly: {
      price: 19.90,
      discount: 0,
      period: 'mês'
    },
    annual: {
      price: 199.00,
      discount: 20,
      period: 'ano',
      monthlyEquivalent: 16.58
    }
  };

  const currentPlan = pricing[selectedPlan];
  const savings = selectedPlan === 'annual' ? 
    (pricing.monthly.price * 12) - pricing.annual.price : 0;

  const handleUpgrade = () => {
    setIsPaymentModalOpen(true);
  };

  const handlePayment = () => {
    if (!selectedPaymentMethod) return;
    
    // Here you would integrate with your payment provider
    console.log('Processing payment with:', selectedPaymentMethod);
    alert('Processando pagamento... Redirecionando para o checkout.');
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Desbloqueie o Poder Premium
          </h1>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Transforme sua gestão financeira com recursos avançados, relatórios inteligentes 
            e sincronização em todos os seus dispositivos.
          </p>
        </div>

        {/* Current Plan Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" size="lg" className="px-4 py-2">
            =ñ Plano Atual: Gratuito
          </Badge>
        </div>

        {/* Pricing Toggle */}
        <div className="flex justify-center">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${
                  selectedPlan === 'monthly'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setSelectedPlan('annual')}
                className={`px-8 py-3 rounded-lg text-sm font-medium transition-all relative ${
                  selectedPlan === 'annual'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Anual
                <Badge variant="success" size="sm" className="absolute -top-2 -right-2">
                  -20%
                </Badge>
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <Card className="p-8 border-2 border-primary-200 dark:border-primary-800 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-900">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-2">
                <StarIcon className="h-8 w-8 text-yellow-500 mr-2" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Premium
                </h3>
              </div>
              
              <div className="mb-4">
                <span className="text-5xl font-bold text-gray-900 dark:text-white">
                  R$ {currentPlan.price.toFixed(2)}
                </span>
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  /{currentPlan.period}
                </span>
              </div>

              {selectedPlan === 'annual' && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Equivale a R$ {pricing.annual.monthlyEquivalent.toFixed(2)}/mês
                  </div>
                  <Badge variant="success" size="sm">
                    =° Economize R$ {savings.toFixed(2)} por ano
                  </Badge>
                </div>
              )}
            </div>

            <Button 
              className="w-full mb-4 text-lg py-4"
              onClick={handleUpgrade}
            >
              <CreditCardIcon className="h-5 w-5 mr-2" />
              Fazer Upgrade Agora
            </Button>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <ShieldCheckIcon className="h-4 w-4 inline mr-1" />
              Cancelamento a qualquer momento
            </div>
          </Card>
        </div>

        {/* Features Comparison */}
        <div className="max-w-5xl mx-auto">
          <Card>
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Compare os Planos
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Recursos
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex flex-col items-center">
                        <span>Gratuito</span>
                        <Badge variant="secondary" size="sm" className="mt-1">Atual</Badge>
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <div className="flex flex-col items-center">
                        <span className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                          Premium
                        </span>
                        <Badge variant="warning" size="sm" className="mt-1">Recomendado</Badge>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {features.map((feature, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {feature.name}
                          </div>
                          {feature.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {feature.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof feature.free === 'boolean' ? (
                          feature.free ? (
                            <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {feature.free}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {typeof feature.premium === 'boolean' ? (
                          feature.premium ? (
                            <CheckIcon className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <XMarkIcon className="h-5 w-5 text-red-500 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {feature.premium}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Benefits Section */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Por que escolher o Premium?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Descubra como o Premium pode transformar sua gestão financeira
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900/20 rounded-xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Insights Inteligentes
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Relatórios avançados com IA que analisam seus padrões de gastos e sugerem melhorias
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900/20 rounded-xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CloudIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Sincronização Total
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Acesse seus dados em qualquer dispositivo com backup automático na nuvem
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900/20 rounded-xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <TagIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Organização Total
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Tags, notas e categorias ilimitadas para organizar suas finanças do seu jeito
              </p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 rounded-xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <DocumentArrowDownIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Exportação Completa
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Exporte seus dados em múltiplos formatos para usar em outras ferramentas
              </p>
            </div>

            <div className="text-center">
              <div className="bg-red-100 dark:bg-red-900/20 rounded-xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <GlobeAltIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Acesso Universal
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Use no celular, tablet ou computador - seus dados sempre sincronizados
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 dark:bg-indigo-900/20 rounded-xl p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Suporte VIP
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Atendimento prioritário com nossa equipe especializada em finanças
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            Pronto para transformar suas finanças?
          </h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            Junte-se a milhares de usuários que já descobriram o poder do controle financeiro inteligente.
            Comece seu teste gratuito de 7 dias agora mesmo!
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            className="text-primary-700 bg-white hover:bg-gray-100"
            onClick={handleUpgrade}
          >
            <StarIcon className="h-5 w-5 mr-2" />
            Começar Teste Gratuito de 7 Dias
          </Button>
          <p className="text-xs text-primary-200 mt-3">
            Sem compromisso " Cancele quando quiser " Suporte 24/7
          </p>
        </div>

        {/* Payment Modal */}
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Finalizar Assinatura Premium"
        >
          <div className="space-y-6">
            {/* Plan Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  Plano Premium - {selectedPlan === 'monthly' ? 'Mensal' : 'Anual'}
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  R$ {currentPlan.price.toFixed(2)}
                </span>
              </div>
              {selectedPlan === 'annual' && (
                <div className="text-sm text-green-600">
                  =° Você está economizando R$ {savings.toFixed(2)} por ano!
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Escolha a forma de pagamento
              </h4>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`w-full p-4 border rounded-lg text-left transition-all ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <method.icon className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {method.name}
                            {method.recommended && (
                              <Badge variant="success" size="sm" className="ml-2">
                                Recomendado
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {method.description}
                          </div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedPaymentMethod === method.id
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedPaymentMethod === method.id && (
                          <CheckIcon className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Ao continuar, você concorda com nossos{' '}
              <a href="#" className="text-primary-600 hover:underline">Termos de Serviço</a>
              {' '}e{' '}
              <a href="#" className="text-primary-600 hover:underline">Política de Privacidade</a>.
              Você pode cancelar sua assinatura a qualquer momento.
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={handlePayment}
                disabled={!selectedPaymentMethod}
              >
                Finalizar Pagamento
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}