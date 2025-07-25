/**
 * Trial Routes
 * 
 * Handles trial-related API routes
 */

import { Router } from 'express';
import { TrialController } from '../controllers/trial.controller';
import { auth, requireActivePremium } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = Router();
const trialController = new TrialController();

// Apply authentication to all trial routes
router.use(auth);

// Apply rate limiting
router.use(rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
}));

// Trial management
router.post('/start', trialController.startTrial);
router.get('/status', trialController.getTrialStatus);
router.get('/eligibility', trialController.checkTrialEligibility);
router.post('/convert', trialController.convertTrial);

// Admin routes (require active premium - these would typically require admin role)
router.post('/extend', requireActivePremium, trialController.extendTrial);
router.get('/analytics', requireActivePremium, trialController.getTrialAnalytics);

export { router as trialRoutes };