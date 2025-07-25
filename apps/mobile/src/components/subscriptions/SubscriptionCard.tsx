import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../common/Card';
import { MoneyText } from '../common/MoneyText';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import { Subscription } from '../../types';
import { format, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SubscriptionCardProps {
  subscription: Subscription;
  onPress: () => void;
  onToggleStatus: () => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onPress,
  onToggleStatus
}) => {
  const isOverdue = isAfter(new Date(), new Date(subscription.nextPaymentDate));
  
  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{subscription.name}</Text>
          {subscription.description && (
            <Text style={styles.description}>{subscription.description}</Text>
          )}
        </View>
        <TouchableOpacity 
          onPress={onToggleStatus}
          style={[
            styles.statusButton,
            subscription.status === 'paused' && styles.statusButtonPaused
          ]}
        >
          <Ionicons 
            name={subscription.status === 'active' ? 'pause' : 'play'} 
            size={16} 
            color={colors.white} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <View style={styles.infoItem}>
          <Ionicons name="card" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{subscription.paymentMethod}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>Dia {subscription.billingDay}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <MoneyText value={subscription.amount} size="medium" showSign={false} />
        <Text style={[styles.nextPayment, isOverdue && styles.overdueText]}>
          {isOverdue ? 'Vencido' : `Próximo: ${format(new Date(subscription.nextPaymentDate), 'dd/MM')}`}
        </Text>
      </View>

      {subscription.status === 'paused' && (
        <View style={styles.pausedBadge}>
          <Text style={styles.pausedText}>Pausada</Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtonPaused: {
    backgroundColor: colors.success,
  },
  info: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPayment: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  overdueText: {
    color: colors.danger,
    fontWeight: '600',
  },
  pausedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pausedText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
}); 