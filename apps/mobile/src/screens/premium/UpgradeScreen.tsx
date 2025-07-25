/**
 * Upgrade Screen - Premium subscription upgrade page
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  List,
  Surface,
  IconButton,
  Text,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';

interface UpgradeScreenProps {
  navigation: any;
  route?: {
    params?: {
      feature?: string;
      source?: string;
    };
  };
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  highlighted?: boolean;
  savings?: string;
}

const { width } = Dimensions.get('window');

export const UpgradeScreen: React.FC<UpgradeScreenProps> = ({ navigation, route }) => {
  const { user, startTrial, upgradeToSubscription } = useAuth();
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');

  const blockedFeature = route?.params?.feature;
  const source = route?.params?.source;

  const plans: PricingPlan[] = [
    {
      id: 'monthly',
      name: 'Mensal',
      price: 9.90,
      currency: 'BRL',
      interval: 'mês',
      features: [
        'Sincronização automática',
        'Backup na nuvem',
        'Versão web',
        'Relatórios avançados',
        'Categorias ilimitadas',
        'Exportação PDF/Excel',
        'Suporte prioritário',
      ],
    },
    {
      id: 'yearly',
      name: 'Anual',
      price: 99.00,
      currency: 'BRL',
      interval: 'ano',
      features: [
        'Tudo do plano mensal',
        '2 meses grátis',
        'Acesso antecipado',
        'Recursos exclusivos',
      ],
      highlighted: true,
      savings: 'Economize R$ 19,80',
    },
  ];

  const premiumFeatures = [
    {
      icon: 'cloud-upload-outline',
      title: 'Sincronização Automática',
      description: 'Seus dados sempre sincronizados entre todos os dispositivos',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Backup na Nuvem',
      description: 'Nunca perca seus dados com backup automático',
    },
    {
      icon: 'desktop-outline',
      title: 'Versão Web',
      description: 'Acesse suas finanças de qualquer computador',
    },
    {
      icon: 'analytics-outline',
      title: 'Relatórios Avançados',
      description: 'Gráficos detalhados e insights sobre seus gastos',
    },
    {
      icon: 'infinite-outline',
      title: 'Categorias Ilimitadas',
      description: 'Crie quantas categorias personalizadas quiser',
    },
    {
      icon: 'document-text-outline',
      title: 'Exportação Completa',
      description: 'Exporte relatórios em PDF e Excel',
    },
  ];

  const handleStartTrial = async () => {
    try {
      setTrialLoading(true);
      await startTrial();
      
      // Navigate back or to home
      navigation.goBack();
    } catch (error) {
      console.error('Trial start failed:', error);
      // Handle error
    } finally {
      setTrialLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(true);
      await upgradeToSubscription(planId);
      
      // Navigate to success page or back
      navigation.goBack();
    } catch (error) {
      console.error('Upgrade failed:', error);
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="close"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.closeButton}
          />
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={['#8B5CF6', '#A855F7', '#C084FC']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Ionicons name="diamond-outline" size={64} color="white" />
            <Title style={styles.heroTitle}>Upgrade para Premium</Title>
            <Paragraph style={styles.heroSubtitle}>
              Desbloqueie todos os recursos e leve seu controle financeiro ao próximo nível
            </Paragraph>
          </View>
        </LinearGradient>

        {/* Blocked Feature Warning */}
        {blockedFeature && (
          <Card style={styles.warningCard}>
            <Card.Content>
              <View style={styles.warningContent}>
                <Ionicons name="lock-closed" size={24} color="#F59E0B" />
                <View style={styles.warningText}>
                  <Text style={styles.warningTitle}>Recurso Premium</Text>
                  <Text style={styles.warningMessage}>
                    {`${blockedFeature} é um recurso exclusivo para usuários Premium`}
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Trial Offer */}
        {!user?.hasUsedTrial && (
          <Card style={styles.trialCard}>
            <Card.Content>
              <View style={styles.trialHeader}>
                <Ionicons name="gift-outline" size={32} color="#10B981" />
                <View style={styles.trialText}>
                  <Title style={styles.trialTitle}>Teste Grátis por 14 Dias</Title>
                  <Paragraph style={styles.trialSubtitle}>
                    Experimente todos os recursos Premium sem compromisso
                  </Paragraph>
                </View>
              </View>
              
              <Button
                mode="contained"
                onPress={handleStartTrial}
                loading={trialLoading}
                style={styles.trialButton}
                buttonColor="#10B981"
              >
                Começar Teste Grátis
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Features List */}
        <Card style={styles.featuresCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recursos Premium</Title>
            
            {premiumFeatures.map((feature, index) => (
              <List.Item
                key={index}
                title={feature.title}
                description={feature.description}
                left={() => (
                  <View style={styles.featureIcon}>
                    <Ionicons name={feature.icon as any} size={24} color="#8B5CF6" />
                  </View>
                )}
                titleStyle={styles.featureTitle}
                descriptionStyle={styles.featureDescription}
                style={styles.featureItem}
              />
            ))}
          </Card.Content>
        </Card>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          <Title style={styles.sectionTitle}>Escolha seu Plano</Title>
          
          {plans.map((plan) => (
            <Card
              key={plan.id}
              style={[
                styles.planCard,
                plan.highlighted && styles.highlightedPlan,
                selectedPlan === plan.id && styles.selectedPlan,
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.highlighted && (
                <Surface style={styles.popularBadge}>
                  <Text style={styles.popularText}>Mais Popular</Text>
                </Surface>
              )}
              
              <Card.Content style={styles.planContent}>
                <View style={styles.planHeader}>
                  <Title style={styles.planName}>{plan.name}</Title>
                  {plan.savings && (
                    <Chip style={styles.savingsChip} textStyle={styles.savingsText}>
                      {plan.savings}
                    </Chip>
                  )}
                </View>
                
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>
                    {formatPrice(plan.price, plan.currency)}
                  </Text>
                  <Text style={styles.interval}>por {plan.interval}</Text>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.featuresList}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.planFeature}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.planFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* CTA Button */}
        <View style={styles.ctaSection}>
          <Button
            mode="contained"
            onPress={() => handleUpgrade(selectedPlan)}
            loading={loading}
            style={styles.upgradeButton}
            contentStyle={styles.upgradeButtonContent}
            labelStyle={styles.upgradeButtonLabel}
          >
            {user?.hasUsedTrial ? 'Assinar Agora' : 'Continuar'}
          </Button>
          
          <Paragraph style={styles.disclaimer}>
            Cancele a qualquer momento. Sem taxas ocultas.
          </Paragraph>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            mode="text"
            onPress={() => {/* Open terms */}}
            textColor="#6B7280"
          >
            Termos de Uso
          </Button>
          <Button
            mode="text"
            onPress={() => {/* Open privacy */}}
            textColor="#6B7280"
          >
            Política de Privacidade
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  closeButton: {
    margin: 0,
  },
  heroSection: {
    padding: 32,
    margin: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginTop: 16,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
  },
  warningCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    marginLeft: 12,
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  warningMessage: {
    fontSize: 14,
    color: '#92400E',
    marginTop: 4,
  },
  trialCard: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderWidth: 1,
  },
  trialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trialText: {
    marginLeft: 12,
    flex: 1,
  },
  trialTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#065F46',
  },
  trialSubtitle: {
    fontSize: 14,
    color: '#065F46',
    marginTop: 4,
  },
  trialButton: {
    borderRadius: 8,
  },
  featuresCard: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureItem: {
    paddingVertical: 8,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  pricingSection: {
    padding: 16,
  },
  planCard: {
    marginBottom: 16,
    position: 'relative',
  },
  highlightedPlan: {
    borderColor: '#8B5CF6',
    borderWidth: 2,
  },
  selectedPlan: {
    borderColor: '#10B981',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    zIndex: 1,
  },
  popularText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  planContent: {
    paddingTop: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  savingsChip: {
    backgroundColor: '#DCFCE7',
  },
  savingsText: {
    color: '#16A34A',
    fontSize: 12,
    fontWeight: '600',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  interval: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  featuresList: {
    gap: 8,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  ctaSection: {
    padding: 16,
    alignItems: 'center',
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
  },
  upgradeButtonContent: {
    height: 48,
  },
  upgradeButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
});