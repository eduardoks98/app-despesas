import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthController } from '../controllers/auth.controller';

// Mock das dependências
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../config/database');

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthController', () => {
  let authController: AuthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    authController = new AuthController();
    
    mockRequest = {
      body: {},
      headers: {},
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockBcrypt.hash.mockResolvedValue('hashedPassword123' as never);
      mockJwt.sign.mockReturnValue('mockToken123' as never);

      // Mock database query success
      const mockExecute = jest.fn().mockResolvedValue([{ insertId: 1 }]);
      jest.doMock('../config/database', () => ({
        execute: mockExecute,
      }));

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 1, email: 'test@example.com' },
        expect.any(String),
        { expiresIn: '7d' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Usuário criado com sucesso',
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
          },
          token: 'mockToken123',
        },
      });
    });

    it('should return error for missing required fields', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        // Missing name and password
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Nome, email e senha são obrigatórios',
      });
    });

    it('should return error for invalid email format', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email inválido',
      });
    });

    it('should return error for weak password', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: '123', // Too short
      };

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'A senha deve ter pelo menos 6 caracteres',
      });
    });

    it('should handle duplicate email error', async () => {
      mockRequest.body = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      mockBcrypt.hash.mockResolvedValue('hashedPassword123' as never);

      // Mock database duplicate error
      const mockExecute = jest.fn().mockRejectedValue({
        code: 'ER_DUP_ENTRY',
        sqlMessage: 'Duplicate entry',
      });
      jest.doMock('../config/database', () => ({
        execute: mockExecute,
      }));

      await authController.register(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email já está em uso',
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
      };

      // Mock database query to find user
      const mockExecute = jest.fn().mockResolvedValue([[mockUser]]);
      jest.doMock('../config/database', () => ({
        execute: mockExecute,
      }));

      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValue('mockToken123' as never);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        { userId: 1, email: 'test@example.com' },
        expect.any(String),
        { expiresIn: '7d' }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
          },
          token: 'mockToken123',
        },
      });
    });

    it('should return error for missing credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        // Missing password
      };

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email e senha são obrigatórios',
      });
    });

    it('should return error for invalid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      // Mock database query to return empty result (user not found)
      const mockExecute = jest.fn().mockResolvedValue([[]]);
      jest.doMock('../config/database', () => ({
        execute: mockExecute,
      }));

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciais inválidas',
      });
    });

    it('should return error for wrong password', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
      };

      const mockExecute = jest.fn().mockResolvedValue([[mockUser]]);
      jest.doMock('../config/database', () => ({
        execute: mockExecute,
      }));

      mockBcrypt.compare.mockResolvedValue(false as never);

      await authController.login(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Credenciais inválidas',
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await authController.logout(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logout realizado com sucesso',
      });
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      mockRequest.body = {
        user: {
          userId: 1,
          email: 'test@example.com',
        },
      };

      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const mockExecute = jest.fn().mockResolvedValue([[mockUser]]);
      jest.doMock('../config/database', () => ({
        execute: mockExecute,
      }));

      await authController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        },
      });
    });

    it('should return error if user not found', async () => {
      mockRequest.body = {
        user: {
          userId: 999,
          email: 'notfound@example.com',
        },
      };

      const mockExecute = jest.fn().mockResolvedValue([[]]);
      jest.doMock('../config/database', () => ({
        execute: mockExecute,
      }));

      await authController.getProfile(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Usuário não encontrado',
      });
    });
  });
});