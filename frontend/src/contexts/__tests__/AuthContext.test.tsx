import { renderHook, act, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AuthProvider, useAuth } from '../AuthContext'
import { authService, tokenStorage } from '../../services/auth.service'
import { ReactNode } from 'react'

// Mock the auth service
vi.mock('../../services/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    refreshToken: vi.fn(),
  },
  tokenStorage: {
    getTokens: vi.fn(),
    setTokens: vi.fn(),
    removeTokens: vi.fn(),
    clearAll: vi.fn(),
    getUser: vi.fn(),
    setUser: vi.fn(),
    removeUser: vi.fn(),
    isTokenExpired: vi.fn(),
  },
}))

const mockAuthService = authService as any
const mockTokenStorage = tokenStorage as any

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with no user when no tokens exist', async () => {
    mockTokenStorage.getTokens.mockReturnValue(null)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.tokens).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should initialize with user when valid tokens exist', async () => {
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
    }
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      fullName: 'Test User',
      role: { id: '1', name: 'teacher', level: 1, permissions: [] },
      locationScope: { type: 'school', id: '1', name: 'Test School' },
      isActive: true,
      lastLogin: new Date(),
    }

    mockTokenStorage.getTokens.mockReturnValue(mockTokens)
    mockTokenStorage.isTokenExpired.mockReturnValue(false)
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

    const { result, unmount } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 10000 })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.tokens).toEqual(mockTokens)
    expect(result.current.isAuthenticated).toBe(true)
    
    unmount()
  })

  it('should handle login successfully', async () => {
    const mockCredentials = { username: 'testuser', password: 'password' }
    const mockResponse = {
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        role: { id: '1', name: 'teacher', level: 1, permissions: [] },
        locationScope: { type: 'school', id: '1', name: 'Test School' },
        isActive: true,
        lastLogin: new Date(),
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
      },
    }

    mockTokenStorage.getTokens.mockReturnValue(null)
    mockAuthService.login.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.login(mockCredentials)
    })

    expect(mockAuthService.login).toHaveBeenCalledWith(mockCredentials)
    expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(mockResponse.tokens)
    expect(result.current.user).toEqual(mockResponse.user)
    expect(result.current.tokens).toEqual(mockResponse.tokens)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should handle logout', async () => {
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
    }

    mockTokenStorage.getTokens.mockReturnValue(mockTokens)
    mockTokenStorage.isTokenExpired.mockReturnValue(false)
    mockAuthService.getCurrentUser.mockResolvedValue({})
    mockAuthService.logout.mockResolvedValue(undefined)

    const { result, unmount } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 10000 })

    act(() => {
      result.current.logout()
    })

    expect(mockTokenStorage.clearAll).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.tokens).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    
    unmount()
  })

  it('should handle token refresh', async () => {
    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: Date.now() + 3600000,
    }
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresAt: Date.now() + 3600000,
    }

    mockTokenStorage.getTokens.mockReturnValue(mockTokens)
    mockTokenStorage.isTokenExpired.mockReturnValue(false)
    mockAuthService.getCurrentUser.mockResolvedValue({})
    mockAuthService.refreshToken.mockResolvedValue(newTokens)

    const { result, unmount } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 10000 })

    await act(async () => {
      await result.current.refreshToken()
    })

    expect(mockAuthService.refreshToken).toHaveBeenCalledWith(mockTokens.refreshToken)
    expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(newTokens)
    expect(result.current.tokens).toEqual(newTokens)
    
    unmount()
  })

  it('should handle registration successfully', async () => {
    const mockRegisterData = {
      username: 'newuser',
      email: 'new@example.com',
      password: 'password',
      fullName: 'New User',
      role: 'teacher',
      locationScope: 'school-1',
    }
    const mockResponse = {
      user: {
        id: '2',
        username: 'newuser',
        email: 'new@example.com',
        fullName: 'New User',
        role: { id: '1', name: 'teacher', level: 1, permissions: [] },
        locationScope: { type: 'school', id: '1', name: 'Test School' },
        isActive: true,
        lastLogin: new Date(),
      },
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
      },
    }

    mockTokenStorage.getTokens.mockReturnValue(null)
    mockAuthService.register.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.register(mockRegisterData)
    })

    expect(mockAuthService.register).toHaveBeenCalledWith(mockRegisterData)
    expect(mockTokenStorage.setTokens).toHaveBeenCalledWith(mockResponse.tokens)
    expect(result.current.user).toEqual(mockResponse.user)
    expect(result.current.tokens).toEqual(mockResponse.tokens)
    expect(result.current.isAuthenticated).toBe(true)
  })
})