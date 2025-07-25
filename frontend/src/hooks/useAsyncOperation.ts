import { useState, useCallback } from 'react';
import { handleApiError, handleFormError, isRetriableError, getRetryDelay } from '../utils/errorHandler';

interface UseAsyncOperationOptions {
  context: string;
  successMessage?: string;
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  maxRetries?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Hook for handling async operations with automatic error handling and retry logic
 */
export const useAsyncOperation = <T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<T | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    context,
    successMessage,
    showSuccessNotification = false,
    showErrorNotification = true,
    maxRetries = 3,
    onSuccess,
    onError,
  } = options;

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await asyncFunction(...args);
        setData(result);
        setRetryCount(0);

        if (onSuccess) {
          onSuccess(result);
        }

        if (showSuccessNotification && successMessage) {
          const { notification } = await import('antd');
          notification.success({
            message: successMessage,
            duration: 3,
          });
        }

        return result;
      } catch (err) {
        setError(err);

        // Check if error is retriable and we haven't exceeded max retries
        if (isRetriableError(err) && retryCount < maxRetries) {
          const delay = getRetryDelay(retryCount);
          setRetryCount(prev => prev + 1);

          // Retry after delay
          setTimeout(() => {
            execute(...args);
          }, delay);

          return null;
        }

        // Handle the error
        handleApiError(err, context, {
          showNotification: showErrorNotification,
          additionalData: { args, retryCount },
        });

        if (onError) {
          onError(err);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction, context, successMessage, showSuccessNotification, showErrorNotification, maxRetries, onSuccess, onError, retryCount]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setRetryCount(0);
  }, []);

  return {
    execute,
    loading,
    error,
    data,
    retryCount,
    reset,
  };
};

/**
 * Hook specifically for form operations
 */
export const useFormOperation = <T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  formName: string,
  options?: Partial<UseAsyncOperationOptions>
) => {
  const [fieldErrors, setFieldErrors] = useState<any>(null);

  const handleFormErrorWithFields = useCallback((error: any) => {
    handleFormError(error, formName, setFieldErrors);
  }, [formName]);

  const asyncOperation = useAsyncOperation(asyncFunction, {
    context: `form_${formName}`,
    showErrorNotification: true,
    ...options,
    onError: (error) => {
      handleFormErrorWithFields(error);
      if (options?.onError) {
        options.onError(error);
      }
    },
  });

  return {
    ...asyncOperation,
    fieldErrors,
    setFieldErrors,
  };
};