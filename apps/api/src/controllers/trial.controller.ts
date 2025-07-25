/**
 * Trial Controller
 * 
 * Handles trial-related API endpoints
 */

import { Request, Response } from 'express';
import { TrialService } from '../services/TrialService';
import { logger } from '../utils/logger';

export class TrialController {
  private trialService: TrialService;

  constructor() {
    this.trialService = TrialService.getInstance();
  }

  /**
   * Start free trial
   */
  startTrial = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { deviceId } = req.body;

      const result = await this.trialService.startTrial(userId, deviceId);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          trialEndDate: result.trialEndDate
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Failed to start trial:', error);
      res.status(500).json({ error: 'Failed to start trial' });
    }
  };

  /**
   * Get trial status
   */
  getTrialStatus = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const trialStatus = await this.trialService.getTrialStatus(userId);

      res.json({ trial: trialStatus });
    } catch (error) {
      logger.error('Failed to get trial status:', error);
      res.status(500).json({ error: 'Failed to get trial status' });
    }
  };

  /**
   * Convert trial to subscription
   */
  convertTrial = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { priceId, paymentMethodId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const result = await this.trialService.convertTrialToSubscription(
        userId, 
        priceId, 
        paymentMethodId
      );

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          subscriptionId: result.subscriptionId
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Failed to convert trial:', error);
      res.status(500).json({ error: 'Failed to convert trial' });
    }
  };

  /**
   * Extend trial (admin only)
   */
  extendTrial = async (req: Request, res: Response) => {
    try {
      const { userId, additionalDays } = req.body;

      if (!userId || !additionalDays) {
        return res.status(400).json({ 
          error: 'User ID and additional days are required' 
        });
      }

      if (additionalDays < 1 || additionalDays > 30) {
        return res.status(400).json({ 
          error: 'Additional days must be between 1 and 30' 
        });
      }

      const result = await this.trialService.extendTrial(userId, additionalDays);

      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          newTrialEndDate: result.newTrialEndDate
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      logger.error('Failed to extend trial:', error);
      res.status(500).json({ error: 'Failed to extend trial' });
    }
  };

  /**
   * Get trial analytics (admin only)
   */
  getTrialAnalytics = async (req: Request, res: Response) => {
    try {
      const analytics = await this.trialService.getTrialAnalytics();
      res.json({ analytics });
    } catch (error) {
      logger.error('Failed to get trial analytics:', error);
      res.status(500).json({ error: 'Failed to get trial analytics' });
    }
  };

  /**
   * Check if user is eligible for trial
   */
  checkTrialEligibility = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { deviceId } = req.query;

      // Get user info
      const db = require('../config/database').Database.getInstance();
      const user = await db.queryOne(`
        SELECT id, email, hasUsedTrial, subscriptionStatus
        FROM users WHERE id = ?
      `, [userId]);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let eligible = true;
      let reason = '';

      // Check if already has subscription
      if (['active', 'trialing'].includes(user.subscriptionStatus)) {
        eligible = false;
        reason = 'User already has an active subscription';
      }
      // Check if already used trial
      else if (user.hasUsedTrial) {
        eligible = false;
        reason = 'Trial has already been used for this account';
      }
      // Check email-based trial limit
      else {
        const emailTrialCount = await db.queryOne(`
          SELECT COUNT(*) as count 
          FROM users 
          WHERE email = ? AND hasUsedTrial = TRUE
        `, [user.email]);

        if (emailTrialCount && emailTrialCount.count >= 1) {
          eligible = false;
          reason = 'Trial limit reached for this email';
        }
      }

      // Check device-based trial limit if deviceId provided
      if (eligible && deviceId) {
        const deviceTrialCount = await db.queryOne(`
          SELECT COUNT(*) as count 
          FROM trial_devices 
          WHERE deviceId = ?
        `, [deviceId]);

        if (deviceTrialCount && deviceTrialCount.count >= 3) {
          eligible = false;
          reason = 'Trial limit reached for this device';
        }
      }

      res.json({
        eligible,
        reason: eligible ? 'User is eligible for free trial' : reason,
        trialDuration: 14
      });
    } catch (error) {
      logger.error('Failed to check trial eligibility:', error);
      res.status(500).json({ error: 'Failed to check trial eligibility' });
    }
  };
}