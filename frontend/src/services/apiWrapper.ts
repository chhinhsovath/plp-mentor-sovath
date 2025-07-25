import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { authService } from './auth.service';
import { handleApiError, handleAuthError } from '../utils/errorHandler';

/**
 * Create an axios instance with comprehensive error handling
 */
export const createApiClient = (baseURL: string): AxiosInstance => {
  const client = axios.create({
    baseURL,
    timeout: 30000, // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    (config) => {
      const token = authService.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // Handle token refresh for 401 errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = authService.getRefreshToken();
          if (refreshToken) {
            await authService.refreshToken();
            const newToken = authService.getAccessToken();
            
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return client(originalRequest);
            }
          }
        } catch (refreshError) {
          // Refresh failed, handle auth error
          handleAuthError(refreshError);
          authService.logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Let the error propagate for handling at the service level
      return Promise.reject(error);
    }
  );

  return client;
};

/**
 * Wrapper for API calls with automatic error handling
 */
export const apiCall = async <T = any>(
  apiFunction: () => Promise<AxiosResponse<T>>,
  context: string,
  options?: {
    showNotification?: boolean;
    transformResponse?: (data: any) => T;
  }
): Promise<T> => {
  try {
    const response = await apiFunction();
    const data = response.data;
    
    // Transform response if needed
    if (options?.transformResponse) {
      return options.transformResponse(data);
    }
    
    // Handle wrapped responses (e.g., { data: actualData, status: 'success' })
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data;
    }
    
    return data;
  } catch (error) {
    // Handle error at the service level
    handleApiError(error, context, {
      showNotification: options?.showNotification ?? true,
    });
    
    // Re-throw to allow component-level handling if needed
    throw error;
  }
};

/**
 * Batch API calls with proper error handling
 */
export const batchApiCalls = async <T = any>(
  apiCalls: Array<() => Promise<T>>,
  context: string,
  options?: {
    stopOnError?: boolean;
    showNotification?: boolean;
  }
): Promise<Array<{ success: boolean; data?: T; error?: any }>> => {
  const results: Array<{ success: boolean; data?: T; error?: any }> = [];
  
  for (const [index, apiCall] of apiCalls.entries()) {
    try {
      const data = await apiCall();
      results.push({ success: true, data });
    } catch (error) {
      results.push({ success: false, error });
      
      // Handle the error
      handleApiError(error, `${context}_${index}`, {
        showNotification: options?.showNotification ?? true,
        additionalData: { batchIndex: index, totalCalls: apiCalls.length },
      });
      
      // Stop if requested
      if (options?.stopOnError) {
        break;
      }
    }
  }
  
  return results;
};