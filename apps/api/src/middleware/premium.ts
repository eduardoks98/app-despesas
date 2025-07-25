/**
 * Premium Middleware
 * 
 * Handles automatic upgrade/downgrade logic and premium feature access
 */

import { Request, Response, NextFunction } from 'express';
import { Database } from '../config/database';
import { logger } from '../utils/logger';

export interface PremiumUser {
  id: string;
  email: string;
  isPremium: boolean;
  subscriptionStatus: string;
  subscriptionExpiresAt: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

/**
 * Check and update user premium status based on subscription
 */
export const updatePremiumStatus = async (userId: string): Promise<void> => {
  try {
    const db = Database.getInstance();
    
    const user = await db.queryOne<PremiumUser>(
      `SELECT id, email, isPremium, subscriptionStatus, subscriptionExpiresAt, 
              stripeCustomerId, stripeSubscriptionId 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    let shouldBePremium = false;

    // Check if subscription is active and not expired
    if (user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing') {
      if (!user.subscriptionExpiresAt || user.subscriptionExpiresAt > now) {
        shouldBePremium = true;
      }
    }

    // Update user status if it doesn't match
    if (user.isPremium !== shouldBePremium) {
      await db.query(
        'UPDATE users SET isPremium = ?, updatedAt = NOW() WHERE id = ?',
        [shouldBePremium, userId]
      );

      logger.info('User premium status updated', {
        userId,
        isPremium: shouldBePremium,
        subscriptionStatus: user.subscriptionStatus,
        expiresAt: user.subscriptionExpiresAt
      });

      // Log the upgrade/downgrade event
      await db.query(
        `INSERT INTO sync_logs (id, user_id, entity_type, entity_id, action, data, synced_at)
         VALUES (UUID(), ?, 'user', ?, ?, ?, NOW())`,
        [
          userId,
          userId,
          shouldBePremium ? 'upgrade' : 'downgrade',
          JSON.stringify({
            previousStatus: user.isPremium,
            newStatus: shouldBePremium,
            subscriptionStatus: user.subscriptionStatus,
            expiresAt: user.subscriptionExpiresAt
          })
        ]
      );
    }
  } catch (error) {
    logger.error('Failed to update premium status', { userId, error });
    throw error;
  }
};

/**
 * Middleware to ensure user premium status is up to date
 */
export const syncPremiumStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.id) {
      await updatePremiumStatus(req.user.id);
      
      // Refresh user data with updated premium status
      const db = Database.getInstance();
      const updatedUser = await db.queryOne<PremiumUser>(
        `SELECT id, email, isPremium, subscriptionStatus, subscriptionExpiresAt
         FROM users WHERE id = ?`,
        [req.user.id]
      );

      if (updatedUser) {
        req.user = { ...req.user, ...updatedUser };
      }
    }
    
    next();
  } catch (error) {
    logger.error('Premium status sync failed', { error });
    next(); // Continue even if sync fails
  }
};

/**
 * Check if user should be downgraded (expired subscription)
 */
export const checkForDowngrades = async (): Promise<void> => {
  try {
    const db = Database.getInstance();
    
    // Find users who should be downgraded
    const expiredUsers = await db.query<PremiumUser>(
      `SELECT id, email, subscriptionStatus, subscriptionExpiresAt
       FROM users 
       WHERE isPremium = TRUE 
       AND (
         subscriptionExpiresAt < NOW() 
         OR subscriptionStatus IN ('canceled', 'incomplete_expired', 'unpaid')
       )`
    );

    for (const user of expiredUsers) {
      await updatePremiumStatus(user.id);
      
      logger.info('User automatically downgraded', {
        userId: user.id,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        expiresAt: user.subscriptionExpiresAt
      });

      // Send downgrade notification
      await db.query(
        `INSERT INTO notifications (id, userId, type, title, message, createdAt)
         VALUES (UUID(), ?, 'subscription_expired', 'Subscription Expired', 
                'Your premium subscription has expired. Upgrade to continue using premium features.', NOW())`,
        [user.id]
      );
    }

    if (expiredUsers.length > 0) {
      logger.info('Batch downgrade completed', { count: expiredUsers.length });
    }
  } catch (error) {
    logger.error('Failed to check for downgrades', { error });
  }
};

/**
 * Schedule periodic checks for downgrades
 */
export const startPremiumStatusScheduler = (): void => {
  // Check every hour
  setInterval(async () => {
    await checkForDowngrades();
  }, 60 * 60 * 1000);

  // Run initial check
  setTimeout(async () => {
    await checkForDowngrades();
  }, 5000); // Wait 5 seconds after startup

  logger.info('Premium status scheduler started');
};

/**
 * Manually trigger premium status check for all users
 */
export const auditAllPremiumStatuses = async (): Promise<{ updated: number; errors: number }> => {
  try {
    const db = Database.getInstance();
    
    const allUsers = await db.query<{ id: string }>(
      'SELECT id FROM users WHERE isPremium = TRUE OR stripeSubscriptionId IS NOT NULL'
    );

    let updated = 0;
    let errors = 0;

    for (const user of allUsers) {
      try {
        const beforeUser = await db.queryOne<PremiumUser>(
          'SELECT isPremium FROM users WHERE id = ?',
          [user.id]
        );

        await updatePremiumStatus(user.id);

        const afterUser = await db.queryOne<PremiumUser>(
          'SELECT isPremium FROM users WHERE id = ?',
          [user.id]
        );

        if (beforeUser?.isPremium !== afterUser?.isPremium) {
          updated++;
        }
      } catch (error) {
        errors++;
        logger.error('Failed to audit user premium status', { userId: user.id, error });
      }
    }

    logger.info('Premium status audit completed', { 
      total: allUsers.length, 
      updated, 
      errors 
    });

    return { updated, errors };
  } catch (error) {
    logger.error('Failed to audit premium statuses', { error });
    throw error;
  }
};

/**
 * Get premium statistics
 */
export const getPremiumStats = async (): Promise<{
  totalUsers: number;
  premiumUsers: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  trialUsers: number;
  conversionRate: number;
}> => {
  try {
    const db = Database.getInstance();
    
    const stats = await db.queryOne<any>(
      `SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN isPremium = TRUE THEN 1 ELSE 0 END) as premiumUsers,
        SUM(CASE WHEN subscriptionStatus = 'active' THEN 1 ELSE 0 END) as activeSubscriptions,
        SUM(CASE WHEN subscriptionStatus IN ('canceled', 'incomplete_expired', 'unpaid') THEN 1 ELSE 0 END) as expiredSubscriptions,
        SUM(CASE WHEN subscriptionStatus = 'trialing' THEN 1 ELSE 0 END) as trialUsers
       FROM users`
    );

    const conversionRate = stats.totalUsers > 0 
      ? (stats.premiumUsers / stats.totalUsers) * 100 
      : 0;

    return {
      totalUsers: stats.totalUsers || 0,
      premiumUsers: stats.premiumUsers || 0,
      activeSubscriptions: stats.activeSubscriptions || 0,
      expiredSubscriptions: stats.expiredSubscriptions || 0,
      trialUsers: stats.trialUsers || 0,
      conversionRate: parseFloat(conversionRate.toFixed(2))
    };
  } catch (error) {
    logger.error('Failed to get premium stats', { error });
    throw error;
  }
};