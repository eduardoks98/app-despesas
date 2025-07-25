import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../config/database';
import { AuthService } from '../services/AuthService';
import { validateEmail, validatePassword } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export class AuthController {
  private db = Database.getInstance();
  private authService = AuthService.getInstance();

  /**
   * @swagger
   * /api/auth/register:
   *   post:
   *     summary: Registrar novo usuário
   *     description: Cria uma nova conta de usuário no sistema
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *                 minLength: 2
   *                 maxLength: 100
   *                 example: João Silva
   *               email:
   *                 type: string
   *                 format: email
   *                 example: joao@exemplo.com
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 example: senha123
   *     responses:
   *       201:
   *         description: Usuário criado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: User created successfully
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *                 tokens:
   *                   type: object
   *                   properties:
   *                     accessToken:
   *                       type: string
   *                     refreshToken:
   *                       type: string
   *                     expiresIn:
   *                       type: string
   *                       example: 24h
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       409:
   *         description: Email já cadastrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: Email already registered
   */
  public register = async (req: Request, res: Response) => {
    try {
      const { name, email, password }: RegisterRequest = req.body;

      // Validation
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters' });
      }

      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters with uppercase, lowercase and number' 
        });
      }

      // Use AuthService to register user
      const { user, tokens } = await this.authService.register(email.toLowerCase(), password, name.trim());

      // Create default categories for user
      await this.createDefaultCategories(user.id);

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isPremium: user.isPremium,
          subscriptionStatus: user.subscriptionStatus,
          createdAt: user.createdAt,
        },
        tokens
      });

      // Log analytics
      await this.logAnalytics(user.id, 'user_registered', 'auth', req);

    } catch (error: any) {
      logger.error('Registration error:', error);
      
      if (error.message === 'User already exists') {
        return res.status(409).json({ error: 'Email already registered' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * @swagger
   * /api/auth/login:
   *   post:
   *     summary: Autenticar usuário
   *     description: Realiza login e retorna tokens JWT
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login realizado com sucesso
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/LoginResponse'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         description: Credenciais inválidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *             example:
   *               error: Invalid credentials
   */
  public login = async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      // Use AuthService to authenticate
      const { user, tokens } = await this.authService.authenticate(email.toLowerCase(), password);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isPremium: user.isPremium,
          subscriptionStatus: user.subscriptionStatus,
        },
        tokens
      });

      // Log analytics
      await this.logAnalytics(user.id, 'user_login', 'auth', req);

    } catch (error: any) {
      logger.error('Login error:', error);
      
      if (error.message === 'Invalid credentials') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      // Use AuthService to refresh token
      const tokens = await this.authService.refreshToken(refreshToken);

      res.json(tokens);

    } catch (error: any) {
      logger.error('Refresh token error:', error);
      res.status(403).json({ error: error.message || 'Invalid refresh token' });
    }
  };

  /**
   * @swagger
   * /api/auth/me:
   *   get:
   *     summary: Obter dados do usuário atual
   *     description: Retorna informações do usuário autenticado
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Dados do usuário
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 user:
   *                   $ref: '#/components/schemas/User'
   *       401:
   *         $ref: '#/components/responses/UnauthorizedError'
   *       404:
   *         description: Usuário não encontrado
   */
  public me = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await this.db.queryOne(`
        SELECT id, name, email, isPremium, subscriptionStatus, subscriptionExpiresAt, emailVerifiedAt, createdAt
        FROM users WHERE id = ? AND deletedAt IS NULL
      `, [req.user!.id]);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isPremium: user.isPremium,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          emailVerified: !!user.emailVerifiedAt,
          createdAt: user.createdAt,
        }
      });

    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { refreshToken } = req.body;
      
      // Invalidate refresh token
      await this.authService.logout(req.user!.id, refreshToken);
      
      // Log analytics
      await this.logAnalytics(req.user!.id, 'user_logout', 'auth', req);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Request password reset
   */
  public forgotPassword = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
      }

      const token = await this.authService.createPasswordResetToken(email.toLowerCase());
      
      if (token) {
        // TODO: Send email with reset link
        logger.info('Password reset requested', { email });
      }

      // Always return success to prevent email enumeration
      res.json({ 
        message: 'If your email is registered, you will receive a password reset link' 
      });

    } catch (error) {
      logger.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Reset password with token
   */
  public resetPassword = async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Reset token required' });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({ 
          error: 'Password must be at least 8 characters with uppercase, lowercase and number' 
        });
      }

      await this.authService.resetPassword(token, password);

      res.json({ message: 'Password reset successfully' });

    } catch (error: any) {
      logger.error('Reset password error:', error);
      
      if (error.message === 'Invalid or expired token') {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  /**
   * Verify email with token
   */
  public verifyEmail = async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: 'Verification token required' });
      }

      const userId = await this.authService.verifyEmailToken(token);

      res.json({ 
        message: 'Email verified successfully',
        userId 
      });

    } catch (error: any) {
      logger.error('Email verification error:', error);
      
      if (error.message === 'Invalid or expired token') {
        return res.status(400).json({ error: 'Invalid or expired verification link' });
      }
      
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Token generation methods removed - now handled by AuthService

  private async createDefaultCategories(userId: string): Promise<void> {
    const systemCategories = await this.db.query(`
      SELECT name, icon, color FROM categories WHERE user_id = 'SYSTEM'
    `);

    const categoryInserts = systemCategories.map(category => [
      uuidv4(),
      userId,
      category.name,
      category.icon,
      category.color,
      null, // parent_id
      true  // is_system
    ]);

    if (categoryInserts.length > 0) {
      const placeholders = categoryInserts.map(() => '(?, ?, ?, ?, ?, ?, ?)').join(', ');
      await this.db.query(`
        INSERT INTO categories (id, user_id, name, icon, color, parent_id, is_system)
        VALUES ${placeholders}
      `, categoryInserts.flat());
    }
  }

  private async logAnalytics(userId: string, action: string, entityType: string, req: Request): Promise<void> {
    try {
      await this.db.query(`
        INSERT INTO usage_analytics (id, user_id, action, entity_type, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(),
        userId,
        action,
        entityType,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      ]);
    } catch (error) {
      logger.error('Analytics logging error:', error);
    }
  }
}