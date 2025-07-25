/**
 * Paywall Modal - Blocks premium features for free users
 */

import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  IconButton,
  Surface,
  Text,
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: {
    name: string;
    description: string;
    icon: string;
  };
  title?: string;
  subtitle?: string;
}

const { width, height } = Dimensions.get('window');

export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  feature,
  title = "Recurso Premium",
  subtitle = "Faça upgrade para desbloquear este recurso",
}) => {
  const premiumBenefits = [
    'Sincronização automática',
    'Backup na nuvem',
    'Relatórios avançados',
    'Versão web',
    'Suporte prioritário',
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Close Button */}
            <View style={styles.header}>
              <IconButton
                icon="close"
                size={24}
                onPress={onClose}
                style={styles.closeButton}
                iconColor="#6B7280"
              />
            </View>

            {/* Main Card */}
            <Card style={styles.card}>
              <LinearGradient
                colors={['#8B5CF6', '#A855F7']}
                style={styles.cardHeader}
              >
                <View style={styles.featureIconContainer}>
                  <Ionicons 
                    name={feature.icon as any} 
                    size={48} 
                    color="white" 
                  />
                </View>
                <Title style={styles.cardTitle}>{title}</Title>
                <Paragraph style={styles.cardSubtitle}>
                  {subtitle}
                </Paragraph>
              </LinearGradient>

              <Card.Content style={styles.cardContent}>
                {/* Blocked Feature */}
                <Surface style={styles.featureHighlight}>
                  <View style={styles.featureInfo}>
                    <View style={styles.featureIconSmall}>
                      <Ionicons 
                        name={feature.icon as any} 
                        size={24} 
                        color="#8B5CF6" 
                      />
                    </View>
                    <View style={styles.featureText}>
                      <Text style={styles.featureName}>{feature.name}</Text>
                      <Text style={styles.featureDescription}>
                        {feature.description}
                      </Text>
                    </View>
                    <View style={styles.lockIcon}>
                      <Ionicons name="lock-closed" size={20} color="#EF4444" />
                    </View>
                  </View>
                </Surface>

                {/* Premium Benefits */}
                <View style={styles.benefitsSection}>
                  <Text style={styles.benefitsTitle}>
                    Com o Premium você também tem:
                  </Text>
                  
                  <View style={styles.benefitsList}>
                    {premiumBenefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Ionicons 
                          name="checkmark-circle" 
                          size={16} 
                          color="#10B981" 
                        />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Price */}
                <View style={styles.priceSection}>
                  <Text style={styles.priceLabel}>A partir de</Text>
                  <Text style={styles.price}>R$ 9,90</Text>
                  <Text style={styles.priceInterval}>por mês</Text>
                </View>

                {/* CTA Buttons */}
                <View style={styles.buttonSection}>
                  <Button
                    mode="contained"
                    onPress={onUpgrade}
                    style={styles.upgradeButton}
                    contentStyle={styles.upgradeButtonContent}
                    labelStyle={styles.upgradeButtonLabel}
                  >
                    Fazer Upgrade
                  </Button>
                  
                  <Button
                    mode="text"
                    onPress={onClose}
                    style={styles.laterButton}
                    labelStyle={styles.laterButtonLabel}
                  >
                    Talvez depois
                  </Button>
                </View>

                {/* Trial Notice */}
                <View style={styles.trialNotice}>
                  <Ionicons name="gift-outline" size={16} color="#10B981" />
                  <Text style={styles.trialText}>
                    14 dias grátis para novos usuários
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    margin: 0,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cardHeader: {
    padding: 24,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardContent: {
    padding: 24,
  },
  featureHighlight: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 24,
    elevation: 1,
  },
  featureInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  lockIcon: {
    marginLeft: 8,
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  priceInterval: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonSection: {
    gap: 12,
    marginBottom: 16,
  },
  upgradeButton: {
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
  laterButton: {
    borderRadius: 12,
  },
  laterButtonLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  trialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
  },
  trialText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
});