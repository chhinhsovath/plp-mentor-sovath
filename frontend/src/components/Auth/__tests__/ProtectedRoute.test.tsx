import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ProtectedRoute from '../ProtectedRoute'
import { useAuth } from '../../../contexts/AuthContext'
import { usePermissions } from '../../../hooks/usePermissions'

// Mock the useAuth hook
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

// Mock the usePermissions hook
vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockUseAuth = useAuth as any
const mockUsePermissions = usePermissions as any

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default permissions mock
    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
    })
  })

  it('should show loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('common.loading')).toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    // Should not show protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should show access denied when user lacks required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    renderWithRouter(
      <ProtectedRoute requiredRole="administrator">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('access-denied')).toBeInTheDocument()
    expect(screen.getByText('auth.accessDenied')).toBeInTheDocument()
    expect(screen.getByText('auth.insufficientPermissions')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should render children when user has required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'administrator', permissions: [] },
      },
    })

    renderWithRouter(
      <ProtectedRoute requiredRole="administrator">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should show access denied when user lacks minimum role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => true),
    })

    renderWithRouter(
      <ProtectedRoute minimumRole="director">
        <div>Director Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('access-denied')).toBeInTheDocument()
    expect(screen.queryByText('Director Content')).not.toBeInTheDocument()
  })

  it('should render children when user has minimum role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'director', permissions: [] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => true),
    })

    renderWithRouter(
      <ProtectedRoute minimumRole="director">
        <div>Director Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Director Content')).toBeInTheDocument()
  })

  it('should show access denied when user lacks required permissions', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: ['read_observations'] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => false),
    })

    renderWithRouter(
      <ProtectedRoute requiredPermissions={['manage_users']}>
        <div>User Management</div>
      </ProtectedRoute>
    )

    expect(screen.getByTestId('access-denied')).toBeInTheDocument()
    expect(screen.queryByText('User Management')).not.toBeInTheDocument()
  })

  it('should render children when user has required permissions', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'administrator', permissions: ['manage_users', 'read_observations'] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => true),
    })

    renderWithRouter(
      <ProtectedRoute requiredPermissions={['manage_users']}>
        <div>User Management</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('User Management')).toBeInTheDocument()
  })

  it('should render custom fallback when provided', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    const customFallback = <div>Custom Access Denied</div>

    renderWithRouter(
      <ProtectedRoute requiredRole="administrator" fallback={customFallback}>
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Custom Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    expect(screen.queryByTestId('access-denied')).not.toBeInTheDocument()
  })

  it('should handle go back button click', () => {
    const mockHistoryBack = vi.fn()
    Object.defineProperty(window, 'history', {
      value: { back: mockHistoryBack },
      writable: true,
    })

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    renderWithRouter(
      <ProtectedRoute requiredRole="administrator">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    const goBackButton = screen.getByTestId('go-back-button')
    fireEvent.click(goBackButton)

    expect(mockHistoryBack).toHaveBeenCalled()
  })
})