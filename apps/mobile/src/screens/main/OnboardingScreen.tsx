import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { Container } from '../../components/common/Container';
import { Button } from '../../components/common/Button';
import { StorageService } from '../services/core';
import { NotificationService } from '../services/platform';
import { ErrorHandler } from '../services/utils';
import { colors } from '../../styles/colors';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface OnboardingScreenProps {
  navigation: any;
}

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  action?: () => Promise<void>;
  actionText?: string;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ navigation }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Bem-vindo ao App Despesas! 👋',
      subtitle: 'Controle Financeiro Inteligente',
      description: 'Gerencie suas finanças pessoais com foco em parcelamentos e compras a prazo. Nunca mais perca o controle dos seus gastos!',
      icon: 'wallet',
      color: colors.primary,
    },
    {
      id: 'features',
      title: 'Recursos Principais 🚀',
      subtitle: 'Tudo que você precisa em um lugar',
      description: '• Controle de transações\n• Gestão de parcelamentos\n• Relatórios detalhados\n• Lembretes de vencimento\n• Backup automático',
      icon: 'apps',
      color: colors.success,
    },
    {
      id: 'installments',
      title: 'Parcelamentos Inteligentes 💳',
      subtitle: 'Nunca mais esqueça uma parcela',
      description: 'Cadastre suas compras parceladas e receba lembretes automáticos. Acompanhe o progresso e saiba exatamente quanto ainda falta pagar.',
      icon: 'card',
      color: colors.info,
    },
    {
      id: 'notifications',
      title: 'Notificações Personalizadas 🔔',
      subtitle: 'Mantenha-se sempre informado',
      description: 'Configure lembretes para não esquecer nenhum pagamento. Receba avisos de parcelas próximas e vencidas.',
      icon: 'notifications',
      color: colors.warning,
      action: async () => {
        await NotificationService.initialize();
      },
      actionText: 'Configurar Notificações',
    },
    {
      id: 'start',
      title: 'Pronto para Começar! 🎉',
      subtitle: 'Sua jornada financeira inicia agora',
      description: 'Vamos criar algumas categorias e dados de exemplo para você experimentar o app. Você pode personalizar tudo depois!',
      icon: 'rocket',
      color: colors.primary,
      action: async () => {
        await createInitialData();
      },
      actionText: 'Criar Dados Iniciais',
    },
  ];

  const createInitialData = async () => {
    await ErrorHandler.withErrorHandling(
      'criar dados iniciais',
      async () => {
        // Criar categorias padrão se não existirem
        const existingCategories = await StorageService.getCategories();
        if (existingCategories.length === 0) {
          // As categorias padrão já são criadas automaticamente
        }

        // Criar transação de exemplo
        const sampleTransaction = {
          id: `welcome_transaction_${Date.now()}`,
          type: 'expense' as const,
          amount: 89.90,
          description: 'Compra no supermercado (exemplo)',
          category: 'Alimentação',
          date: new Date().toISOString(),
          paymentMethod: 'debit' as const,
        };

        await StorageService.saveTransaction(sampleTransaction);

        // Criar parcelamento de exemplo
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 11); // 12 meses

        const sampleInstallment = {
          id: `welcome_installment_${Date.now()}`,
          description: 'Smartphone (exemplo)',
          totalAmount: 1200,
          totalInstallments: 12,
          currentInstallment: 1,
          installmentValue: 100,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          category: 'Compras',
          store: 'Loja de Eletrônicos',
          status: 'active' as const,
          paidInstallments: [1],
          paymentMethod: 'credit' as const,
        };

        await StorageService.saveInstallment(sampleInstallment);

        // Marcar onboarding como concluído
        await markOnboardingComplete();
      }
    );
  };

  const markOnboardingComplete = async () => {
    await ErrorHandler.withErrorHandling(
      'finalizar onboarding',
      async () => {
        // Salvar flag de onboarding concluído
        await StorageService.saveUserPreference?.('onboarding_completed', true);
      },
      false
    );
  };

  const handleNext = async () => {
    const step = onboardingSteps[currentStep];
    
    if (step.action) {
      setIsLoading(true);
      await step.action();
      setIsLoading(false);
    }

    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Scroll suavemente para o próximo passo
      scrollViewRef.current?.scrollTo({
        x: nextStep * screenWidth,
        animated: true,
      });
    } else {
      // Finalizar onboarding
      navigation.replace('Main');
    }
  };

  const handleSkip = async () => {
    await markOnboardingComplete();
    navigation.replace('Main');
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      scrollViewRef.current?.scrollTo({
        x: prevStep * screenWidth,
        animated: true,
      });
    }
  };

  const renderStep = (step: OnboardingStep, index: number) => (
    <View key={step.id} style={styles.stepContainer}>
      <View style={styles.stepContent}>
        {/* Ilustração */}
        <View style={[styles.iconContainer, { backgroundColor: step.color + '20' }]}>
          <Ionicons 
            name={step.icon as any} 
            size={80} 
            color={step.color} 
          />
        </View>

        {/* Conteúdo */}
        <View style={styles.textContainer}>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          <Text style={styles.stepDescription}>{step.description}</Text>
        </View>

        {/* Ação específica do passo */}
        {step.action && (
          <View style={styles.stepAction}>
            <Button
              title={step.actionText || 'Configurar'}
              onPress={step.action}
              variant="outline"
              disabled={isLoading}
              style={styles.stepActionButton}
            />
          </View>
        )}
      </View>
    </View>
  );

  const renderPagination = () => (
    <View style={styles.pagination}>
      {onboardingSteps.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentStep && styles.paginationDotActive
          ]}
        />
      ))}
    </View>
  );

  return (
    <Container style={styles.container}>
      {/* Header com botão pular */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo dos passos */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={styles.stepsContainer}
      >
        {onboardingSteps.map(renderStep)}
      </ScrollView>

      {/* Paginação */}
      {renderPagination()}

      {/* Botões de navegação */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={handlePrevious}
          style={[
            styles.navButton,
            styles.previousButton,
            currentStep === 0 && styles.navButtonDisabled
          ]}
          disabled={currentStep === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={currentStep === 0 ? colors.textSecondary : colors.primary} 
          />
          <Text style={[
            styles.navButtonText,
            currentStep === 0 && styles.navButtonTextDisabled
          ]}>
            Anterior
          </Text>
        </TouchableOpacity>

        <Button
          title={currentStep === onboardingSteps.length - 1 ? 'Começar!' : 'Próximo'}
          onPress={handleNext}
          disabled={isLoading}
          style={styles.nextButton}
        />
      </View>
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  stepsContainer: {
    flex: 1,
  },
  stepContainer: {
    width: screenWidth,
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  stepContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  stepAction: {
    width: '100%',
    marginBottom: 20,
  },
  stepActionButton: {
    marginHorizontal: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  previousButton: {
    // Estilos específicos do botão anterior
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 4,
  },
  navButtonTextDisabled: {
    color: colors.textSecondary,
  },
  nextButton: {
    minWidth: 120,
  },
});

export default OnboardingScreen;