import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../config/database';
import { validateEmail, validatePassword } from '../utils/validation';
import { AuthenticatedRequest } from '../middleware/auth';

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

      // Check if user already exists
      const existingUser = await this.db.queryOne(
        'SELECT id FROM users WHERE email = ?',
        [email.toLowerCase()]
      );

      if (existingUser) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const userId = uuidv4();
      await this.db.query(`
        INSERT INTO users (id, name, email, password_hash, plan_type)
        VALUES (?, ?, ?, ?, 'free')
      `, [userId, name.trim(), email.toLowerCase(), passwordHash]);

      // Create default categories for user
      await this.createDefaultCategories(userId);

      // Generate JWT token
      const token = this.generateToken(userId);
      const refreshToken = this.generateRefreshToken(userId);

      // Get user data
      const user = await this.db.queryOne(`
        SELECT id, name, email, plan_type, subscription_status, created_at
        FROM users WHERE id = ?
      `, [userId]);

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          planType: user.plan_type,
          subscriptionStatus: user.subscription_status,
          createdAt: user.created_at,
        },
        tokens: {
          accessToken: token,
          refreshToken,
          expiresIn: '24h'
        }
      });

      // Log analytics
      await this.logAnalytics(userId, 'user_registered', 'auth', req);

    } catch (error) {
      console.error('Registration error:', error);
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

      // Find user
      const user = await this.db.queryOne(`
        SELECT id, name, email, password_hash, plan_type, subscription_status, subscription_expires_at
        FROM users WHERE email = ?
      `, [email.toLowerCase()]);

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check if premium subscription expired
      let currentPlanType = user.plan_type;
      if (user.plan_type === 'premium' && user.subscription_expires_at) {
        const now = new Date();
        const expiresAt = new Date(user.subscription_expires_at);
        
        if (now > expiresAt) {
          // Downgrade to free
          await this.db.query(`
            UPDATE users 
            SET plan_type = 'free', subscription_status = 'expired'
            WHERE id = ?
          `, [user.id]);
          currentPlanType = 'free';
        }
      }

      // Generate tokens
      const token = this.generateToken(user.id);
      const refreshToken = this.generateRefreshToken(user.id);

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          planType: currentPlanType,
          subscriptionStatus: user.subscription_status,
        },
        tokens: {
          accessToken: token,
          refreshToken,
          expiresIn: '24h'
        }
      });

      // Log analytics
      await this.logAnalytics(user.id, 'user_login', 'auth', req);

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public refreshToken = async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ error: 'Refresh token required' });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Generate new access token
      const newAccessToken = this.generateToken(decoded.userId);

      res.json({
        accessToken: newAccessToken,
        expiresIn: '24h'
      });

    } catch (error) {
      res.status(403).json({ error: 'Invalid refresh token' });
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
        SELECT id, name, email, plan_type, subscription_status, subscription_expires_at, created_at
        FROM users WHERE id = ?
      `, [req.user!.id]);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          planType: user.plan_type,
          subscriptionStatus: user.subscription_status,
          subscriptionExpiresAt: user.subscription_expires_at,
          createdAt: user.created_at,
        }
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  public logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // In a more sophisticated setup, you'd blacklist the token
      // For now, just log the analytics
      await this.logAnalytics(req.user!.id, 'user_logout', 'auth', req);

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }

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
      console.error('Analytics logging error:', error);
    }
  }
}