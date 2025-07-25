import crypto from 'crypto';
import { logger } from '../utils/logger';

// PIX integration using a hypothetical Brazilian payment provider
// This is a simplified implementation for demonstration

export interface PIXChargeData {
  amount: number;
  description: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerDocument: string; // CPF or CNPJ
  expiresIn?: number; // seconds, default 3600 (1 hour)
  callbackUrl?: string;
}

export interface PIXCharge {
  id: string;
  qrCode: string;
  qrCodeImage: string;
  pixKey: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
  paidAt?: Date;
  customer: {
    id: string;
    name: string;
    email: string;
    document: string;
  };
}

export interface PIXWebhookEvent {
  type: 'payment.paid' | 'payment.expired' | 'payment.cancelled';
  chargeId: string;
  charge: PIXCharge;
  paidAmount?: number;
  paidAt?: Date;
}

export class PIXService {
  private static readonly API_BASE_URL = process.env.PIX_API_URL || 'https://api.pixprovider.com';
  private static readonly API_KEY = process.env.PIX_API_KEY;
  private static readonly WEBHOOK_SECRET = process.env.PIX_WEBHOOK_SECRET;

  /**
   * Create a PIX charge
   */
  static async createCharge(data: PIXChargeData): Promise<PIXCharge> {
    try {
      if (!this.API_KEY) {
        throw new Error('PIX API key not configured');
      }

      const payload = {
        external_id: crypto.randomUUID(),
        amount: Math.round(data.amount * 100), // Convert to cents
        description: data.description,
        expires_in: data.expiresIn || 3600,
        customer: {
          name: data.customerName,
          email: data.customerEmail,
          document: data.customerDocument,
        },
        callback_url: data.callbackUrl,
      };

      // Simulate API call - replace with actual PIX provider API
      const charge = this.simulatePixCharge(payload, data);

      logger.info('PIX charge created', {
        chargeId: charge.id,
        amount: charge.amount,
        customerId: data.customerId,
      });

      return charge;
    } catch (error) {
      logger.error('Failed to create PIX charge', error);
      throw new Error('Failed to create PIX charge');
    }
  }

  /**
   * Get PIX charge by ID
   */
  static async getCharge(chargeId: string): Promise<PIXCharge | null> {
    try {
      if (!this.API_KEY) {
        throw new Error('PIX API key not configured');
      }

      // Simulate API call - replace with actual PIX provider API
      const charge = this.simulateGetCharge(chargeId);

      return charge;
    } catch (error) {
      logger.error('Failed to get PIX charge', { chargeId, error });
      return null;
    }
  }

  /**
   * Cancel PIX charge
   */
  static async cancelCharge(chargeId: string): Promise<boolean> {
    try {
      if (!this.API_KEY) {
        throw new Error('PIX API key not configured');
      }

      // Simulate API call - replace with actual PIX provider API
      logger.info('PIX charge cancelled', { chargeId });

      return true;
    } catch (error) {
      logger.error('Failed to cancel PIX charge', { chargeId, error });
      return false;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!this.WEBHOOK_SECRET) {
        throw new Error('PIX webhook secret not configured');
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Failed to verify PIX webhook signature', error);
      return false;
    }
  }

  /**
   * Process webhook event
   */
  static processWebhookEvent(payload: string, signature: string): PIXWebhookEvent | null {
    try {
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }

      const event = JSON.parse(payload) as PIXWebhookEvent;

      logger.info('PIX webhook event received', {
        type: event.type,
        chargeId: event.chargeId,
      });

      return event;
    } catch (error) {
      logger.error('Failed to process PIX webhook event', error);
      return null;
    }
  }

  /**
   * Generate PIX QR Code data
   */
  static generateQRCodeData(pixKey: string, amount: number, description: string): string {
    // Simplified PIX QR Code format (EMV format)
    const merchantName = 'APP DESPESAS';
    const merchantCity = 'SAO PAULO';
    const merchantCategoryCode = '0000';
    
    // This is a simplified version - real implementation would follow EMV QR Code specification
    const qrData = `00020101021226${pixKey.length.toString().padStart(2, '0')}${pixKey}5204${merchantCategoryCode}5303986540${amount.toFixed(2).replace('.', '')}5802BR59${merchantName.length.toString().padStart(2, '0')}${merchantName}60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}62${description.length.toString().padStart(2, '0')}${description}`;
    
    return qrData;
  }

  /**
   * Simulate PIX charge creation (replace with real API call)
   */
  private static simulatePixCharge(payload: any, data: PIXChargeData): PIXCharge {
    const chargeId = `pix_${crypto.randomUUID()}`;
    const pixKey = process.env.PIX_KEY || '12345678901'; // CPF, email, phone or random key
    const qrCodeData = this.generateQRCodeData(pixKey, data.amount, data.description);
    
    return {
      id: chargeId,
      qrCode: qrCodeData,
      qrCodeImage: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeData)}`,
      pixKey,
      amount: data.amount,
      status: 'pending',
      expiresAt: new Date(Date.now() + (data.expiresIn || 3600) * 1000),
      createdAt: new Date(),
      customer: {
        id: data.customerId,
        name: data.customerName,
        email: data.customerEmail,
        document: data.customerDocument,
      },
    };
  }

  /**
   * Simulate getting PIX charge (replace with real API call)
   */
  private static simulateGetCharge(chargeId: string): PIXCharge | null {
    // In a real implementation, this would fetch from the PIX provider API
    // For simulation, return null if charge doesn't exist
    return null;
  }

  /**
   * Format currency for PIX
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  }

  /**
   * Validate Brazilian document (CPF/CNPJ)
   */
  static validateDocument(document: string): boolean {
    // Remove non-digits
    const cleanDocument = document.replace(/\D/g, '');

    // Check CPF (11 digits)
    if (cleanDocument.length === 11) {
      return this.validateCPF(cleanDocument);
    }

    // Check CNPJ (14 digits)
    if (cleanDocument.length === 14) {
      return this.validateCNPJ(cleanDocument);
    }

    return false;
  }

  /**
   * Validate CPF
   */
  private static validateCPF(cpf: string): boolean {
    // Basic CPF validation
    if (cpf === '00000000000' || cpf.length !== 11) {
      return false;
    }

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }

    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }

  /**
   * Validate CNPJ
   */
  private static validateCNPJ(cnpj: string): boolean {
    // Basic CNPJ validation
    if (cnpj === '00000000000000' || cnpj.length !== 14) {
      return false;
    }

    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;

    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(1))) return false;

    return true;
  }
}