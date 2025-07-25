import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  backoffMultiplier?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number) => void;
  onSuccess?: () => void;
  onFailure?: (error: Error) => void;
}

/**
 * Hook for retrying network operations with exponential backoff
 */
export const useRetry = (options: RetryOptions = {}) => {
  const { 
    maxAttempts = 3, 
    backoffMultiplier = 1.5, 
    initialDelay = 1000, 
    maxDelay = 30000,
    onRetry,
    onSuccess,
    onFailure
  } = options;
  
  // Removed offline check - always assume online
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Execute a function with retry logic
   */
  const executeWithRetry = useCallback(async <T>(
    fn: () => Promise<T>,
    retryOptions?: RetryOptions
  ): Promise<T> => {
    const opts = {
      maxAttempts,
      backoffMultiplier,
      initialDelay,
      maxDelay,
      onRetry,
      onSuccess,
      onFailure,
      ...retryOptions
    };
    
    setIsRetrying(true);
    setAttempts(0);
    setError(null);
    
    let attempt = 0;
    let delay = opts.initialDelay;
    
    const execute = async (): Promise<T> => {
      try {
        attempt++;
        setAttempts(attempt);
        
        const result = await fn();
        
        setIsRetrying(false);
        opts.onSuccess?.();
        
        return result;
      } catch (err) {
        setError(err as Error);
        
        if (attempt < opts.maxAttempts) {
          // Calculate next delay with exponential backoff
          delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
          
          // Notify of retry
          opts.onRetry?.(attempt);
          
          // Wait for delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Retry
          return execute();
        } else {
          setIsRetrying(false);
          opts.onFailure?.(err as Error);
          throw err;
        }
      }
    };
    
    return execute();
  }, [maxAttempts, backoffMultiplier, initialDelay, maxDelay, onRetry, onSuccess, onFailure]);

  return {
    executeWithRetry,
    isRetrying,
    attempts,
    error
  };
};

export default useRetry;