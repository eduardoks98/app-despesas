import { Request, Response } from 'express';
import { PIXService } from '../services/pix.service';
import { logger } from '../utils/logger';

export class PIXController {
  /**
   * Create PIX charge for one-time payment
   */
  static async createCharge(req: Request, res: Response) {
    try {
      const { amount, description, customerDocument } = req.body;
      const userId = req.user?.id;
      const userEmail = req.user?.email;
      const userName = req.user?.name;

      if (!userId || !userEmail) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      if (!customerDocument) {
        return res.status(400).json({ error: 'Customer document (CPF/CNPJ) is required' });
      }

      // Validate Brazilian document
      if (!PIXService.validateDocument(customerDocument)) {
        return res.status(400).json({ error: 'Invalid CPF/CNPJ format' });
      }

      const charge = await PIXService.createCharge({
        amount: Number(amount),
        description: description || 'Pagamento App Despesas',
        customerId: userId.toString(),
        customerName: userName || userEmail,
        customerEmail: userEmail,
        customerDocument,
        expiresIn: 3600, // 1 hour
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/pix`,
      });

      res.json({
        chargeId: charge.id,
        qrCode: charge.qrCode,
        qrCodeImage: charge.qrCodeImage,
        pixKey: charge.pixKey,
        amount: charge.amount,
        formattedAmount: PIXService.formatCurrency(charge.amount),
        expiresAt: charge.expiresAt,
        status: charge.status,
      });
    } catch (error) {
      logger.error('Failed to create PIX charge', error);
      res.status(500).json({ error: 'Failed to create PIX charge' });
    }
  }

  /**
   * Get PIX charge status
   */
  static async getCharge(req: Request, res: Response) {
    try {
      const { chargeId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const charge = await PIXService.getCharge(chargeId);

      if (!charge) {
        return res.status(404).json({ error: 'PIX charge not found' });
      }

      // Verify charge belongs to user
      if (charge.customer.id !== userId.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      res.json({
        chargeId: charge.id,
        amount: charge.amount,
        formattedAmount: PIXService.formatCurrency(charge.amount),
        status: charge.status,
        expiresAt: charge.expiresAt,
        createdAt: charge.createdAt,
        paidAt: charge.paidAt,
      });
    } catch (error) {
      logger.error('Failed to get PIX charge', { chargeId: req.params.chargeId, error });
      res.status(500).json({ error: 'Failed to get PIX charge' });
    }
  }

  /**
   * Cancel PIX charge
   */
  static async cancelCharge(req: Request, res: Response) {
    try {
      const { chargeId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // First verify the charge exists and belongs to user
      const charge = await PIXService.getCharge(chargeId);

      if (!charge) {
        return res.status(404).json({ error: 'PIX charge not found' });
      }

      if (charge.customer.id !== userId.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (charge.status !== 'pending') {
        return res.status(400).json({ 
          error: `Cannot cancel charge with status: ${charge.status}` 
        });
      }

      const cancelled = await PIXService.cancelCharge(chargeId);

      if (!cancelled) {
        return res.status(500).json({ error: 'Failed to cancel PIX charge' });
      }

      res.json({ message: 'PIX charge cancelled successfully' });
    } catch (error) {
      logger.error('Failed to cancel PIX charge', { chargeId: req.params.chargeId, error });
      res.status(500).json({ error: 'Failed to cancel PIX charge' });
    }
  }

  /**
   * Handle PIX webhooks
   */
  static async handleWebhook(req: Request, res: Response) {
    try {
      const signature = req.headers['x-pix-signature'] as string;

      if (!signature) {
        return res.status(400).json({ error: 'Missing webhook signature' });
      }

      const payload = JSON.stringify(req.body);
      const event = PIXService.processWebhookEvent(payload, signature);

      if (!event) {
        return res.status(400).json({ error: 'Invalid webhook event' });
      }

      // Process different event types
      await PIXController.processWebhookEvent(event);

      res.json({ received: true });
    } catch (error) {
      logger.error('PIX webhook processing failed', error);
      res.status(400).json({ error: 'Webhook processing failed' });
    }
  }

  /**
   * Process PIX webhook events
   */
  private static async processWebhookEvent(event: any) {
    logger.info('Processing PIX webhook event', { 
      eventType: event.type,
      chargeId: event.chargeId 
    });

    switch (event.type) {
      case 'payment.paid':
        await PIXController.handlePaymentPaid(event);
        break;

      case 'payment.expired':
        await PIXController.handlePaymentExpired(event);
        break;

      case 'payment.cancelled':
        await PIXController.handlePaymentCancelled(event);
        break;

      default:
        logger.info('Unhandled PIX webhook event type', { eventType: event.type });
    }
  }

  private static async handlePaymentPaid(event: any) {
    logger.info('PIX payment paid', { 
      chargeId: event.chargeId,
      amount: event.paidAmount 
    });
    
    // Update payment status in database
    // Send confirmation email
    // Update user premium status if applicable
    // Add transaction record
  }

  private static async handlePaymentExpired(event: any) {
    logger.info('PIX payment expired', { chargeId: event.chargeId });
    
    // Update payment status in database
    // Send notification about expired payment
  }

  private static async handlePaymentCancelled(event: any) {
    logger.info('PIX payment cancelled', { chargeId: event.chargeId });
    
    // Update payment status in database
  }

  /**
   * List user's PIX charges
   */
  static async getUserCharges(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // In a real implementation, this would query the database
      // For now, return empty array
      const charges: any[] = [];

      res.json({ charges });
    } catch (error) {
      logger.error('Failed to get user PIX charges', { userId: req.user?.id, error });
      res.status(500).json({ error: 'Failed to get PIX charges' });
    }
  }

  /**
   * Get PIX key information for manual payments
   */
  static async getPixKey(req: Request, res: Response) {
    try {
      const pixKey = process.env.PIX_KEY;

      if (!pixKey) {
        return res.status(500).json({ error: 'PIX key not configured' });
      }

      res.json({
        pixKey,
        recipient: 'App Despesas',
        description: 'Use this PIX key for manual payments',
        note: 'After payment, contact support with transaction details',
      });
    } catch (error) {
      logger.error('Failed to get PIX key', error);
      res.status(500).json({ error: 'Failed to get PIX key' });
    }
  }
}