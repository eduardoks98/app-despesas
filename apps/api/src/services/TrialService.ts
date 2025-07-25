/**
 * Trial Service
 * 
 * Handles free trial management and conversion tracking
 */

import { Database } from '../config/database';
import { PaymentService } from './PaymentService';
import { logger } from '../utils/logger';

export interface TrialUser {
  id: string;
  email: string;
  name: string;
  trialStartDate: Date;
  trialEndDate: Date;
  trialDaysRemaining: number;
  hasTrialExpired: boolean;
  hasUsedTrial: boolean;
}

export interface TrialConfig {
  trialDuration: number; // days
  maxTrialsPerEmail: number;
  maxTrialsPerDevice: number;
  enableTrialExtensions: boolean;
  reminderDays: number[]; // days before expiration to send reminders
}

export class TrialService {
  private static instance: TrialService;
  private db: Database;
  private paymentService: PaymentService;

  private config: TrialConfig = {
    trialDuration: 14, // 14 days free trial
    maxTrialsPerEmail: 1,
    maxTrialsPerDevice: 3,
    enableTrialExtensions: true,
    reminderDays: [7, 3, 1] // remind at 7, 3, and 1 day before expiration
  };

  private constructor() {
    this.db = Database.getInstance();
    this.paymentService = PaymentService.getInstance();
  }

  public static getInstance(): TrialService {
    if (!TrialService.instance) {
      TrialService.instance = new TrialService();
    }
    return TrialService.instance;
  }

  /**
   * Start free trial for user
   */
  async startTrial(userId: string, deviceId?: string): Promise<{
    success: boolean;
    trialEndDate?: Date;
    message: string;
  }> {
    try {
      const user = await this.db.queryOne<{
        id: string;
        email: string;
        hasUsedTrial: boolean;
        subscriptionStatus: string;
      }>(
        'SELECT id, email, hasUsedTrial, subscriptionStatus FROM users WHERE id = ?',
        [userId]
      );

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Check if user already has an active subscription
      if (['active', 'trialing'].includes(user.subscriptionStatus)) {
        return { success: false, message: 'User already has an active subscription' };
      }

      // Check if user has already used their trial
      if (user.hasUsedTrial) {
        return { success: false, message: 'Trial has already been used for this account' };
      }

      // Check email-based trial limit
      const emailTrialCount = await this.db.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM users WHERE email = ? AND hasUsedTrial = TRUE',
        [user.email]
      );

      if (emailTrialCount && emailTrialCount.count >= this.config.maxTrialsPerEmail) {
        return { success: false, message: 'Trial limit reached for this email' };
      }

      // Check device-based trial limit if deviceId provided
      if (deviceId) {
        const deviceTrialCount = await this.db.queryOne<{ count: number }>(
          'SELECT COUNT(*) as count FROM trial_devices WHERE deviceId = ?',
          [deviceId]
        );

        if (deviceTrialCount && deviceTrialCount.count >= this.config.maxTrialsPerDevice) {
          return { success: false, message: 'Trial limit reached for this device' };
        }
      }

      // Calculate trial dates
      const trialStartDate = new Date();
      const trialEndDate = new Date();
      trialEndDate.setDate(trialStartDate.getDate() + this.config.trialDuration);

      // Start trial
      await this.db.query(
        `UPDATE users 
         SET isPremium = TRUE,
             subscriptionStatus = 'trialing',
             subscriptionExpiresAt = ?,
             hasUsedTrial = TRUE,
             trialStartDate = ?,
             trialEndDate = ?,
             updatedAt = NOW()
         WHERE id = ?`,
        [
          trialEndDate.toISOString().slice(0, 19).replace('T', ' '),
          trialStartDate.toISOString().slice(0, 19).replace('T', ' '),
          trialEndDate.toISOString().slice(0, 19).replace('T', ' '),
          userId
        ]
      );

      // Record device if provided
      if (deviceId) {
        await this.db.query(
          `INSERT INTO trial_devices (id, userId, deviceId, createdAt)
           VALUES (UUID(), ?, ?, NOW())
           ON DUPLICATE KEY UPDATE userId = VALUES(userId)`,
          [userId, deviceId]
        );
      }

      // Log trial start
      await this.db.query(
        `INSERT INTO sync_logs (id, user_id, entity_type, entity_id, action, data, synced_at)
         VALUES (UUID(), ?, 'trial', ?, 'started', ?, NOW())`,
        [userId, userId, JSON.stringify({
          trialDuration: this.config.trialDuration,
          trialEndDate: trialEndDate.toISOString(),
          deviceId
        })]
      );

      logger.info('Trial started for user', { 
        userId, 
        email: user.email,
        trialEndDate,
        deviceId 
      });

      return {
        success: true,
        trialEndDate,
        message: `Trial started successfully. Expires on ${trialEndDate.toLocaleDateString()}`
      };
    } catch (error) {
      logger.error('Failed to start trial', { userId, error });
      return { success: false, message: 'Failed to start trial' };
    }
  }

  /**
   * Get trial status for user
   */
  async getTrialStatus(userId: string): Promise<TrialUser | null> {
    try {
      const user = await this.db.queryOne<{
        id: string;
        email: string;
        name: string;
        trialStartDate: Date;
        trialEndDate: Date;
        hasUsedTrial: boolean;
        subscriptionStatus: string;
      }>(
        `SELECT id, email, name, trialStartDate, trialEndDate, hasUsedTrial, subscriptionStatus
         FROM users WHERE id = ?`,
        [userId]
      );

      if (!user || !user.trialEndDate) {
        return null;
      }

      const now = new Date();
      const trialEndDate = new Date(user.trialEndDate);
      const hasTrialExpired = now > trialEndDate;
      const trialDaysRemaining = hasTrialExpired 
        ? 0 
        : Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        trialStartDate: new Date(user.trialStartDate),
        trialEndDate,
        trialDaysRemaining,
        hasTrialExpired,
        hasUsedTrial: user.hasUsedTrial
      };
    } catch (error) {
      logger.error('Failed to get trial status', { userId, error });
      return null;
    }
  }

  /**
   * Convert trial to paid subscription
   */
  async convertTrialToSubscription(
    userId: string, 
    priceId: string,
    paymentMethodId?: string
  ): Promise<{ success: boolean; subscriptionId?: string; message: string }> {
    try {
      const trialStatus = await this.getTrialStatus(userId);
      
      if (!trialStatus) {
        return { success: false, message: 'No active trial found' };
      }

      if (trialStatus.hasTrialExpired) {
        return { success: false, message: 'Trial has already expired' };
      }

      // Create subscription through PaymentService
      const customerId = await this.paymentService.getOrCreateCustomer(userId);
      
      const subscription = await this.paymentService.createSubscription({
        customerId,
        priceId,
        userId,
        trialDays: 0 // No additional trial since user is already on trial
      });

      // Log conversion
      await this.db.query(
        `INSERT INTO sync_logs (id, user_id, entity_type, entity_id, action, data, synced_at)
         VALUES (UUID(), ?, 'trial', ?, 'converted', ?, NOW())`,
        [userId, userId, JSON.stringify({
          subscriptionId: subscription.id,
          priceId,
          trialDaysRemaining: trialStatus.trialDaysRemaining
        })]
      );

      logger.info('Trial converted to subscription', { 
        userId, 
        subscriptionId: subscription.id,
        trialDaysRemaining: trialStatus.trialDaysRemaining
      });

      return {
        success: true,
        subscriptionId: subscription.id,
        message: 'Trial successfully converted to paid subscription'
      };
    } catch (error) {
      logger.error('Failed to convert trial', { userId, error });
      return { success: false, message: 'Failed to convert trial to subscription' };
    }
  }

  /**
   * Extend trial (admin function)
   */
  async extendTrial(userId: string, additionalDays: number): Promise<{
    success: boolean;
    newTrialEndDate?: Date;
    message: string;
  }> {
    try {
      if (!this.config.enableTrialExtensions) {
        return { success: false, message: 'Trial extensions are not enabled' };
      }

      const trialStatus = await this.getTrialStatus(userId);
      
      if (!trialStatus) {
        return { success: false, message: 'No trial found for user' };
      }

      const newTrialEndDate = new Date(trialStatus.trialEndDate);
      newTrialEndDate.setDate(newTrialEndDate.getDate() + additionalDays);

      await this.db.query(
        `UPDATE users 
         SET trialEndDate = ?, subscriptionExpiresAt = ?, updatedAt = NOW()
         WHERE id = ?`,
        [
          newTrialEndDate.toISOString().slice(0, 19).replace('T', ' '),
          newTrialEndDate.toISOString().slice(0, 19).replace('T', ' '),
          userId
        ]
      );

      // Log extension
      await this.db.query(
        `INSERT INTO sync_logs (id, user_id, entity_type, entity_id, action, data, synced_at)
         VALUES (UUID(), ?, 'trial', ?, 'extended', ?, NOW())`,
        [userId, userId, JSON.stringify({
          additionalDays,
          previousEndDate: trialStatus.trialEndDate,
          newEndDate: newTrialEndDate
        })]
      );

      logger.info('Trial extended', { 
        userId, 
        additionalDays,
        newTrialEndDate 
      });

      return {
        success: true,
        newTrialEndDate,
        message: `Trial extended by ${additionalDays} days`
      };
    } catch (error) {
      logger.error('Failed to extend trial', { userId, error });
      return { success: false, message: 'Failed to extend trial' };
    }
  }

  /**
   * Check for expiring trials and send reminders
   */
  async checkExpiringTrials(): Promise<void> {
    try {
      for (const reminderDay of this.config.reminderDays) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + reminderDay);
        reminderDate.setHours(0, 0, 0, 0);

        const nextDay = new Date(reminderDate);
        nextDay.setDate(nextDay.getDate() + 1);

        const expiringUsers = await this.db.query<{
          id: string;
          email: string;
          name: string;
          trialEndDate: Date;
        }>(
          `SELECT id, email, name, trialEndDate
           FROM users 
           WHERE subscriptionStatus = 'trialing'
           AND trialEndDate >= ? AND trialEndDate < ?
           AND id NOT IN (
             SELECT userId FROM notifications 
             WHERE type = 'trial_reminder' 
             AND JSON_EXTRACT(data, '$.reminderDay') = ?
             AND createdAt > DATE_SUB(NOW(), INTERVAL 1 DAY)
           )`,
          [
            reminderDate.toISOString().slice(0, 19).replace('T', ' '),
            nextDay.toISOString().slice(0, 19).replace('T', ' '),
            reminderDay
          ]
        );

        for (const user of expiringUsers) {
          await this.sendTrialReminder(user.id, reminderDay);
        }

        if (expiringUsers.length > 0) {
          logger.info('Trial reminders sent', { 
            reminderDay, 
            count: expiringUsers.length 
          });
        }
      }
    } catch (error) {
      logger.error('Failed to check expiring trials', { error });
    }
  }

  /**
   * Send trial reminder notification
   */
  private async sendTrialReminder(userId: string, reminderDay: number): Promise<void> {
    try {
      const message = reminderDay === 1 
        ? 'Your free trial expires tomorrow! Upgrade now to continue using premium features.'
        : `Your free trial expires in ${reminderDay} days. Upgrade now to continue using premium features.`;

      await this.db.query(
        `INSERT INTO notifications (id, userId, type, title, message, data, createdAt)
         VALUES (UUID(), ?, 'trial_reminder', 'Trial Expiring Soon', ?, ?, NOW())`,
        [userId, message, JSON.stringify({ reminderDay })]
      );
    } catch (error) {
      logger.error('Failed to send trial reminder', { userId, reminderDay, error });
    }
  }

  /**
   * Process expired trials
   */
  async processExpiredTrials(): Promise<void> {
    try {
      const expiredUsers = await this.db.query<{
        id: string;
        email: string;
      }>(
        `SELECT id, email
         FROM users 
         WHERE subscriptionStatus = 'trialing'
         AND trialEndDate < NOW()
         AND isPremium = TRUE`
      );

      for (const user of expiredUsers) {
        // Downgrade user
        await this.db.query(
          `UPDATE users 
           SET isPremium = FALSE, subscriptionStatus = 'trial_expired', updatedAt = NOW()
           WHERE id = ?`,
          [user.id]
        );

        // Send trial expired notification
        await this.db.query(
          `INSERT INTO notifications (id, userId, type, title, message, createdAt)
           VALUES (UUID(), ?, 'trial_expired', 'Trial Expired', 
                  'Your free trial has expired. Upgrade to premium to continue using all features.', NOW())`,
          [user.id]
        );

        // Log expiration
        await this.db.query(
          `INSERT INTO sync_logs (id, user_id, entity_type, entity_id, action, data, synced_at)
           VALUES (UUID(), ?, 'trial', ?, 'expired', '{}', NOW())`,
          [user.id, user.id]
        );
      }

      if (expiredUsers.length > 0) {
        logger.info('Expired trials processed', { count: expiredUsers.length });
      }
    } catch (error) {
      logger.error('Failed to process expired trials', { error });
    }
  }

  /**
   * Get trial analytics
   */
  async getTrialAnalytics(): Promise<{
    totalTrialsStarted: number;
    activeTrials: number;
    expiredTrials: number;
    convertedTrials: number;
    conversionRate: number;
    averageTrialDuration: number;
  }> {
    try {
      const stats = await this.db.queryOne<any>(
        `SELECT 
          COUNT(CASE WHEN hasUsedTrial = TRUE THEN 1 END) as totalTrialsStarted,
          COUNT(CASE WHEN subscriptionStatus = 'trialing' THEN 1 END) as activeTrials,
          COUNT(CASE WHEN subscriptionStatus = 'trial_expired' THEN 1 END) as expiredTrials,
          COUNT(CASE WHEN hasUsedTrial = TRUE AND subscriptionStatus = 'active' THEN 1 END) as convertedTrials
         FROM users`
      );

      const conversionRate = stats.totalTrialsStarted > 0 
        ? (stats.convertedTrials / stats.totalTrialsStarted) * 100 
        : 0;

      // Calculate average trial duration for converted users
      const durationResult = await this.db.queryOne<{ avgDuration: number }>(
        `SELECT AVG(DATEDIFF(COALESCE(subscriptionExpiresAt, NOW()), trialStartDate)) as avgDuration
         FROM users 
         WHERE hasUsedTrial = TRUE AND trialStartDate IS NOT NULL`
      );

      return {
        totalTrialsStarted: stats.totalTrialsStarted || 0,
        activeTrials: stats.activeTrials || 0,
        expiredTrials: stats.expiredTrials || 0,
        convertedTrials: stats.convertedTrials || 0,
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        averageTrialDuration: durationResult?.avgDuration || 0
      };
    } catch (error) {
      logger.error('Failed to get trial analytics', { error });
      throw error;
    }
  }

  /**
   * Start trial scheduler
   */
  startTrialScheduler(): void {
    // Check every hour for expiring trials
    setInterval(async () => {
      await this.checkExpiringTrials();
      await this.processExpiredTrials();
    }, 60 * 60 * 1000);

    // Run initial check after 30 seconds
    setTimeout(async () => {
      await this.checkExpiringTrials();
      await this.processExpiredTrials();
    }, 30000);

    logger.info('Trial scheduler started');
  }

  /**
   * Update trial configuration
   */
  updateConfig(newConfig: Partial<TrialConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Trial configuration updated', this.config);
  }
}