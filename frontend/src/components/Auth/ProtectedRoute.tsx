import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Typography, Button, Card } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermissions?: string[];
  minimumRole?: string;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  minimumRole,
  fallback,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const permissions = usePermissions();
  const location = useLocation();
  const { t } = useTranslation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 16
        }}
        data-testid="loading-spinner"
      >
        <Spin size="large" />
        <Typography.Title level={4} type="secondary">
          {t('common.loading')}
        </Typography.Title>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check access permissions
  const hasAccess = () => {
    if (!user) return false;

    // Check specific role requirement
    if (requiredRole && user.role.name.toLowerCase() !== requiredRole.toLowerCase()) {
      return false;
    }

    // Check minimum role requirement
    if (minimumRole && !permissions.hasMinimumRole(minimumRole)) {
      return false;
    }

    // Check permission-based access
    if (requiredPermissions.length > 0) {
      return permissions.hasAllPermissions(requiredPermissions);
    }

    return true;
  };

  if (!hasAccess()) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          gap: 16,
          padding: 24
        }}
        data-testid="access-denied"
      >
        <Typography.Title level={3} type="danger">
          {t('auth.accessDenied')}
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ textAlign: 'center', marginBottom: 16 }}>
          {t('auth.insufficientPermissions')}
        </Typography.Paragraph>
        <Typography.Text type="secondary" style={{ textAlign: 'center', marginBottom: 24 }}>
          {t('auth.contactAdministrator')}
        </Typography.Text>
        <Button 
          type="default"
          onClick={() => window.history.back()}
          data-testid="go-back-button"
        >
          {t('common.goBack')}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;