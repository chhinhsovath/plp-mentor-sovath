import { describe, it, expect } from 'vitest'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasMinimumRole,
  canManageUser,
  getAssignableRoles,
  canAccessLocation,
  PERMISSIONS,
  ROLE_HIERARCHY,
} from '../permissions'
import { UserRole } from '../../types/auth'

describe('Permission Utils', () => {
  const createRole = (name: string): UserRole => ({
    id: '1',
    name,
    level: ROLE_HIERARCHY[name] || 0,
    permissions: [],
  })

  describe('hasPermission', () => {
    it('returns false when userRole is undefined', () => {
      expect(hasPermission(undefined, PERMISSIONS.CREATE_OBSERVATION)).toBe(false)
    })

    it('returns true when user has the permission', () => {
      const teacherRole = createRole('teacher')
      expect(hasPermission(teacherRole, PERMISSIONS.CREATE_OBSERVATION)).toBe(true)
    })

    it('returns false when user lacks the permission', () => {
      const teacherRole = createRole('teacher')
      expect(hasPermission(teacherRole, PERMISSIONS.DELETE_USER)).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('returns true when user has at least one permission', () => {
      const directorRole = createRole('director')
      expect(hasAnyPermission(directorRole, [
        PERMISSIONS.CREATE_OBSERVATION,
        PERMISSIONS.DELETE_USER,
      ])).toBe(true)
    })

    it('returns false when user has none of the permissions', () => {
      const teacherRole = createRole('teacher')
      expect(hasAnyPermission(teacherRole, [
        PERMISSIONS.DELETE_USER,
        PERMISSIONS.ASSIGN_ROLES,
      ])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('returns true when user has all permissions', () => {
      const adminRole = createRole('administrator')
      expect(hasAllPermissions(adminRole, [
        PERMISSIONS.CREATE_OBSERVATION,
        PERMISSIONS.DELETE_USER,
      ])).toBe(true)
    })

    it('returns false when user lacks any permission', () => {
      const teacherRole = createRole('teacher')
      expect(hasAllPermissions(teacherRole, [
        PERMISSIONS.CREATE_OBSERVATION,
        PERMISSIONS.DELETE_USER,
      ])).toBe(false)
    })
  })

  describe('hasMinimumRole', () => {
    it('returns true when user role meets minimum requirement', () => {
      const zoneRole = createRole('zone')
      expect(hasMinimumRole(zoneRole, 'director')).toBe(true)
    })

    it('returns false when user role is below minimum requirement', () => {
      const teacherRole = createRole('teacher')
      expect(hasMinimumRole(teacherRole, 'director')).toBe(false)
    })

    it('returns true when user role equals required role', () => {
      const directorRole = createRole('director')
      expect(hasMinimumRole(directorRole, 'director')).toBe(true)
    })
  })

  describe('canManageUser', () => {
    it('returns true when manager has higher role than target', () => {
      const managerRole = createRole('provincial')
      const targetRole = createRole('department')
      expect(canManageUser(managerRole, targetRole)).toBe(true)
    })

    it('returns false when manager has same role as target', () => {
      const managerRole = createRole('department')
      const targetRole = createRole('department')
      expect(canManageUser(managerRole, targetRole)).toBe(false)
    })

    it('returns false when manager has lower role than target', () => {
      const managerRole = createRole('department')
      const targetRole = createRole('provincial')
      expect(canManageUser(managerRole, targetRole)).toBe(false)
    })
  })

  describe('getAssignableRoles', () => {
    it('returns all lower roles for administrator', () => {
      const adminRole = createRole('administrator')
      const assignableRoles = getAssignableRoles(adminRole)
      
      expect(assignableRoles).toContain('zone')
      expect(assignableRoles).toContain('provincial')
      expect(assignableRoles).toContain('teacher')
      expect(assignableRoles).not.toContain('administrator')
    })

    it('returns empty array for lowest role', () => {
      const observerRole = createRole('observer')
      const assignableRoles = getAssignableRoles(observerRole)
      
      expect(assignableRoles).toEqual([])
    })

    it('filters out duplicate role names', () => {
      const zoneRole = createRole('zone')
      const assignableRoles = getAssignableRoles(zoneRole)
      
      // Should not have both 'teacher' and 'Teacher'
      const teacherCount = assignableRoles.filter(r => r.toLowerCase() === 'teacher').length
      expect(teacherCount).toBe(1)
    })
  })

  describe('canAccessLocation', () => {
    it('returns true for national scope accessing any location', () => {
      const userScope = { type: 'national', id: '1' }
      const targetScope = { type: 'school', id: '100', parentId: '10' }
      
      expect(canAccessLocation(userScope, targetScope)).toBe(true)
    })

    it('returns true when user location matches target', () => {
      const userScope = { type: 'school', id: '100' }
      const targetScope = { type: 'school', id: '100' }
      
      expect(canAccessLocation(userScope, targetScope)).toBe(true)
    })

    it('returns true when user is parent of target location', () => {
      const userScope = { type: 'provincial', id: '10' }
      const targetScope = { type: 'department', id: '100', parentId: '10' }
      
      expect(canAccessLocation(userScope, targetScope)).toBe(true)
    })

    it('returns false when user cannot access target location', () => {
      const userScope = { type: 'school', id: '100' }
      const targetScope = { type: 'school', id: '200' }
      
      expect(canAccessLocation(userScope, targetScope)).toBe(false)
    })

    it('returns false when either scope is undefined', () => {
      const userScope = { type: 'school', id: '100' }
      
      expect(canAccessLocation(userScope, undefined)).toBe(false)
      expect(canAccessLocation(undefined, userScope)).toBe(false)
    })
  })
})