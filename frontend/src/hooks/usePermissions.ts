import { useAuth } from '../contexts/AuthContext'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasMinimumRole,
  canManageUser,
  getAssignableRoles,
  canAccessLocation,
  PERMISSIONS,
} from '../utils/permissions'
import { UserRole } from '../types/auth'

/**
 * Custom hook for permission checking
 * Provides convenient methods for checking user permissions and roles
 */
export const usePermissions = () => {
  const { user } = useAuth()

  return {
    // Permission checks
    hasPermission: (permission: string) => hasPermission(user?.role, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(user?.role, permissions),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(user?.role, permissions),
    
    // Role hierarchy checks
    hasMinimumRole: (requiredRole: string) => hasMinimumRole(user?.role, requiredRole),
    canManageUser: (targetRole: UserRole) => canManageUser(user?.role, targetRole),
    getAssignableRoles: () => getAssignableRoles(user?.role),
    
    // Location access checks
    canAccessLocation: (targetLocationScope: { type: string; id: string; parentId?: string }) =>
      canAccessLocation(user?.locationScope, targetLocationScope),
    
    // Specific permission shortcuts
    canCreateObservation: () => hasPermission(user?.role, PERMISSIONS.CREATE_OBSERVATION),
    canViewObservation: () => hasPermission(user?.role, PERMISSIONS.VIEW_OBSERVATION),
    canEditObservation: () => hasPermission(user?.role, PERMISSIONS.EDIT_OBSERVATION),
    canDeleteObservation: () => hasPermission(user?.role, PERMISSIONS.DELETE_OBSERVATION),
    canApproveObservation: () => hasPermission(user?.role, PERMISSIONS.APPROVE_OBSERVATION),
    
    canViewReports: () => hasPermission(user?.role, PERMISSIONS.VIEW_REPORTS),
    canGenerateReports: () => hasPermission(user?.role, PERMISSIONS.GENERATE_REPORTS),
    canExportReports: () => hasPermission(user?.role, PERMISSIONS.EXPORT_REPORTS),
    
    canViewUsers: () => hasPermission(user?.role, PERMISSIONS.VIEW_USERS),
    canCreateUser: () => hasPermission(user?.role, PERMISSIONS.CREATE_USER),
    canEditUser: () => hasPermission(user?.role, PERMISSIONS.EDIT_USER),
    canDeleteUser: () => hasPermission(user?.role, PERMISSIONS.DELETE_USER),
    canAssignRoles: () => hasPermission(user?.role, PERMISSIONS.ASSIGN_ROLES),
    
    canManageSettings: () => hasPermission(user?.role, PERMISSIONS.MANAGE_SETTINGS),
    canViewAnalytics: () => hasPermission(user?.role, PERMISSIONS.VIEW_ANALYTICS),
    canManageForms: () => hasPermission(user?.role, PERMISSIONS.MANAGE_FORMS),
    canApproveMissions: () => hasPermission(user?.role, PERMISSIONS.APPROVE_MISSIONS),
    
    // Role shortcuts
    isAdministrator: () => user?.role?.name?.toLowerCase() === 'administrator',
    isZone: () => user?.role?.name?.toLowerCase() === 'zone',
    isProvincial: () => user?.role?.name?.toLowerCase() === 'provincial',
    isDepartment: () => user?.role?.name?.toLowerCase() === 'department',
    isCluster: () => user?.role?.name?.toLowerCase() === 'cluster',
    isDirector: () => user?.role?.name?.toLowerCase() === 'director',
    isTeacher: () => user?.role?.name?.toLowerCase() === 'teacher',
    isObserver: () => user?.role?.name?.toLowerCase() === 'observer',
    
    // Management level checks
    isManagementLevel: () => hasMinimumRole(user?.role, 'cluster'),
    isSeniorManagement: () => hasMinimumRole(user?.role, 'department'),
    isExecutiveLevel: () => hasMinimumRole(user?.role, 'provincial'),
    
    // Current user info
    user,
    userRole: user?.role,
    userLocationScope: user?.locationScope,
  }
}

/**
 * Example usage:
 * 
 * const permissions = usePermissions()
 * 
 * if (permissions.canCreateObservation()) {
 *   // Show create observation button
 * }
 * 
 * if (permissions.hasMinimumRole('director')) {
 *   // Show director-level features
 * }
 * 
 * if (permissions.canManageUser(targetUser.role)) {
 *   // Show edit/delete buttons for the user
 * }
 */