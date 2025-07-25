import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import RoleBasedRoute from '../RoleBasedRoute'
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

const mockUseAuth = useAuth as any
const mockUsePermissions = usePermissions as any

describe('RoleBasedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default permissions mock
    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
    })
  })

  it('should render fallback when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
    })

    render(
      <RoleBasedRoute 
        allowedRoles={['teacher']} 
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should render children when user has allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    render(
      <RoleBasedRoute 
        allowedRoles={['teacher', 'administrator']} 
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })

  it('should render fallback when user lacks allowed role', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    render(
      <RoleBasedRoute 
        allowedRoles={['administrator']} 
        fallback={<div>Access Denied</div>}
      >
        <div>Admin Content</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should render children when user meets minimum role requirement', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'director', permissions: [] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => true),
      hasAnyPermission: vi.fn(() => true),
    })

    render(
      <RoleBasedRoute 
        minimumRole="director"
        fallback={<div>Access Denied</div>}
      >
        <div>Director Content</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Director Content')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })

  it('should render fallback when user does not meet minimum role requirement', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => false),
      hasAllPermissions: vi.fn(() => true),
      hasAnyPermission: vi.fn(() => true),
    })

    render(
      <RoleBasedRoute 
        minimumRole="director"
        fallback={<div>Access Denied</div>}
      >
        <div>Director Content</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Director Content')).not.toBeInTheDocument()
  })

  it('should render children when user has all required permissions', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'administrator', permissions: ['manage_users', 'view_reports'] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => true),
      hasAnyPermission: vi.fn(() => true),
    })

    render(
      <RoleBasedRoute 
        requiredPermissions={['manage_users', 'view_reports']}
        requireAll={true}
        fallback={<div>Access Denied</div>}
      >
        <div>Admin Panel</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })

  it('should render children when user has any required permission (requireAll=false)', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: ['view_reports'] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => true),
    })

    render(
      <RoleBasedRoute 
        requiredPermissions={['manage_users', 'view_reports']}
        requireAll={false}
        fallback={<div>Access Denied</div>}
      >
        <div>Partial Access Content</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Partial Access Content')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })

  it('should render fallback when user lacks required permissions', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: ['view_observations'] },
      },
    })

    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => true),
      hasAllPermissions: vi.fn(() => false),
      hasAnyPermission: vi.fn(() => false),
    })

    render(
      <RoleBasedRoute 
        requiredPermissions={['manage_users', 'view_reports']}
        fallback={<div>Access Denied</div>}
      >
        <div>Admin Panel</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument()
  })

  it('should render null fallback when no fallback is provided', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'teacher', permissions: [] },
      },
    })

    render(
      <RoleBasedRoute allowedRoles={['administrator']}>
        <div>Admin Content</div>
      </RoleBasedRoute>
    )

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })

  it('should handle case-insensitive role matching', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '1',
        username: 'testuser',
        role: { name: 'Teacher', permissions: [] },
      },
    })

    render(
      <RoleBasedRoute 
        allowedRoles={['teacher']} 
        fallback={<div>Access Denied</div>}
      >
        <div>Teacher Content</div>
      </RoleBasedRoute>
    )

    expect(screen.getByText('Teacher Content')).toBeInTheDocument()
    expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
  })
})