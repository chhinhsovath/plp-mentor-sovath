import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PermissionGate from '../PermissionGate'
import { usePermissions } from '../../../hooks/usePermissions'

// Mock the usePermissions hook
vi.mock('../../../hooks/usePermissions', () => ({
  usePermissions: vi.fn(),
}))

const mockUsePermissions = usePermissions as any

describe('PermissionGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when user has required permission', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn(() => true),
      user: { role: { name: 'teacher' } },
    })

    render(
      <PermissionGate permission="view_observations">
        <div>Observation Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Observation Content')).toBeInTheDocument()
  })

  it('should render fallback when user lacks required permission', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn(() => false),
      user: { role: { name: 'teacher' } },
    })

    render(
      <PermissionGate 
        permission="manage_users" 
        fallback={<div>Access Denied</div>}
      >
        <div>User Management</div>
      </PermissionGate>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('User Management')).not.toBeInTheDocument()
  })

  it('should render children when user has all required permissions (requireAll=true)', () => {
    mockUsePermissions.mockReturnValue({
      hasAllPermissions: vi.fn(() => true),
      user: { role: { name: 'administrator' } },
    })

    render(
      <PermissionGate 
        permissions={['manage_users', 'view_reports']} 
        requireAll={true}
      >
        <div>Admin Panel</div>
      </PermissionGate>
    )

    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
  })

  it('should render children when user has any required permission (requireAll=false)', () => {
    mockUsePermissions.mockReturnValue({
      hasAnyPermission: vi.fn(() => true),
      user: { role: { name: 'teacher' } },
    })

    render(
      <PermissionGate 
        permissions={['manage_users', 'view_observations']} 
        requireAll={false}
      >
        <div>Partial Access Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Partial Access Content')).toBeInTheDocument()
  })

  it('should render children when user has required role', () => {
    mockUsePermissions.mockReturnValue({
      user: { role: { name: 'administrator' } },
    })

    render(
      <PermissionGate role="administrator">
        <div>Admin Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })

  it('should render fallback when user lacks required role', () => {
    mockUsePermissions.mockReturnValue({
      user: { role: { name: 'teacher' } },
    })

    render(
      <PermissionGate 
        role="administrator" 
        fallback={<div>Access Denied</div>}
      >
        <div>Admin Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should render children when user has any of the allowed roles', () => {
    mockUsePermissions.mockReturnValue({
      user: { role: { name: 'director' } },
    })

    render(
      <PermissionGate roles={['director', 'administrator']}>
        <div>Management Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Management Content')).toBeInTheDocument()
  })

  it('should render children when user meets minimum role requirement', () => {
    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => true),
      user: { role: { name: 'director' } },
    })

    render(
      <PermissionGate minimumRole="director">
        <div>Director Level Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Director Level Content')).toBeInTheDocument()
  })

  it('should render fallback when user does not meet minimum role requirement', () => {
    mockUsePermissions.mockReturnValue({
      hasMinimumRole: vi.fn(() => false),
      user: { role: { name: 'teacher' } },
    })

    render(
      <PermissionGate 
        minimumRole="director" 
        fallback={<div>Insufficient Role</div>}
      >
        <div>Director Level Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Insufficient Role')).toBeInTheDocument()
    expect(screen.queryByText('Director Level Content')).not.toBeInTheDocument()
  })

  it('should handle NOT logic correctly', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn(() => true),
      user: { role: { name: 'teacher' } },
    })

    render(
      <PermissionGate permission="manage_users" not={true}>
        <div>Non-Admin Content</div>
      </PermissionGate>
    )

    // Since user has manage_users permission and NOT is true, should not render
    expect(screen.queryByText('Non-Admin Content')).not.toBeInTheDocument()
  })

  it('should render children with NOT logic when user lacks permission', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn(() => false),
      user: { role: { name: 'teacher' } },
    })

    render(
      <PermissionGate permission="manage_users" not={true}>
        <div>Non-Admin Content</div>
      </PermissionGate>
    )

    // Since user lacks manage_users permission and NOT is true, should render
    expect(screen.getByText('Non-Admin Content')).toBeInTheDocument()
  })

  it('should render null when no fallback is provided and access is denied', () => {
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn(() => false),
      user: { role: { name: 'teacher' } },
    })

    render(
      <PermissionGate permission="manage_users">
        <div>User Management</div>
      </PermissionGate>
    )

    expect(screen.queryByText('User Management')).not.toBeInTheDocument()
  })

  it('should handle case-insensitive role matching', () => {
    mockUsePermissions.mockReturnValue({
      user: { role: { name: 'Administrator' } },
    })

    render(
      <PermissionGate role="administrator">
        <div>Admin Content</div>
      </PermissionGate>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })
})