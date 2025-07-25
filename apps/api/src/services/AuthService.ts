/**
 * Authentication Service
 * 
 * Handles JWT token generation, validation, and user authentication
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { env } from '../config/env';
import { Database } from '../config/database';
import { logger } from '../utils/logger';

export interface JWTPayload {
  userId: string;
  email: string;
  isPremium: boolean;
  subscriptionStatus?: 'active' | 'trialing' | 'canceled' | 'expired';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  isPremium: boolean;
  subscriptionStatus?: string;
  stripeCustomerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthService {
  private static instance: AuthService;
  private db: Database;

  private constructor() {
    this.db = Database.getInstance();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Generate JWT tokens
   */
  public generateTokens(user: User): TokenPair {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      isPremium: user.isPremium,
      subscriptionStatus: user.subscriptionStatus as any
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: 'app-despesas',
      audience: 'app-despesas-users'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        issuer: 'app-despesas'
      }
    );

    // Calculate expiration in seconds
    const expiresIn = this.getExpiresInSeconds(env.JWT_EXPIRES_IN);

    return {
      accessToken,
      refreshToken,
      expiresIn
    };
  }

  /**
   * Verify access token
   */
  public verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET, {
        issuer: 'app-despesas',
        audience: 'app-despesas-users'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  public verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: 'app-despesas'
      }) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return { userId: decoded.userId };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Hash password
   */
  public async hashPassword(password: string): Promise<string> {
    const rounds = parseInt(env.BCRYPT_ROUNDS);
    return bcrypt.hash(password, rounds);
  }

  /**
   * Verify password
   */
  public async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate random token (for email verification, password reset, etc.)
   */
  public generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Authenticate user
   */
  public async authenticate(email: string, password: string): Promise<{ user: User; tokens: TokenPair }> {
    // Find user by email
    const user = await this.db.queryOne<User>(
      'SELECT * FROM users WHERE email = ? AND deletedAt IS NULL',
      [email]
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.password!);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.db.query(
      'UPDATE users SET lastLoginAt = NOW() WHERE id = ?',
      [user.id]
    );

    // Remove password from user object
    delete user.password;

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    logger.info('User authenticated successfully', { userId: user.id, email: user.email });

    return { user, tokens };
  }

  /**
   * Register new user
   */
  public async register(email: string, password: string, name: string): Promise<{ user: User; tokens: TokenPair }> {
    // Check if user exists
    const existingUser = await this.db.queryOne(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Generate user ID
    const userId = crypto.randomUUID();

    // Create user
    await this.db.query(
      `INSERT INTO users (id, email, password, name, isPremium, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, false, NOW(), NOW())`,
      [userId, email, hashedPassword, name]
    );

    // Get created user
    const user = await this.db.queryOne<User>(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Remove password from user object
    delete user.password;

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    return { user, tokens };
  }

  /**
   * Refresh access token
   */
  public async refreshToken(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const { userId } = this.verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const storedToken = await this.db.queryOne(
      'SELECT * FROM refresh_tokens WHERE token = ? AND userId = ? AND expiresAt > NOW()',
      [refreshToken, userId]
    );

    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    // Get user
    const user = await this.db.queryOne<User>(
      'SELECT * FROM users WHERE id = ? AND deletedAt IS NULL',
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Remove old refresh token
    await this.db.query(
      'DELETE FROM refresh_tokens WHERE token = ?',
      [refreshToken]
    );

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Store new refresh token
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  /**
   * Logout user (invalidate refresh token)
   */
  public async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Remove specific refresh token
      await this.db.query(
        'DELETE FROM refresh_tokens WHERE userId = ? AND token = ?',
        [userId, refreshToken]
      );
    } else {
      // Remove all refresh tokens for user
      await this.db.query(
        'DELETE FROM refresh_tokens WHERE userId = ?',
        [userId]
      );
    }

    logger.info('User logged out', { userId });
  }

  /**
   * Store refresh token
   */
  private async storeRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.db.query(
      `INSERT INTO refresh_tokens (userId, token, expiresAt, createdAt)
       VALUES (?, ?, ?, NOW())`,
      [userId, token, expiresAt]
    );
  }

  /**
   * Clean expired tokens
   */
  public async cleanExpiredTokens(): Promise<void> {
    const result = await this.db.query(
      'DELETE FROM refresh_tokens WHERE expiresAt < NOW()'
    );

    logger.info('Cleaned expired refresh tokens', { count: (result as any).affectedRows });
  }

  /**
   * Get expires in seconds from string format
   */
  private getExpiresInSeconds(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': return value * 86400;
      case 'h': return value * 3600;
      case 'm': return value * 60;
      case 's': return value;
      default: return 3600;
    }
  }

  /**
   * Verify email token
   */
  public async verifyEmailToken(token: string): Promise<string> {
    const result = await this.db.queryOne<{ userId: string }>(
      `SELECT userId FROM email_verifications 
       WHERE token = ? AND expiresAt > NOW() AND usedAt IS NULL`,
      [token]
    );

    if (!result) {
      throw new Error('Invalid or expired token');
    }

    // Mark token as used
    await this.db.query(
      'UPDATE email_verifications SET usedAt = NOW() WHERE token = ?',
      [token]
    );

    // Mark user as verified
    await this.db.query(
      'UPDATE users SET emailVerifiedAt = NOW() WHERE id = ?',
      [result.userId]
    );

    return result.userId;
  }

  /**
   * Create password reset token
   */
  public async createPasswordResetToken(email: string): Promise<string> {
    const user = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = ? AND deletedAt IS NULL',
      [email]
    );

    if (!user) {
      // Don't reveal if user exists
      return '';
    }

    const token = this.generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    await this.db.query(
      `INSERT INTO password_resets (userId, token, expiresAt, createdAt)
       VALUES (?, ?, ?, NOW())`,
      [user.id, token, expiresAt]
    );

    return token;
  }

  /**
   * Reset password
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const result = await this.db.queryOne<{ userId: string }>(
      `SELECT userId FROM password_resets 
       WHERE token = ? AND expiresAt > NOW() AND usedAt IS NULL`,
      [token]
    );

    if (!result) {
      throw new Error('Invalid or expired token');
    }

    // Hash new password
    const hashedPassword = await this.hashPassword(newPassword);

    // Update password
    await this.db.query(
      'UPDATE users SET password = ?, updatedAt = NOW() WHERE id = ?',
      [hashedPassword, result.userId]
    );

    // Mark token as used
    await this.db.query(
      'UPDATE password_resets SET usedAt = NOW() WHERE token = ?',
      [token]
    );

    // Invalidate all refresh tokens
    await this.logout(result.userId);

    logger.info('Password reset successfully', { userId: result.userId });
  }
}