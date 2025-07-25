import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthTokens, LoginCredentials, RegisterData, AuthContextType } from '../types/auth';
import { authService, tokenStorage } from '../services/auth.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokens && !tokenStorage.isTokenExpired(tokens);

  // Initialize auth state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedTokens = tokenStorage.getTokens();
        const storedUser = tokenStorage.getUser();
        
        if (storedTokens && !tokenStorage.isTokenExpired(storedTokens)) {
          setTokens(storedTokens);
          
          // Use stored user first for faster load
          if (storedUser) {
            setUser(storedUser);
          }
          
          // Try to fetch fresh user data (but don't fail if it errors)
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            tokenStorage.setUser(currentUser);
          } catch (error) {
            console.warn('Failed to fetch current user, using stored data:', error);
            // If we have stored user, continue with that
            if (!storedUser) {
              throw error;
            }
          }
        } else {
          // Clean up expired tokens
          tokenStorage.clearAll();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        tokenStorage.clearAll();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Auto-refresh token before expiration
  useEffect(() => {
    if (!tokens || !isAuthenticated) return;

    const refreshInterval = setInterval(async () => {
      try {
        const timeUntilExpiry = tokens.expiresAt - Date.now();
        const refreshThreshold = 5 * 60 * 1000; // 5 minutes
        const warningThreshold = 10 * 60 * 1000; // 10 minutes

        // Show warning when token is about to expire
        if (timeUntilExpiry <= warningThreshold && timeUntilExpiry > refreshThreshold) {
          console.warn('Token will expire soon, consider refreshing');
        }

        // Auto-refresh when close to expiry
        if (timeUntilExpiry <= refreshThreshold && timeUntilExpiry > 0) {
          console.log('Auto-refreshing token');
          await refreshToken();
        }

        // Logout if token has already expired
        if (timeUntilExpiry <= 0) {
          console.warn('Token has expired, logging out');
          logout();
        }
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        logout();
      }
    }, 60000); // Check every minute

    return () => clearInterval(refreshInterval);
  }, [tokens, isAuthenticated]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const { user: userData, tokens: authTokens } = await authService.login(credentials);
      
      setUser(userData);
      setTokens(authTokens);
      tokenStorage.setTokens(authTokens);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const { user: userData, tokens: authTokens } = await authService.register(data);
      
      setUser(userData);
      setTokens(authTokens);
      tokenStorage.setTokens(authTokens);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setTokens(null);
    tokenStorage.clearAll();
    
    // Call logout API in background
    authService.logout().catch(console.error);
  };

  const refreshToken = async (): Promise<void> => {
    try {
      if (!tokens) throw new Error('No tokens available');
      
      const newTokens = await authService.refreshToken(tokens.refreshToken);
      setTokens(newTokens);
      tokenStorage.setTokens(newTokens);
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  const contextValue: AuthContextType = {
    user,
    tokens,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};