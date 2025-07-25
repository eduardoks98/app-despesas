/**
 * SyncStatusIndicator - Indicador de Status de Sincronização
 * 
 * Componente que exibe o status atual da sincronização
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useSync } from '../../hooks/useSync';
import { colors, tokens } from '../../styles';

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
      return <ActivityIndicator size="small" color={colors.brand.primary} />;
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
      return colors.brand.primary;
    }
    
    if (!isOnline || lastError) {
      return colors.semantic.error;
    }
    
    if (hasPendingItems) {
      return colors.semantic.warning;
    }
    
    return colors.semantic.success;
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
    paddingHorizontal: tokens.space.md,
    paddingVertical: tokens.space.sm,
    backgroundColor: colors.light.background.secondary,
    borderRadius: tokens.space.sm,
    marginHorizontal: tokens.space.md,
    marginVertical: tokens.space.xs,
  },
  
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  iconContainer: {
    marginRight: tokens.space.sm,
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
    fontSize: tokens.text.sm.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  
  errorText: {
    fontSize: tokens.text.xs.fontSize,
    color: colors.semantic.error,
    opacity: 0.8,
  },
  
  syncButton: {
    padding: tokens.space.xs,
    borderRadius: tokens.space.xs,
    backgroundColor: colors.brand.primary,
    marginLeft: tokens.space.sm,
  },
  
  syncButtonText: {
    fontSize: 14,
    color: 'white',
  },
});