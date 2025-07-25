/**
 * Feature Lock Component - Shows when features are locked for free users
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Button, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PaywallModal } from './PaywallModal';
import { useAuth } from '../../hooks/useAuth';

interface FeatureLockProps {
  feature: {
    name: string;
    description: string;
    icon: string;
  };
  children?: React.ReactNode;
  style?: any;
  variant?: 'card' | 'overlay' | 'inline';
  onUpgradePress?: () => void;
}

export const FeatureLock: React.FC<FeatureLockProps> = ({
  feature,
  children,
  style,
  variant = 'card',
  onUpgradePress,
}) => {
  const { user, navigateToUpgrade } = useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  // Don't show lock if user is premium
  if (user?.isPremium) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    if (onUpgradePress) {
      onUpgradePress();
    } else {
      setShowPaywall(true);
    }
  };

  const handlePaywallUpgrade = () => {
    setShowPaywall(false);
    navigateToUpgrade?.(feature.name);
  };

  if (variant === 'overlay') {
    return (
      <View style={[styles.overlayContainer, style]}>
        {children}
        <Surface style={styles.overlayLock}>
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.8)', 'rgba(0, 0, 0, 0.6)']}
            style={styles.overlayGradient}
          >
            <View style={styles.overlayContent}>
              <View style={styles.lockIconContainer}>
                <Ionicons name="lock-closed" size={32} color="white" />
              </View>
              <Text style={styles.overlayTitle}>Recurso Premium</Text>
              <Text style={styles.overlayDescription}>
                {feature.description}
              </Text>
              <Button
                mode="contained"
                onPress={handleUpgrade}
                style={styles.overlayButton}
                buttonColor="#8B5CF6"
                compact
              >
                Desbloquear
              </Button>
            </View>
          </LinearGradient>
        </Surface>

        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onUpgrade={handlePaywallUpgrade}
          feature={feature}
        />
      </View>
    );
  }

  if (variant === 'inline') {
    return (
      <TouchableOpacity 
        style={[styles.inlineContainer, style]} 
        onPress={handleUpgrade}
        activeOpacity={0.8}
      >
        <View style={styles.inlineContent}>
          <View style={styles.inlineIcon}>
            <Ionicons name={feature.icon as any} size={24} color="#8B5CF6" />
          </View>
          <View style={styles.inlineText}>
            <Text style={styles.inlineTitle}>{feature.name}</Text>
            <Text style={styles.inlineDescription}>{feature.description}</Text>
          </View>
          <View style={styles.inlineLock}>
            <Ionicons name="lock-closed" size={20} color="#EF4444" />
          </View>
        </View>

        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          onUpgrade={handlePaywallUpgrade}
          feature={feature}
        />
      </TouchableOpacity>
    );
  }

  // Default card variant
  return (
    <View style={[style]}>
      <Card style={styles.lockCard} onPress={handleUpgrade}>
        <LinearGradient
          colors={['#F3E8FF', '#FAF5FF']}
          style={styles.cardGradient}
        >
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.featureIconContainer}>
                <Ionicons 
                  name={feature.icon as any} 
                  size={32} 
                  color="#8B5CF6" 
                />
              </View>
              <View style={styles.lockBadge}>
                <Ionicons name="lock-closed" size={16} color="#EF4444" />
                <Text style={styles.lockText}>Premium</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>{feature.name}</Text>
            <Text style={styles.cardDescription}>{feature.description}</Text>

            <View style={styles.cardActions}>
              <Button
                mode="contained"
                onPress={handleUpgrade}
                style={styles.upgradeCardButton}
                contentStyle={styles.upgradeCardButtonContent}
                labelStyle={styles.upgradeCardButtonLabel}
                buttonColor="#8B5CF6"
              >
                Fazer Upgrade
              </Button>
              
              <View style={styles.priceInfo}>
                <Text style={styles.priceText}>A partir de R$ 9,90/mês</Text>
              </View>
            </View>
          </Card.Content>
        </LinearGradient>
      </Card>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        onUpgrade={handlePaywallUpgrade}
        feature={feature}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Overlay variant
  overlayContainer: {
    position: 'relative',
  },
  overlayLock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  overlayGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  overlayContent: {
    alignItems: 'center',
  },
  lockIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  overlayDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  overlayButton: {
    borderRadius: 8,
  },

  // Inline variant
  inlineContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  inlineContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineText: {
    flex: 1,
    marginLeft: 12,
  },
  inlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  inlineDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  inlineLock: {
    marginLeft: 8,
  },

  // Card variant
  lockCard: {
    elevation: 2,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  cardActions: {
    alignItems: 'center',
    gap: 12,
  },
  upgradeCardButton: {
    borderRadius: 12,
    width: '100%',
  },
  upgradeCardButtonContent: {
    height: 44,
  },
  upgradeCardButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceInfo: {
    alignItems: 'center',
  },
  priceText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});