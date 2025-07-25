import { AxiosError } from 'axios';
import { notification } from 'antd';
import { ErrorService } from '../services/error.service';
import i18n from '../i18n/i18n';

/**
 * Handle errors from API calls with proper localization and user notification
 */
export const handleApiError = (
  error: unknown, 
  context: string,
  options?: {
    showNotification?: boolean;
    notificationDuration?: number;
    additionalData?: any;
  }
): void => {
  const { showNotification = true, notificationDuration = 4.5, additionalData } = options || {};
  
  // Parse error using ErrorService
  const errorInfo = ErrorService.parseError(error, i18n.t);
  
  // Log error for monitoring
  ErrorService.logError(errorInfo, { context, ...additionalData });
  
  // Show notification to user if enabled
  if (showNotification) {
    const notificationType = errorInfo.isRetriable ? 'warning' : 'error';
    
    notification[notificationType]({
      message: getErrorTitle(errorInfo.code || 'UNKNOWN_ERROR'),
      description: errorInfo.message,
      duration: notificationDuration,
      placement: 'topRight',
    });
  }
};

/**
 * Get appropriate error title based on error code
 */
const getErrorTitle = (errorCode: string): string => {
  const t = i18n.t;
  
  switch (errorCode) {
    case 'NETWORK_ERROR':
      return t('errors.network.offline');
    case 'TIMEOUT_ERROR':
      return t('errors.network.timeout');
    case 'UNAUTHORIZED':
    case 'TOKEN_EXPIRED':
      return t('errors.auth.sessionExpired');
    case 'FORBIDDEN':
    case 'INSUFFICIENT_PERMISSIONS':
      return t('errors.permission.denied');
    case 'VALIDATION_ERROR':
      return t('errors.form.validationError');
    case 'SERVER_ERROR':
      return t('errors.network.serverError');
    case 'RATE_LIMIT_EXCEEDED':
      return t('errors.api.rateLimitExceeded');
    default:
      return t('common.error');
  }
};

/**
 * Handle form validation errors
 */
export const handleFormError = (
  error: unknown,
  formName: string,
  setFieldsError?: (errors: any) => void
): void => {
  const errorInfo = ErrorService.parseError(error, i18n.t);
  
  // Check if it's a validation error with field details
  if (errorInfo.code === 'VALIDATION_ERROR' && errorInfo.details?.fields) {
    // Set field-specific errors if function is provided
    if (setFieldsError) {
      const fieldErrors = Object.entries(errorInfo.details.fields).map(([field, message]) => ({
        name: field,
        errors: [message as string],
      }));
      setFieldsError(fieldErrors);
    }
    
    // Show general validation error notification
    notification.warning({
      message: i18n.t('errors.form.validationError'),
      description: i18n.t('errors.form.incompleteForm'),
      duration: 4.5,
    });
  } else {
    // Handle as regular API error
    handleApiError(error, `form_${formName}`, { showNotification: true });
  }
};

/**
 * Handle auth-related errors with special behavior
 */
export const handleAuthError = (error: unknown): void => {
  const errorInfo = ErrorService.parseError(error, i18n.t);
  
  // Don't show notification for certain auth errors that are handled by the UI
  const silentCodes = ['INVALID_CREDENTIALS', 'ACCOUNT_LOCKED', 'ACCOUNT_DISABLED'];
  
  if (!silentCodes.includes(errorInfo.code || '')) {
    handleApiError(error, 'auth', { showNotification: true });
  }
  
  // Special handling for session expiration
  if (errorInfo.code === 'TOKEN_EXPIRED' || errorInfo.code === 'SESSION_EXPIRED') {
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  }
};

/**
 * Check if an error is retriable
 */
export const isRetriableError = (error: unknown): boolean => {
  const errorInfo = ErrorService.parseError(error, i18n.t);
  return ErrorService.isRetriableError(errorInfo);
};

/**
 * Get retry delay for exponential backoff
 */
export const getRetryDelay = (attemptCount: number): number => {
  return ErrorService.getRetryDelay(attemptCount);
};