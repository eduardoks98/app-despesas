/**
 * Authentication Service for Mobile
 * 
 * Handles user authentication, token management, and secure storage
 * Integrates with the API backend
 */

import { SecureStorageService, UserData } from './SecureStorageService';
import { ApiService } from './ApiService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  message: string;
  user: UserData;
  tokens: AuthTokens;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserData | null;
  isLoading: boolean;
  error: string | null;
}

export type AuthListener = (state: AuthState) => void;

export class AuthenticationService {
  private static instance: AuthenticationService;
  private secureStorage: SecureStorageService;
  private apiService: ApiService;
  private listeners: AuthListener[] = [];
  private currentState: AuthState = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null
  };

  private constructor() {
    this.secureStorage = SecureStorageService.getInstance();
    this.apiService = ApiService.getInstance();
  }

  public static getInstance(): AuthenticationService {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  /**
   * Initialize authentication service
   */
  public async initialize(): Promise<void> {
    try {
      this.setState({ isLoading: true, error: null });
      
      // Check if user is already authenticated
      const isAuthenticated = await this.secureStorage.isAuthenticated();
      
      if (isAuthenticated) {
        const userData = await this.secureStorage.getUserData();
        const accessToken = await this.secureStorage.getAccessToken();
        
        if (userData && accessToken) {
          // Verify token with server
          const isValid = await this.verifyToken(accessToken);
          
          if (isValid) {
            this.setState({
              isAuthenticated: true,
              user: userData,
              isLoading: false,
              error: null
            });
            logger.info('AuthService: User restored from storage', { userId: userData.id });
            return;
          } else {
            // Token invalid, try to refresh
            const refreshed = await this.refreshTokens();
            if (refreshed) {
              return;
            }
          }
        }
      }
      
      // Not authenticated or token invalid
      await this.logout(false);
      
    } catch (error) {
      logger.error('AuthService: Initialization failed', { error });
      this.setState({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false, 
        error: 'Falha na inicialização' 
      });
    }
  }

  /**
   * Login with email and password
   */
  public async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      this.setState({ isLoading: true, error: null });
      
      logger.info('AuthService: Attempting login', { email: credentials.email });
      
      const response = await this.apiService.post<LoginResponse>('/auth/login', credentials);
      
      if (response.success && response.data) {
        await this.handleSuccessfulAuth(response.data);
        logger.info('AuthService: Login successful', { userId: response.data.user.id });
        return true;
      } else {
        throw new Error(response.error || 'Login failed');
      }
      
    } catch (error: any) {
      logger.error('AuthService: Login failed', { error });
      this.setState({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false, 
        error: error.message || 'Falha no login' 
      });
      return false;
    }
  }

  /**
   * Register new user
   */
  public async register(userData: RegisterData): Promise<boolean> {
    try {
      this.setState({ isLoading: true, error: null });
      
      logger.info('AuthService: Attempting registration', { email: userData.email });
      
      const response = await this.apiService.post<LoginResponse>('/auth/register', userData);
      
      if (response.success && response.data) {
        await this.handleSuccessfulAuth(response.data);
        logger.info('AuthService: Registration successful', { userId: response.data.user.id });
        return true;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
      
    } catch (error: any) {
      logger.error('AuthService: Registration failed', { error });
      this.setState({ 
        isAuthenticated: false, 
        user: null, 
        isLoading: false, 
        error: error.message || 'Falha no cadastro' 
      });
      return false;
    }
  }

  /**
   * Logout user
   */
  public async logout(notifyServer: boolean = true): Promise<void> {
    try {
      if (notifyServer && this.currentState.isAuthenticated) {
        const refreshToken = await this.secureStorage.getRefreshToken();
        
        if (refreshToken) {
          try {
            await this.apiService.post('/auth/logout', { refreshToken });
          } catch (error) {
            logger.warn('AuthService: Server logout failed', { error });
          }
        }
      }
      
      // Clear local storage
      await this.secureStorage.clearAuth();
      
      this.setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null
      });
      
      logger.info('AuthService: User logged out');
      
    } catch (error) {
      logger.error('AuthService: Logout failed', { error });
    }
  }

  /**
   * Refresh access token
   */
  public async refreshTokens(): Promise<boolean> {
    try {
      const refreshToken = await this.secureStorage.getRefreshToken();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      logger.debug('AuthService: Refreshing tokens');
      
      const response = await this.apiService.post<AuthTokens>('/auth/refresh', { 
        refreshToken 
      });
      
      if (response.success && response.data) {
        await this.secureStorage.storeTokens(
          response.data.accessToken,
          response.data.refreshToken
        );
        
        // Update API service with new token
        this.apiService.setAuthToken(response.data.accessToken);
        
        logger.info('AuthService: Tokens refreshed successfully');
        return true;
      } else {
        throw new Error(response.error || 'Token refresh failed');
      }
      
    } catch (error) {
      logger.error('AuthService: Token refresh failed', { error });
      await this.logout(false);
      return false;
    }
  }

  /**
   * Get current user data
   */
  public async getCurrentUser(): Promise<UserData | null> {
    if (this.currentState.user) {
      return this.currentState.user;
    }
    
    return await this.secureStorage.getUserData();
  }

  /**
   * Verify token with server
   */
  private async verifyToken(token: string): Promise<boolean> {
    try {
      const response = await this.apiService.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Handle successful authentication
   */
  private async handleSuccessfulAuth(authData: LoginResponse): Promise<void> {
    // Store tokens and user data
    await Promise.all([
      this.secureStorage.storeTokens(
        authData.tokens.accessToken,
        authData.tokens.refreshToken
      ),
      this.secureStorage.storeUserData(authData.user)
    ]);
    
    // Update API service with token
    this.apiService.setAuthToken(authData.tokens.accessToken);
    
    // Update state
    this.setState({
      isAuthenticated: true,
      user: authData.user,
      isLoading: false,
      error: null
    });
  }

  /**
   * Update state and notify listeners
   */
  private setState(newState: Partial<AuthState>): void {
    this.currentState = { ...this.currentState, ...newState };
    this.notifyListeners();
  }

  /**
   * Get current auth state
   */
  public getState(): AuthState {
    return { ...this.currentState };
  }

  /**
   * Add auth state listener
   */
  public addListener(listener: AuthListener): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        logger.error('AuthService: Listener error', { error });
      }
    });
  }

  /**
   * Check if current user is premium
   */
  public isPremiumUser(): boolean {
    return this.currentState.user?.isPremium ?? false;
  }

  /**
   * Get access token for API calls
   */
  public async getAccessToken(): Promise<string | null> {
    return await this.secureStorage.getAccessToken();
  }

  /**
   * Request password reset
   */
  public async requestPasswordReset(email: string): Promise<boolean> {
    try {
      const response = await this.apiService.post('/auth/forgot-password', { email });
      return response.success;
    } catch (error) {
      logger.error('AuthService: Password reset request failed', { error });
      return false;
    }
  }

  /**
   * Reset password with token
   */
  public async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const response = await this.apiService.post('/auth/reset-password', {
        token,
        password: newPassword
      });
      return response.success;
    } catch (error) {
      logger.error('AuthService: Password reset failed', { error });
      return false;
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.listeners = [];
  }
}