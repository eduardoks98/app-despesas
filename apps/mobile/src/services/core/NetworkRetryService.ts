/**
 * Network Retry Service
 * 
 * Handles intelligent retry logic with exponential backoff for network requests
 */

import { logger } from '../../../packages/shared/src/utils/logger';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean; // Add random jitter to prevent thundering herd
}

export interface RetryContext {
  attempt: number;
  delay: number;
  error: Error;
  operation: string;
  startTime: number;
}

export interface NetworkError extends Error {
  status?: number;
  code?: string;
  isRetryable?: boolean;
}

export type RetryableOperation<T> = () => Promise<T>;

export class NetworkRetryService {
  private static instance: NetworkRetryService;
  private defaultConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitter: true
  };

  private constructor() {}

  public static getInstance(): NetworkRetryService {
    if (!NetworkRetryService.instance) {
      NetworkRetryService.instance = new NetworkRetryService();
    }
    return NetworkRetryService.instance;
  }

  /**
   * Execute operation with retry logic
   */
  public async executeWithRetry<T>(
    operation: RetryableOperation<T>,
    operationName: string,
    config?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    
    let lastError: NetworkError;
    
    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        logger.debug('Executing network operation', {
          operation: operationName,
          attempt: attempt + 1,
          maxRetries: retryConfig.maxRetries + 1
        });
        
        const result = await operation();
        
        if (attempt > 0) {
          logger.info('Network operation succeeded after retry', {
            operation: operationName,
            attempt: attempt + 1,
            totalTime: Date.now() - startTime
          });
        }
        
        return result;
        
      } catch (error: any) {
        lastError = this.enhanceError(error);
        
        const context: RetryContext = {
          attempt: attempt + 1,
          delay: 0,
          error: lastError,
          operation: operationName,
          startTime
        };
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError)) {
          logger.error('Non-retryable error encountered', {
            operation: operationName,
            error: lastError.message,
            status: lastError.status,
            code: lastError.code
          });
          throw lastError;
        }
        
        // Check if we've exhausted retries
        if (attempt >= retryConfig.maxRetries) {
          logger.error('Max retries exhausted', {
            operation: operationName,
            attempts: attempt + 1,
            totalTime: Date.now() - startTime,
            lastError: lastError.message
          });
          throw lastError;
        }
        
        // Calculate delay for next retry
        const delay = this.calculateDelay(attempt, retryConfig);
        context.delay = delay;
        
        logger.warn('Network operation failed, retrying', {
          operation: operationName,
          attempt: attempt + 1,
          nextRetryIn: delay,
          error: lastError.message,
          status: lastError.status
        });
        
        // Wait before retry
        await this.sleep(delay);
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw lastError!;
  }

  /**
   * Execute multiple operations with retry logic
   */
  public async executeMultipleWithRetry<T>(
    operations: Array<{
      operation: RetryableOperation<T>;
      name: string;
      config?: Partial<RetryConfig>;
    }>
  ): Promise<T[]> {
    const promises = operations.map(({ operation, name, config }) =>
      this.executeWithRetry(operation, name, config)
    );
    
    return Promise.all(promises);
  }

  /**
   * Execute operations with circuit breaker pattern
   */
  public async executeWithCircuitBreaker<T>(
    operation: RetryableOperation<T>,
    operationName: string,
    config?: Partial<RetryConfig & { circuitBreakerThreshold: number }>
  ): Promise<T> {
    const circuitBreakerKey = `circuit_breaker_${operationName}`;
    const failureKey = `failures_${operationName}`;
    
    // Check circuit breaker state
    const isCircuitOpen = await this.isCircuitBreakerOpen(circuitBreakerKey);
    if (isCircuitOpen) {
      throw new Error(`Circuit breaker is open for operation: ${operationName}`);
    }
    
    try {
      const result = await this.executeWithRetry(operation, operationName, config);
      
      // Reset failure count on success
      await this.resetFailureCount(failureKey);
      
      return result;
      
    } catch (error) {
      // Increment failure count
      const failureCount = await this.incrementFailureCount(failureKey);
      const threshold = config?.circuitBreakerThreshold || 5;
      
      if (failureCount >= threshold) {
        await this.openCircuitBreaker(circuitBreakerKey);
        logger.error('Circuit breaker opened', {
          operation: operationName,
          failureCount,
          threshold
        });
      }
      
      throw error;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: NetworkError): boolean {
    // Explicitly non-retryable
    if (error.isRetryable === false) {
      return false;
    }
    
    // HTTP status codes that should not be retried
    const nonRetryableStatuses = [400, 401, 403, 404, 422];
    if (error.status && nonRetryableStatuses.includes(error.status)) {
      return false;
    }
    
    // Network/connectivity errors (retryable)
    const retryableCodes = [
      'NETWORK_ERROR',
      'TIMEOUT',
      'CONNECTION_REFUSED',
      'DNS_ERROR',
      'ECONNRESET',
      'ENOTFOUND',
      'ETIMEDOUT'
    ];
    
    if (error.code && retryableCodes.includes(error.code)) {
      return true;
    }
    
    // HTTP status codes that are retryable
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    if (error.status && retryableStatuses.includes(error.status)) {
      return true;
    }
    
    // Default: don't retry unknown errors
    return false;
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Base delay with exponential backoff
    let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
    
    // Apply maximum delay limit
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd problem
    if (config.jitter) {
      const jitterRange = delay * 0.1; // 10% jitter
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay += jitter;
    }
    
    return Math.max(delay, 0);
  }

  /**
   * Enhance error with additional metadata
   */
  private enhanceError(error: any): NetworkError {
    const enhanced: NetworkError = error;
    
    // Try to extract HTTP status
    if (error.response?.status) {
      enhanced.status = error.response.status;
    } else if (error.status) {
      enhanced.status = error.status;
    }
    
    // Try to extract error code
    if (error.code) {
      enhanced.code = error.code;
    } else if (error.name) {
      enhanced.code = error.name;
    }
    
    // Determine if it's a network error
    if (!enhanced.status && (error.message?.includes('network') || error.message?.includes('fetch'))) {
      enhanced.code = 'NETWORK_ERROR';
    }
    
    return enhanced;
  }

  /**
   * Sleep for specified milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Circuit breaker methods (simplified in-memory implementation)
   */
  private circuitBreakerState: Map<string, { isOpen: boolean; openedAt: number }> = new Map();
  private failureCounters: Map<string, number> = new Map();

  private async isCircuitBreakerOpen(key: string): Promise<boolean> {
    const state = this.circuitBreakerState.get(key);
    if (!state || !state.isOpen) {
      return false;
    }
    
    // Auto-reset circuit breaker after 60 seconds
    const resetTime = 60000; // 60 seconds
    if (Date.now() - state.openedAt > resetTime) {
      this.circuitBreakerState.delete(key);
      return false;
    }
    
    return true;
  }

  private async openCircuitBreaker(key: string): Promise<void> {
    this.circuitBreakerState.set(key, {
      isOpen: true,
      openedAt: Date.now()
    });
  }

  private async incrementFailureCount(key: string): Promise<number> {
    const current = this.failureCounters.get(key) || 0;
    const newCount = current + 1;
    this.failureCounters.set(key, newCount);
    return newCount;
  }

  private async resetFailureCount(key: string): Promise<void> {
    this.failureCounters.delete(key);
  }

  /**
   * Create a retryable fetch function
   */
  public createRetryableFetch(config?: Partial<RetryConfig>): (url: string, options?: RequestInit) => Promise<Response> {
    return async (url: string, options?: RequestInit): Promise<Response> => {
      return this.executeWithRetry(
        async () => {
          const response = await fetch(url, options);
          
          // Check if response indicates a retryable error
          if (!response.ok) {
            const error: NetworkError = new Error(`HTTP ${response.status}: ${response.statusText}`);
            error.status = response.status;
            throw error;
          }
          
          return response;
        },
        `fetch ${url}`,
        config
      );
    };
  }

  /**
   * Get retry statistics
   */
  public getStats(): {
    activeCircuitBreakers: number;
    totalFailures: number;
    circuitBreakerKeys: string[];
  } {
    const activeCircuitBreakers = Array.from(this.circuitBreakerState.entries())
      .filter(([, state]) => state.isOpen).length;
    
    const totalFailures = Array.from(this.failureCounters.values())
      .reduce((sum, count) => sum + count, 0);
    
    const circuitBreakerKeys = Array.from(this.circuitBreakerState.keys());
    
    return {
      activeCircuitBreakers,
      totalFailures,
      circuitBreakerKeys
    };
  }

  /**
   * Reset all circuit breakers and failure counters
   */
  public reset(): void {
    this.circuitBreakerState.clear();
    this.failureCounters.clear();
    logger.info('Network retry service state reset');
  }

  /**
   * Update default configuration
   */
  public updateDefaultConfig(config: Partial<RetryConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    logger.info('Updated default retry configuration', this.defaultConfig);
  }
}