import { UserRole } from '../types/auth'

// Role hierarchy levels - higher number means higher authority
export const ROLE_HIERARCHY: Record<string, number> = {
  // Lowercase versions
  administrator: 100,
  zone: 90,
  provincial: 80,
  department: 70,
  cluster: 60,
  director: 50,
  teacher: 40,
  observer: 30,
  
  // Capitalized versions (for backward compatibility)
  Administrator: 100,
  Zone: 90,
  Provincial: 80,
  Department: 70,
  Cluster: 60,
  Director: 50,
  Teacher: 40,
  Observer: 30,
}

// Permission definitions
export const PERMISSIONS = {
  // Observation permissions
  CREATE_OBSERVATION: 'create_observation',
  VIEW_OBSERVATION: 'view_observation',
  EDIT_OBSERVATION: 'edit_observation',
  DELETE_OBSERVATION: 'delete_observation',
  APPROVE_OBSERVATION: 'approve_observation',
  
  // Report permissions
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  EXPORT_REPORTS: 'export_reports',
  
  // User management permissions
  VIEW_USERS: 'view_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  ASSIGN_ROLES: 'assign_roles',
  
  // System permissions
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_FORMS: 'manage_forms',
  APPROVE_MISSIONS: 'approve_missions',
} as const

// Role-based permission mapping
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  administrator: Object.values(PERMISSIONS), // All permissions
  Administrator: Object.values(PERMISSIONS),
  
  zone: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.APPROVE_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.APPROVE_MISSIONS,
  ],
  Zone: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.APPROVE_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.APPROVE_MISSIONS,
  ],
  
  provincial: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.APPROVE_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.APPROVE_MISSIONS,
  ],
  Provincial: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.APPROVE_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.EXPORT_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.EDIT_USER,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.APPROVE_MISSIONS,
  ],
  
  department: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.APPROVE_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  Department: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.APPROVE_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.CREATE_USER,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  
  cluster: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  Cluster: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  
  director: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  Director: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  
  teacher: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
  ],
  Teacher: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
  ],
  
  observer: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
  ],
  Observer: [
    PERMISSIONS.CREATE_OBSERVATION,
    PERMISSIONS.VIEW_OBSERVATION,
    PERMISSIONS.EDIT_OBSERVATION,
  ],
}

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (userRole: UserRole | undefined, permission: string): boolean => {
  if (!userRole) return false
  
  const rolePermissions = ROLE_PERMISSIONS[userRole.name] || []
  return rolePermissions.includes(permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (userRole: UserRole | undefined, permissions: string[]): boolean => {
  if (!userRole) return false
  
  return permissions.some(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (userRole: UserRole | undefined, permissions: string[]): boolean => {
  if (!userRole) return false
  
  return permissions.every(permission => hasPermission(userRole, permission))
}

/**
 * Check if a user's role is at least as high as the required role in the hierarchy
 */
export const hasMinimumRole = (userRole: UserRole | undefined, requiredRole: string): boolean => {
  if (!userRole) return false
  
  const userLevel = ROLE_HIERARCHY[userRole.name] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Check if a user can manage another user based on role hierarchy
 */
export const canManageUser = (managerRole: UserRole | undefined, targetRole: UserRole | undefined): boolean => {
  if (!managerRole || !targetRole) return false
  
  const managerLevel = ROLE_HIERARCHY[managerRole.name] || 0
  const targetLevel = ROLE_HIERARCHY[targetRole.name] || 0
  
  // A user can only manage users with lower hierarchy levels
  return managerLevel > targetLevel
}

/**
 * Get all roles that a user can assign to others
 */
export const getAssignableRoles = (userRole: UserRole | undefined): string[] => {
  if (!userRole) return []
  
  const userLevel = ROLE_HIERARCHY[userRole.name] || 0
  
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, level]) => level < userLevel)
    .map(([role]) => role)
    // Remove duplicates (lowercase and capitalized versions)
    .filter((role, index, array) => 
      array.findIndex(r => r.toLowerCase() === role.toLowerCase()) === index
    )
}

/**
 * Check if a user can access a location based on their location scope
 */
export const canAccessLocation = (
  userLocationScope: { type: string; id: string } | undefined,
  targetLocationScope: { type: string; id: string; parentId?: string } | undefined
): boolean => {
  if (!userLocationScope || !targetLocationScope) return false
  
  // National level can access everything
  if (userLocationScope.type === 'national') return true
  
  // Check if the user's location matches or is a parent of the target location
  if (userLocationScope.id === targetLocationScope.id) return true
  
  // Check if the user's location is a parent of the target location
  if (targetLocationScope.parentId === userLocationScope.id) return true
  
  // TODO: Implement full location hierarchy checking
  // This would require access to the full location hierarchy data
  
  return false
}

/**
 * Permission check hook usage example:
 * 
 * const { user } = useAuth()
 * const canCreateObservation = hasPermission(user?.role, PERMISSIONS.CREATE_OBSERVATION)
 * const canViewReports = hasPermission(user?.role, PERMISSIONS.VIEW_REPORTS)
 * const canManageAdmins = hasMinimumRole(user?.role, 'administrator')
 */