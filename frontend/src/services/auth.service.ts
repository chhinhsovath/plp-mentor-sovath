import axios from 'axios';
import { LoginCredentials, RegisterData, AuthTokens, User } from '../types/auth';
import { ErrorService } from './error.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

const authApi = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage utilities
export const tokenStorage = {
  getTokens: (): AuthTokens | null => {
    const tokens = localStorage.getItem('auth_tokens');
    if (!tokens || tokens === 'undefined') {
      return null;
    }
    try {
      return JSON.parse(tokens);
    } catch (error) {
      console.error('Failed to parse auth tokens:', error);
      return null;
    }
  },

  setTokens: (tokens: AuthTokens): void => {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  },

  removeTokens: (): void => {
    localStorage.removeItem('auth_tokens');
  },

  isTokenExpired: (tokens: AuthTokens): boolean => {
    return Date.now() >= tokens.expiresAt;
  },
  
  // User storage
  getUser: (): User | null => {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr || userStr === 'undefined') {
      return null;
    }
    try {
      const user = JSON.parse(userStr);
      
      // Ensure role is properly structured
      if (user && typeof user.role === 'string') {
        return {
          ...user,
          role: { 
            id: user.role, 
            name: user.role, 
            level: user.role.toLowerCase() === 'administrator' ? 100 : 50,
            permissions: []
          }
        };
      }
      
      return user;
    } catch (error) {
      console.error('Failed to parse auth user:', error);
      return null;
    }
  },
  
  setUser: (user: User): void => {
    localStorage.setItem('auth_user', JSON.stringify(user));
  },
  
  removeUser: (): void => {
    localStorage.removeItem('auth_user');
  },
  
  clearAll: (): void => {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
  }
};

// Request interceptor to add auth token
authApi.interceptors.request.use((config) => {
  const tokens = tokenStorage.getTokens();
  if (tokens && !tokenStorage.isTokenExpired(tokens)) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }
  return config;
});

// Response interceptor for token refresh
authApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const tokens = tokenStorage.getTokens();
        if (tokens && tokens.refreshToken) {
          const newTokens = await refreshAuthToken(tokens.refreshToken);
          tokenStorage.setTokens(newTokens);
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return authApi(originalRequest);
        } else {
          // No refresh token available, redirect to login
          tokenStorage.clearAll();
          window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        tokenStorage.clearAll();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export const authService = {
  getAccessToken(): string | null {
    const tokens = tokenStorage.getTokens();
    if (tokens && !tokenStorage.isTokenExpired(tokens)) {
      return tokens.accessToken;
    }
    return null;
  },

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await authApi.post('/login', credentials);
    
    // Transform backend response to match frontend expectations
    const responseData = response.data.data || response.data;
    const { access_token, user } = responseData;
    
    // Ensure role is properly structured
    const transformedUser: User = {
      ...user,
      role: typeof user.role === 'string' 
        ? { 
            id: user.role, 
            name: user.role, 
            level: user.role.toLowerCase() === 'administrator' ? 100 : 50,
            permissions: []
          }
        : user.role
    };
    
    // Create tokens object with proper structure
    const tokens: AuthTokens = {
      accessToken: access_token,
      refreshToken: '', // Backend doesn't return refresh token yet
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
    };
    
    // Store user data and tokens
    tokenStorage.setUser(transformedUser);
    tokenStorage.setTokens(tokens);
    
    return { user: transformedUser, tokens };
  },

  async register(data: RegisterData): Promise<{ user: User; tokens: AuthTokens }> {
    const response = await authApi.post('/register', data);
    
    // Transform backend response to match frontend expectations
    const responseData = response.data.data || response.data;
    const { access_token, user } = responseData;
    
    // Create tokens object with proper structure
    const tokens: AuthTokens = {
      accessToken: access_token || '',
      refreshToken: '', // Backend doesn't return refresh token yet
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours from now
    };
    
    return { user, tokens };
  },

  async logout(): Promise<void> {
    try {
      await authApi.post('/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      tokenStorage.clearAll();
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await authApi.get('/profile');
    const responseData = response.data.data || response.data;
    const user = responseData.user || responseData;
    
    // Ensure role is properly structured
    const transformedUser: User = {
      ...user,
      role: typeof user.role === 'string' 
        ? { 
            id: user.role, 
            name: user.role, 
            level: user.role.toLowerCase() === 'administrator' ? 100 : 50,
            permissions: []
          }
        : user.role
    };
    
    return transformedUser;
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await authApi.post('/refresh', { refreshToken });
    return response.data;
  },
};

async function refreshAuthToken(refreshToken: string): Promise<AuthTokens> {
  const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
    refreshToken,
  });
  return response.data;
}