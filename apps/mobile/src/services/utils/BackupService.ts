import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { StorageService } from '../core';
import { ErrorHandler } from './ErrorHandler';

export interface BackupData {
  version: string;
  timestamp: number;
  transactions: any[];
  installments: any[];
  subscriptions: any[];
  categories: any[];
  settings: any;
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  autoBackup: boolean;
  includeSettings: boolean;
}

export class BackupService {
  private static settings: BackupSettings = {
    enabled: true,
    frequency: 'weekly',
    autoBackup: true,
    includeSettings: true,
  };

  private static backupDir = `${FileSystem.documentDirectory}backups/`;

  // Inicializar serviço de backup
  static async initialize(): Promise<void> {
    await ErrorHandler.withErrorHandling(
      'inicializar serviço de backup',
      async () => {
        // Criar diretório de backup se não existir
        const dirInfo = await FileSystem.getInfoAsync(this.backupDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(this.backupDir, { intermediates: true });
        }

        // Carregar configurações
        await this.loadSettings();
      },
      false
    );
  }

  // Carregar configurações
  static async loadSettings(): Promise<void> {
    try {
      const saved = await StorageService.getUserPreference('backupSettings');
      if (saved) {
        this.settings = { ...this.settings, ...saved };
      }
    } catch (error) {
      // Usar configurações padrão se falhar
    }
  }

  // Salvar configurações
  static async saveSettings(newSettings: Partial<BackupSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    
    await ErrorHandler.withErrorHandling(
      'salvar configurações de backup',
      async () => {
        await StorageService.saveUserPreference('backupSettings', this.settings);
      },
      false
    );
  }

  // Criar backup manual
  static async createBackup(): Promise<string | null> {
    return await ErrorHandler.withErrorHandling(
      'criar backup',
      async () => {
        // Coletar todos os dados
        const backupData: BackupData = {
          version: '1.0.0',
          timestamp: Date.now(),
          transactions: await StorageService.getTransactions(),
          installments: await StorageService.getInstallments(),
          subscriptions: await StorageService.getSubscriptions(),
          categories: await StorageService.getCategories(),
          settings: this.settings.includeSettings ? await StorageService.getUserPreferences() : {},
        };

        // Gerar nome do arquivo
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toISOString().split('T')[1].split('.')[0].replace(/:/g, '-');
        const filename = `backup_${date}_${time}.json`;
        const filepath = `${this.backupDir}${filename}`;

        // Salvar arquivo
        const jsonData = JSON.stringify(backupData, null, 2);
        await FileSystem.writeAsStringAsync(filepath, jsonData);

        console.log('[BackupService] Backup created:', filepath);
        return filepath;
      },
      null
    );
  }

  // Listar backups disponíveis
  static async listBackups(): Promise<string[]> {
    try {
      const files = await FileSystem.readDirectoryAsync(this.backupDir);
      return files.filter(file => file.endsWith('.json')).map(file => `${this.backupDir}${file}`);
    } catch (error) {
      console.error('[BackupService] Failed to list backups:', error);
      return [];
    }
  }

  // Excluir backup
  static async deleteBackup(filepath: string): Promise<boolean> {
    try {
      await FileSystem.deleteAsync(filepath);
      console.log('[BackupService] Backup deleted:', filepath);
      return true;
    } catch (error) {
      console.error('[BackupService] Failed to delete backup:', error);
      return false;
    }
  }

  // Compartilhar backup
  static async shareBackup(filepath: string): Promise<boolean> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filepath, {
          mimeType: 'application/json',
          dialogTitle: 'Compartilhar Backup',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('[BackupService] Failed to share backup:', error);
      return false;
    }
  }

  // Obter configurações
  static getSettings(): BackupSettings {
    return { ...this.settings };
  }
} 