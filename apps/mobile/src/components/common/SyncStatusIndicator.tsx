/**
 * SyncStatusIndicator - Indicador de Status de Sincronização
 * 
 * Componente que exibe o status atual da sincronização
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSync } from '../../hooks/useSync';
import { colors } from '../../styles';
import { SPACING, FONT_SIZES } from '../../styles/responsive';

interface SyncStatusIndicatorProps {
  /** Se deve mostrar o texto do status */
  showText?: boolean;
  /** Se deve mostrar o botão de sincronização manual */
  showSyncButton?: boolean;
  /** Callback quando sincronização é iniciada */
  onSyncStart?: () => void;
  /** Callback quando sincronização termina */
  onSyncComplete?: (success: boolean) => void;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  showText = true,
  showSyncButton = true,
  onSyncStart,
  onSyncComplete,
}) => {
  const { 
    isSyncing, 
    isOnline, 
    lastSync, 
    lastError, 
    hasPendingItems,
    syncNow 
  } = useSync();

  const handleSyncPress = async () => {
    try {
      onSyncStart?.();
      const result = await syncNow();
      onSyncComplete?.(result.success);
    } catch (error) {
      onSyncComplete?.(false);
    }
  };

  const getStatusIcon = () => {
    if (isSyncing) {
      return <ActivityIndicator size="small" color={colors.primary} />;
    }
    
    if (!isOnline) {
      return <Text style={styles.statusIcon}>📴</Text>;
    }
    
    if (lastError) {
      return <Text style={styles.statusIcon}>❌</Text>;
    }
    
    if (hasPendingItems) {
      return <Text style={styles.statusIcon}>⏳</Text>;
    }
    
    return <Text style={styles.statusIcon}>✅</Text>;
  };

  const getStatusText = () => {
    if (isSyncing) {
      return 'Sincronizando...';
    }
    
    if (!isOnline) {
      return 'Offline';
    }
    
    if (lastError) {
      return 'Erro na sincronização';
    }
    
    if (hasPendingItems) {
      return 'Sincronização pendente';
    }
    
    if (lastSync) {
      const now = new Date();
      const diff = now.getTime() - lastSync.getTime();
      const minutes = Math.floor(diff / (1000 * 60));
      
      if (minutes < 1) {
        return 'Sincronizado agora';
      } else if (minutes < 60) {
        return `Sincronizado há ${minutes}min`;
      } else {
        const hours = Math.floor(minutes / 60);
        return `Sincronizado há ${hours}h`;
      }
    }
    
    return 'Nunca sincronizado';
  };

  const getStatusColor = () => {
    if (isSyncing) {
      return colors.primary;
    }
    
    if (!isOnline || lastError) {
      return colors.danger;
    }
    
    if (hasPendingItems) {
      return colors.warning;
    }
    
    return colors.success;
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={styles.iconContainer}>
          {getStatusIcon()}
        </View>
        
        {showText && (
          <View style={styles.textContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            
            {lastError && (
              <Text style={styles.errorText} numberOfLines={1}>
                {lastError}
              </Text>
            )}
          </View>
        )}
      </View>
      
      {showSyncButton && isOnline && !isSyncing && (
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSyncPress}
          activeOpacity={0.7}
        >
          <Text style={styles.syncButtonText}>🔄</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: colors.surface,
    borderRadius: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  iconContainer: {
    marginRight: SPACING.sm,
    width: 20,
    alignItems: 'center',
  },
  
  statusIcon: {
    fontSize: 16,
  },
  
  textContainer: {
    flex: 1,
  },
  
  statusText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginBottom: 2,
  },
  
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: colors.danger,
    opacity: 0.8,
  },
  
  syncButton: {
    padding: SPACING.xs,
    borderRadius: SPACING.xs,
    backgroundColor: colors.primary,
    marginLeft: SPACING.sm,
  },
  
  syncButtonText: {
    fontSize: 14,
    color: 'white',
  },
});