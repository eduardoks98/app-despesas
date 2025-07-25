/**
 * useAuth Hook
 * 
 * React hook for authentication state and actions
 */

import { useState, useEffect, useCallback } from 'react';
import { AuthenticationService, AuthState, LoginCredentials, RegisterData } from '../services/core/AuthenticationService';
import { logger } from '../../../packages/shared/src/utils/logger';

export interface UseAuthReturn extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string) => Promise<boolean>;
  isPremium: boolean;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const authService = AuthenticationService.getInstance();
  const [state, setState] = useState<AuthState>(authService.getState());

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = authService.addListener((newState) => {
      setState(newState);
    });

    // Initialize auth service if not already done
    const initializeAuth = async () => {
      try {
        await authService.initialize();
      } catch (error) {
        logger.error('useAuth: Initialization failed', { error });
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      return await authService.login(credentials);
    } catch (error) {
      logger.error('useAuth: Login failed', { error });
      return false;
    }
  }, []);

  const register = useCallback(async (userData: RegisterData): Promise<boolean> => {
    try {
      return await authService.register(userData);
    } catch (error) {
      logger.error('useAuth: Registration failed', { error });
      return false;
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      logger.error('useAuth: Logout failed', { error });
    }
  }, []);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      return await authService.refreshTokens();
    } catch (error) {
      logger.error('useAuth: Token refresh failed', { error });
      return false;
    }
  }, []);

  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    try {
      return await authService.requestPasswordReset(email);
    } catch (error) {
      logger.error('useAuth: Password reset request failed', { error });
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string): Promise<boolean> => {
    try {
      return await authService.resetPassword(token, newPassword);
    } catch (error) {
      logger.error('useAuth: Password reset failed', { error });
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    // Update auth service state to clear error
    // This would need to be implemented in AuthenticationService
    logger.debug('useAuth: Error cleared');
  }, []);

  const isPremium = state.user?.isPremium ?? false;

  return {
    ...state,
    login,
    register,
    logout,
    refreshTokens,
    requestPasswordReset,
    resetPassword,
    isPremium,
    clearError,
  };
};