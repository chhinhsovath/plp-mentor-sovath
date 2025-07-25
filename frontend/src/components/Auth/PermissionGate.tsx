import React from 'react'
import { usePermissions } from '../../hooks/usePermissions'

interface PermissionGateProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  // Permission-based access
  permission?: string
  permissions?: string[]
  requireAll?: boolean // For multiple permissions, require all (AND) or any (OR)
  // Role-based access
  role?: string
  roles?: string[]
  minimumRole?: string
  // Inverse logic
  not?: boolean // Invert the permission check
}

/**
 * Component for conditional rendering based on permissions
 * 
 * Examples:
 * <PermissionGate permission="create_observation">
 *   <Button>Create Observation</Button>
 * </PermissionGate>
 * 
 * <PermissionGate roles={['administrator', 'zone']}>
 *   <AdminPanel />
 * </PermissionGate>
 * 
 * <PermissionGate minimumRole="director">
 *   <ReportsSection />
 * </PermissionGate>
 * 
 * <PermissionGate permission="view_reports" not>
 *   <p>You don't have access to reports</p>
 * </PermissionGate>
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  fallback = null,
  permission,
  permissions = [],
  requireAll = false,
  role,
  roles = [],
  minimumRole,
  not = false,
}) => {
  const perms = usePermissions()
  
  let hasAccess = false
  
  // Check single permission
  if (permission) {
    hasAccess = perms.hasPermission(permission)
  }
  
  // Check multiple permissions
  else if (permissions.length > 0) {
    hasAccess = requireAll 
      ? perms.hasAllPermissions(permissions)
      : perms.hasAnyPermission(permissions)
  }
  
  // Check single role
  else if (role) {
    hasAccess = perms.user?.role?.name?.toLowerCase() === role.toLowerCase()
  }
  
  // Check multiple roles
  else if (roles.length > 0) {
    const userRole = perms.user?.role?.name?.toLowerCase()
    hasAccess = roles.some(r => r.toLowerCase() === userRole)
  }
  
  // Check minimum role level
  else if (minimumRole) {
    hasAccess = perms.hasMinimumRole(minimumRole)
  }
  
  // Apply NOT logic if requested
  if (not) {
    hasAccess = !hasAccess
  }
  
  return hasAccess ? <>{children}</> : <>{fallback}</>
}

export default PermissionGate