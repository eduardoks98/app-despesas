/**
 * Premium Badge Component - Shows user's subscription status
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

interface PremiumBadgeProps {
  isPremium: boolean;
  subscriptionStatus?: 'active' | 'trialing' | 'canceled' | 'expired';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  style?: any;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  isPremium,
  subscriptionStatus,
  size = 'medium',
  showIcon = true,
  style,
}) => {
  const getBadgeConfig = () => {
    if (!isPremium) {
      return {
        label: 'Free',
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        icon: 'person-outline',
      };
    }

    switch (subscriptionStatus) {
      case 'active':
        return {
          label: 'Premium',
          color: '#8B5CF6',
          backgroundColor: '#F3E8FF',
          icon: 'diamond',
        };
      case 'trialing':
        return {
          label: 'Trial',
          color: '#10B981',
          backgroundColor: '#ECFDF5',
          icon: 'gift',
        };
      case 'canceled':
        return {
          label: 'Cancelado',
          color: '#F59E0B',
          backgroundColor: '#FEF3C7',
          icon: 'warning',
        };
      case 'expired':
        return {
          label: 'Expirado',
          color: '#EF4444',
          backgroundColor: '#FEF2F2',
          icon: 'time',
        };
      default:
        return {
          label: 'Premium',
          color: '#8B5CF6',
          backgroundColor: '#F3E8FF',
          icon: 'diamond',
        };
    }
  };

  const config = getBadgeConfig();
  
  const sizeStyles = {
    small: {
      fontSize: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      iconSize: 12,
    },
    medium: {
      fontSize: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      iconSize: 14,
    },
    large: {
      fontSize: 14,
      paddingHorizontal: 12,
      paddingVertical: 6,
      iconSize: 16,
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.backgroundColor,
          paddingHorizontal: currentSize.paddingHorizontal,
          paddingVertical: currentSize.paddingVertical,
        },
        style,
      ]}
    >
      {showIcon && (
        <Ionicons
          name={config.icon as any}
          size={currentSize.iconSize}
          color={config.color}
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          {
            color: config.color,
            fontSize: currentSize.fontSize,
          },
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});