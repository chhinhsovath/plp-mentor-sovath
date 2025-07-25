import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  minimumRole?: string;
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions, if false, ANY permission
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  minimumRole,
  fallback = null,
  requireAll = true,
}) => {
  const { user } = useAuth();
  const permissions = usePermissions();

  const hasAccess = () => {
    if (!user) return false;

    // Check minimum role requirement
    if (minimumRole && !permissions.hasMinimumRole(minimumRole)) {
      return false;
    }

    // Check specific role allowlist
    if (allowedRoles.length > 0) {
      const userRole = user.role.name.toLowerCase();
      const hasAllowedRole = allowedRoles.some(role => role.toLowerCase() === userRole);
      if (!hasAllowedRole) return false;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      if (requireAll) {
        return permissions.hasAllPermissions(requiredPermissions);
      } else {
        return permissions.hasAnyPermission(requiredPermissions);
      }
    }

    return true;
  };

  if (!hasAccess()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;