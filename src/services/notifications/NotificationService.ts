import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Installment, Transaction } from '../../types';
import { StorageService } from '../storage/StorageService';
import { ErrorHandler } from '../error/ErrorHandler';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:MM format
  upcomingPayments: boolean;
  upcomingPaymentsDays: number; // days before due date
  overduePayments: boolean;
}

export class NotificationService {
  private static settings: NotificationSettings = {
    enabled: true,
    dailyReminder: false,
    dailyReminderTime: '09:00',
    upcomingPayments: true,
    upcomingPaymentsDays: 3,
    overduePayments: true,
  };

  // Verificar se estamos no Expo Go
  private static isExpoGo(): boolean {
    return __DEV__ && !process.env.EAS_BUILD;
  }

  // Configurar notificações
  static async initialize(): Promise<boolean> {
    if (this.isExpoGo()) {
      console.log('[NotificationService] Running in Expo Go - notifications limited');
      return false;
    }

    const result = await ErrorHandler.withErrorHandling(
      'inicializar sistema de notificações',
      async () => {
        // Configurar comportamento das notificações
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        // Solicitar permissões
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('[NotificationService] Permission denied - notifications disabled');
        }

        // Carregar configurações salvas
        await this.loadSettings();

        return true;
      },
      false
    );

    return result !== null;
  }

  // Carregar configurações
  static async loadSettings(): Promise<void> {
    try {
      const saved = await StorageService.getNotificationSettings?.();
      if (saved) {
        this.settings = { ...this.settings, ...saved };
      }
    } catch (error) {
      // Usar configurações padrão se falhar
    }
  }

  // Salvar configurações
  static async saveSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    
    await ErrorHandler.withErrorHandling(
      'salvar configurações de notificação',
      async () => {
        await StorageService.saveNotificationSettings?.(this.settings);
      },
      false
    );
  }

  // Obter configurações atuais
  static getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Agendar todas as notificações
  static async scheduleAllNotifications(): Promise<void> {
    if (!this.settings.enabled || this.isExpoGo()) {
      console.log('[NotificationService] Notifications disabled - skipping scheduling');
      return;
    }

    await ErrorHandler.withErrorHandling(
      'agendar notificações',
      async () => {
        // Cancelar notificações existentes
        await Notifications.cancelAllScheduledNotificationsAsync();

        const [installments, transactions] = await Promise.all([
          StorageService.getInstallments(),
          StorageService.getTransactions(),
        ]);

        // Agendar lembrete diário
        if (this.settings.dailyReminder) {
          await this.scheduleDailyReminder();
        }

        // Agendar lembretes de parcelas
        if (this.settings.upcomingPayments) {
          await this.scheduleUpcomingPayments(installments, transactions);
        }

        // Agendar lembretes de parcelas vencidas
        if (this.settings.overduePayments) {
          await this.scheduleOverduePayments(installments, transactions);
        }
      },
      false
    );
  }

  // Agendar lembrete diário
  private static async scheduleDailyReminder(): Promise<void> {
    const [hours, minutes] = this.settings.dailyReminderTime.split(':').map(Number);
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💰 App Despesas',
        body: 'Hora de verificar suas finanças do dia!',
        sound: 'default',
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      },
    });
  }

  // Agendar lembretes de parcelas próximas
  private static async scheduleUpcomingPayments(
    installments: Installment[], 
    transactions: Transaction[]
  ): Promise<void> {
    const today = new Date();
    const upcomingDays = this.settings.upcomingPaymentsDays;

    for (const installment of installments) {
      if (installment.status !== 'active') continue;

      // Calcular próximas parcelas
      const startDate = new Date(installment.startDate);
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      for (let i = 1; i <= installment.totalInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i - 1);

        // Verificar se não foi paga
        const isPaid = installment.paidInstallments.includes(i) ||
                      transactions.some(t => 
                        t.installmentId === installment.id && 
                        t.installmentNumber === i
                      );

        if (!isPaid && dueDate > today) {
          const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff <= upcomingDays && daysDiff > 0) {
            const notificationDate = new Date(today);
            notificationDate.setDate(notificationDate.getDate() + daysDiff - 1);
            notificationDate.setHours(9, 0, 0, 0); // 9:00 AM

            await Notifications.scheduleNotificationAsync({
              content: {
                title: '📅 Parcela vencendo!',
                body: `${installment.description} - Parcela ${i}/${installment.totalInstallments} vence ${daysDiff === 1 ? 'amanhã' : `em ${daysDiff} dias`}`,
                sound: 'default',
                data: {
                  type: 'upcoming_payment',
                  installmentId: installment.id,
                  installmentNumber: i,
                },
              },
              trigger: notificationDate,
            });
          }
        }
      }
    }
  }

  // Agendar lembretes de parcelas vencidas
  private static async scheduleOverduePayments(
    installments: Installment[], 
    transactions: Transaction[]
  ): Promise<void> {
    const today = new Date();

    for (const installment of installments) {
      if (installment.status !== 'active') continue;

      const startDate = new Date(installment.startDate);

      for (let i = 1; i <= installment.totalInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i - 1);

        // Verificar se está vencida e não foi paga
        const isPaid = installment.paidInstallments.includes(i) ||
                      transactions.some(t => 
                        t.installmentId === installment.id && 
                        t.installmentNumber === i
                      );

        if (!isPaid && dueDate < today) {
          const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Enviar notificação em 1, 3, 7, 15 e 30 dias de atraso
          if ([1, 3, 7, 15, 30].includes(daysOverdue)) {
            const notificationDate = new Date();
            notificationDate.setHours(10, 0, 0, 0); // 10:00 AM

            await Notifications.scheduleNotificationAsync({
              content: {
                title: '⚠️ Parcela em atraso!',
                body: `${installment.description} - Parcela ${i}/${installment.totalInstallments} está ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} em atraso`,
                sound: 'default',
                data: {
                  type: 'overdue_payment',
                  installmentId: installment.id,
                  installmentNumber: i,
                  daysOverdue,
                },
              },
              trigger: notificationDate,
            });
          }
        }
      }
    }
  }

  // Enviar notificação imediata
  static async sendImmediateNotification(
    title: string, 
    body: string, 
    data?: any
  ): Promise<void> {
    if (!this.settings.enabled || this.isExpoGo()) {
      console.log(`[NotificationService] Would show notification: ${title} - ${body}`);
      return;
    }

    await ErrorHandler.withErrorHandling(
      'enviar notificação',
      async () => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: 'default',
            data,
          },
          trigger: null, // Imediata
        });
      },
      false
    );
  }

  // Cancelar todas as notificações
  static async cancelAllNotifications(): Promise<void> {
    await ErrorHandler.withErrorHandling(
      'cancelar notificações',
      async () => {
        await Notifications.cancelAllScheduledNotificationsAsync();
      },
      false
    );
  }

  // Verificar se há parcelas vencendo hoje
  static async checkTodaysPayments(): Promise<{
    upcoming: Array<{ installment: Installment; installmentNumber: number }>;
    overdue: Array<{ installment: Installment; installmentNumber: number; daysOverdue: number }>;
  }> {
    const result = await ErrorHandler.withErrorHandling(
      'verificar pagamentos de hoje',
      async () => {
        const [installments, transactions] = await Promise.all([
          StorageService.getInstallments(),
          StorageService.getTransactions(),
        ]);

        const today = new Date();
        const upcoming: Array<{ installment: Installment; installmentNumber: number }> = [];
        const overdue: Array<{ installment: Installment; installmentNumber: number; daysOverdue: number }> = [];

        for (const installment of installments) {
          if (installment.status !== 'active') continue;

          const startDate = new Date(installment.startDate);

          for (let i = 1; i <= installment.totalInstallments; i++) {
            const dueDate = new Date(startDate);
            dueDate.setMonth(dueDate.getMonth() + i - 1);

            const isPaid = installment.paidInstallments.includes(i) ||
                          transactions.some(t => 
                            t.installmentId === installment.id && 
                            t.installmentNumber === i
                          );

            if (!isPaid) {
              const daysDiff = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              
              if (daysDiff === 0) {
                // Vence hoje
                upcoming.push({ installment, installmentNumber: i });
              } else if (daysDiff > 0) {
                // Está vencida
                overdue.push({ installment, installmentNumber: i, daysOverdue: daysDiff });
              }
            }
          }
        }

        return { upcoming, overdue };
      },
      false
    );

    return result || { upcoming: [], overdue: [] };
  }

  // Lidar com resposta de notificação
  static handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data;
    
    if (data) {
      // Aqui você pode implementar navegação ou ações específicas
      // baseadas no tipo de notificação
      switch (data.type) {
        case 'upcoming_payment':
          // Navegar para detalhes do parcelamento
          break;
        case 'overdue_payment':
          // Navegar para detalhes do parcelamento com destaque
          break;
        default:
          // Ação padrão
          break;
      }
    }
  }
}