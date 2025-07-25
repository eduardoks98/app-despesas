/**
 * useSync Hook - Hook para gerenciar sincronização
 * 
 * Hook que facilita o uso do SyncService em componentes React
 */

import { useState, useEffect, useCallback } from 'react';
import { SyncService, SyncStatus, SyncResult } from '../services/core/SyncService';

interface UseSyncReturn {
  /** Status atual da sincronização */
  status: SyncStatus;
  /** Função para sincronizar manualmente */
  syncNow: () => Promise<SyncResult>;
  /** Se está sincronizando */
  isSyncing: boolean;
  /** Último erro de sincronização */
  lastError?: string;
  /** Última sincronização */
  lastSync?: Date;
  /** Se há itens pendentes */
  hasPendingItems: boolean;
  /** Se está online */
  isOnline: boolean;
}

export const useSync = (): UseSyncReturn => {
  const [status, setStatus] = useState<SyncStatus>(SyncService.getStatus());

  useEffect(() => {
    // Listener para mudanças de status
    const handleStatusChange = (newStatus: SyncStatus) => {
      setStatus(newStatus);
    };

    SyncService.addStatusListener(handleStatusChange);

    // Cleanup
    return () => {
      SyncService.removeStatusListener(handleStatusChange);
    };
  }, []);

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    try {
      return await SyncService.forcSync();
    } catch (error: any) {
      console.error('Erro na sincronização manual:', error);
      throw error;
    }
  }, []);

  return {
    status,
    syncNow,
    isSyncing: status.isSyncing,
    lastError: status.lastError,
    lastSync: status.lastSync,
    hasPendingItems: status.pendingItems > 0,
    isOnline: status.isOnline,
  };
};