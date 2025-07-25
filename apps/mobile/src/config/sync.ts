/**
 * Configuração de Sincronização
 * 
 * Configurações para o serviço de sincronização entre plataformas
 */

import { SyncConfiguration } from '../services/core/SyncService';

/**
 * Configuração de desenvolvimento
 */
export const SYNC_CONFIG_DEV: SyncConfiguration = {
  apiUrl: 'http://localhost:3001/api',
  syncInterval: 5, // 5 minutos para desenvolvimento
  autoSync: true,
  autoResolveConflicts: true,
};

/**
 * Configuração de produção
 */
export const SYNC_CONFIG_PROD: SyncConfiguration = {
  apiUrl: 'https://api.appdespesas.com.br/api',
  syncInterval: 15, // 15 minutos para produção
  autoSync: true,
  autoResolveConflicts: true,
};

/**
 * Configuração baseada no ambiente
 */
export const getSyncConfig = (): SyncConfiguration => {
  const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';
  return isDevelopment ? SYNC_CONFIG_DEV : SYNC_CONFIG_PROD;
};

/**
 * Configuração de autenticação
 * 
 * Nota: Em uma implementação real, o token seria obtido do:
 * - Sistema de autenticação
 * - Armazenamento seguro (Keychain/Keystore)
 * - Context de usuário logado
 */
export const getAuthToken = async (): Promise<string | undefined> => {
  // TODO: Implementar obtenção do token de autenticação
  // Por enquanto retorna undefined (modo offline/gratuito)
  return undefined;
};

/**
 * Configuração completa de sincronização
 */
export const getFullSyncConfig = async (): Promise<SyncConfiguration> => {
  const baseConfig = getSyncConfig();
  const authToken = await getAuthToken();
  
  return {
    ...baseConfig,
    authToken,
  };
};