'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  QrCodeIcon,
  CopyIcon,
  CheckIcon,
  ClockIcon,
  XCircleIcon,
  AlertCircleIcon,
  RefreshCcwIcon
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PIXCharge {
  chargeId: string;
  qrCode: string;
  qrCodeImage: string;
  pixKey: string;
  amount: number;
  formattedAmount: string;
  expiresAt: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
}

export default function PIXPage() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [customerDocument, setCustomerDocument] = useState('');
  const [charge, setCharge] = useState<PIXCharge | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Update countdown timer
  useEffect(() => {
    if (!charge || charge.status !== 'pending') return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(charge.expiresAt).getTime();
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        setCharge(prev => prev ? { ...prev, status: 'expired' } : null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [charge]);

  const createPIXCharge = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!amount || parseFloat(amount) <= 0) {
        throw new Error('Valor inválido');
      }

      if (!customerDocument) {
        throw new Error('CPF/CNPJ é obrigatório');
      }

      const response = await fetch('/api/pix/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description: description || 'Pagamento App Despesas',
          customerDocument,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Falha ao criar cobrança PIX');
      }

      const chargeData = await response.json();
      setCharge(chargeData);
    } catch (err) {
      console.error('Failed to create PIX charge:', err);
      setError(err instanceof Error ? err.message : 'Falha ao criar cobrança PIX');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!charge) return;

    try {
      const response = await fetch(`/api/pix/charges/${charge.chargeId}`);
      
      if (response.ok) {
        const updated = await response.json();
        setCharge(prev => prev ? { ...prev, status: updated.status } : null);
      }
    } catch (err) {
      console.error('Failed to check payment status:', err);
    }
  };

  const cancelCharge = async () => {
    if (!charge) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/pix/charges/${charge.chargeId}/cancel`, {
        method: 'POST',
      });

      if (response.ok) {
        setCharge(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (err) {
      console.error('Failed to cancel charge:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDocument = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 11) {
      // CPF format: 000.000.000-00
      return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ format: 00.000.000/0000-00
      return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { variant: 'secondary' as const, label: 'Aguardando', icon: ClockIcon },
      paid: { variant: 'default' as const, label: 'Pago', icon: CheckIcon },
      expired: { variant: 'destructive' as const, label: 'Expirado', icon: XCircleIcon },
      cancelled: { variant: 'destructive' as const, label: 'Cancelado', icon: XCircleIcon }
    };

    const config = statusMap[status as keyof typeof statusMap] || { 
      variant: 'outline' as const, 
      label: status, 
      icon: AlertCircleIcon 
    };

    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Pagamento PIX</h1>
          <p className="text-muted-foreground">
            Faça pagamentos instantâneos usando PIX
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircleIcon className="w-4 h-4" />
              <span className="font-medium">Erro</span>
            </div>
            <p className="text-sm text-destructive/90 mt-1">{error}</p>
          </div>
        )}

        {!charge ? (
          <Card>
            <CardHeader>
              <CardTitle>Criar Cobrança PIX</CardTitle>
              <CardDescription>
                Preencha os dados para gerar uma cobrança PIX
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">CPF/CNPJ</Label>
                  <Input
                    id="document"
                    placeholder="000.000.000-00"
                    value={formatDocument(customerDocument)}
                    onChange={(e) => setCustomerDocument(e.target.value.replace(/\D/g, ''))}
                    maxLength={18}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  placeholder="Descrição do pagamento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <Button 
                onClick={createPIXCharge} 
                disabled={isLoading || !amount || !customerDocument}
                className="w-full"
              >
                {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                <QrCodeIcon className="w-4 h-4 mr-2" />
                Gerar PIX
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Cobrança PIX
                  {getStatusBadge(charge.status)}
                </CardTitle>
                <CardDescription>
                  Escaneie o QR Code ou copie o código PIX
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {charge.formattedAmount}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {description || 'Pagamento App Despesas'}
                  </p>
                </div>

                {charge.status === 'pending' && timeLeft !== null && (
                  <div className="flex items-center justify-center gap-2 text-orange-600">
                    <ClockIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Expira em {formatTime(timeLeft)}
                    </span>
                  </div>
                )}

                <div className="flex justify-center">
                  <img 
                    src={charge.qrCodeImage} 
                    alt="QR Code PIX" 
                    className="w-64 h-64 border rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código PIX</Label>
                  <div className="flex gap-2">
                    <Input
                      value={charge.qrCode}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(charge.qrCode)}
                    >
                      {copied ? (
                        <CheckIcon className="w-4 h-4 text-green-600" />
                      ) : (
                        <CopyIcon className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={checkPaymentStatus}
                    disabled={charge.status !== 'pending'}
                    className="flex-1"
                  >
                    <RefreshCcwIcon className="w-4 h-4 mr-2" />
                    Verificar Status
                  </Button>

                  {charge.status === 'pending' && (
                    <Button
                      variant="destructive"
                      onClick={cancelCharge}
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCharge(null)}
                  className="w-full"
                >
                  Nova Cobrança
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Como pagar com PIX</CardTitle>
                <CardDescription>
                  Siga as instruções para completar o pagamento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Abra seu app do banco</h4>
                      <p className="text-sm text-muted-foreground">
                        Use o aplicativo do seu banco ou carteira digital
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Escaneie o QR Code</h4>
                      <p className="text-sm text-muted-foreground">
                        Use a câmera do app para escanear o código
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Ou copie o código PIX</h4>
                      <p className="text-sm text-muted-foreground">
                        Cole o código PIX na opção "Pix Copia e Cola"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Confirme o pagamento</h4>
                      <p className="text-sm text-muted-foreground">
                        Verifique os dados e confirme a transferência
                      </p>
                    </div>
                  </div>
                </div>

                {charge.status === 'paid' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckIcon className="w-5 h-5" />
                      <span className="font-medium">Pagamento Confirmado!</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">
                      Seu pagamento foi processado com sucesso.
                    </p>
                  </div>
                )}

                {charge.status === 'expired' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircleIcon className="w-5 h-5" />
                      <span className="font-medium">Cobrança Expirada</span>
                    </div>
                    <p className="text-sm text-red-600 mt-1">
                      Esta cobrança expirou. Gere uma nova para pagar.
                    </p>
                  </div>
                )}

                {charge.status === 'cancelled' && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <XCircleIcon className="w-5 h-5" />
                      <span className="font-medium">Cobrança Cancelada</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Esta cobrança foi cancelada.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}