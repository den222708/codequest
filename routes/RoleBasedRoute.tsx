import React from 'react';
import { Navigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Role } from '../types';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath,
}) => {
  const { isAuthenticated, currentUser } = useApp();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    const defaultPath =
      currentUser?.role === 'student'
        ? '/student/dashboard'
        : currentUser?.role === 'professor'
        ? '/professor/dashboard'
        : '/admin/dashboard';
    return <Navigate to={fallbackPath || defaultPath} replace />;
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
