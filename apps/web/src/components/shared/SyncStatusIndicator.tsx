/**
 * SyncStatusIndicator Web - Indicador de Status de Sincronização para Web
 */

import React, { useState, useEffect } from 'react';
import styles from './SyncStatusIndicator.module.css';

interface SyncStatus {
  lastSync?: Date;
  isSyncing: boolean;
  pendingItems: number;
  lastError?: string;
  isOnline: boolean;
}

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
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    pendingItems: 0,
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    // Listeners para mudanças de conectividade
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSyncPress = async () => {
    try {
      setStatus(prev => ({ ...prev, isSyncing: true }));
      onSyncStart?.();
      
      // Simula sincronização
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastSync: new Date(),
        lastError: undefined 
      }));
      
      onSyncComplete?.(true);
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        isSyncing: false, 
        lastError: 'Erro na sincronização' 
      }));
      onSyncComplete?.(false);
    }
  };

  const getStatusIcon = () => {
    if (status.isSyncing) {
      return <div className={styles.spinner}></div>;
    }
    
    if (!status.isOnline) {
      return <span className={styles.statusIcon}>📴</span>;
    }
    
    if (status.lastError) {
      return <span className={styles.statusIcon}>❌</span>;
    }
    
    if (status.pendingItems > 0) {
      return <span className={styles.statusIcon}>⏳</span>;
    }
    
    return <span className={styles.statusIcon}>✅</span>;
  };

  const getStatusText = () => {
    if (status.isSyncing) {
      return 'Sincronizando...';
    }
    
    if (!status.isOnline) {
      return 'Offline';
    }
    
    if (status.lastError) {
      return 'Erro na sincronização';
    }
    
    if (status.pendingItems > 0) {
      return 'Sincronização pendente';
    }
    
    if (status.lastSync) {
      const now = new Date();
      const diff = now.getTime() - status.lastSync.getTime();
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
    if (status.isSyncing) return 'var(--color-primary)';
    if (!status.isOnline || status.lastError) return 'var(--color-error)';
    if (status.pendingItems > 0) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  return (
    <div className={styles.container}>
      <div className={styles.statusContainer}>
        <div className={styles.iconContainer}>
          {getStatusIcon()}
        </div>
        
        {showText && (
          <div className={styles.textContainer}>
            <span 
              className={styles.statusText}
              style={{ color: getStatusColor() }}
            >
              {getStatusText()}
            </span>
            
            {status.lastError && (
              <span className={styles.errorText}>
                {status.lastError}
              </span>
            )}
          </div>
        )}
      </div>
      
      {showSyncButton && status.isOnline && !status.isSyncing && (
        <button 
          className={styles.syncButton}
          onClick={handleSyncPress}
          title="Sincronizar agora"
        >
          🔄
        </button>
      )}
    </div>
  );
};