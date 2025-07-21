// Formatação de moeda
export const formatCurrency = (value: number) => {
  // Converter de centavos para reais
  const valueInReais = value / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valueInReais);
};

export const formatCurrencyFromReais = (value: number) => {
  // Valor já está em reais, não precisa converter
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Formatação de data
export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateLong = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
};

export const formatDateShort = (dateString: string) => {
  const date = new Date(dateString);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
};

// Categorias centralizadas
export const CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Vestuário',
  'Financiamento',
  'Serviços',
  'Outros',
] as const;

export type Category = typeof CATEGORIES[number];

// Ícones das categorias
export const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: string } = {
    'Alimentação': 'restaurant',
    'Transporte': 'car',
    'Moradia': 'home',
    'Saúde': 'medical',
    'Educação': 'school',
    'Lazer': 'game-controller',
    'Vestuário': 'shirt',
    'Financiamento': 'card',
    'Serviços': 'construct',
    'Outros': 'ellipsis-horizontal',
    // Categorias adicionais encontradas no código
    'Compras': 'bag',
    'Salário': 'wallet',
    'Freelance': 'laptop',
    'Investimentos': 'trending-up',
    'Streaming': 'play-circle',
    'Assinaturas': 'repeat',
  };
  return icons[category] || 'ellipsis-horizontal';
};

// Cores das categorias
export const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    'Alimentação': '#FF6B6B',
    'Transporte': '#4ECDC4',
    'Moradia': '#45B7D1',
    'Saúde': '#96CEB4',
    'Educação': '#FFEAA7',
    'Lazer': '#DDA0DD',
    'Vestuário': '#98D8C8',
    'Financiamento': '#F7DC6F',
    'Serviços': '#BB8FCE',
    'Outros': '#85C1E9',
  };
  return colors[category] || '#85C1E9';
};

// Tipos de recorrência
export const RECURRENCE_TYPES = [
  { label: 'Mensal', value: 'monthly', icon: 'calendar-month' },
  { label: 'Semanal', value: 'weekly', icon: 'calendar-week' },
  { label: 'Anual', value: 'yearly', icon: 'calendar' },
] as const;

// Status de pagamento
export const getPaymentStatusText = (isPaid: boolean) => {
  return isPaid ? 'Pago' : 'Pendente';
};

export const getPaymentStatusColor = (isPaid: boolean) => {
  return isPaid ? '#4CAF50' : '#FF9800';
};

// Formatação de valores para exibição
export const formatAmount = (amount: number, isInCentavos: boolean = true) => {
  const value = isInCentavos ? amount / 100 : amount;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Formatação de percentual
export const formatPercentage = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
}; 