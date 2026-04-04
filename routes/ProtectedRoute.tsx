import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Role } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: Role;
  allowedRoles?: Role[]; // Allow multiple roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, allowedRoles }) => {
  const { isAuthenticated, currentUser } = useApp();
  const location = useLocation();

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Build list of allowed roles
  const rolesToCheck = allowedRoles || (requiredRole ? [requiredRole] : []);

  // If roles are specified and user doesn't have one, redirect to their dashboard
  if (rolesToCheck.length > 0 && (!currentUser?.role || !rolesToCheck.includes(currentUser.role))) {
    const dashboardPath =
      currentUser?.role === 'student'
        ? '/student/dashboard'
        : currentUser?.role === 'professor'
          ? '/professor/dashboard'
          : '/admin/courses';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
