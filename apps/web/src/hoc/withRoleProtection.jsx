import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Higher-Order Component for Role-Based Route Protection
 * Wraps components that require specific roles to access
 */
const withRoleProtection = (Component, allowedRoles = []) => {
  return (props) => {
    const { user, isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p style={{ color: '#666', marginTop: '1rem' }}>
            Verifying access...
          </p>
        </div>
      );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return <Navigate to="/unauthorized" replace />;
    }

    // User is authenticated and authorized
    return <Component {...props} />;
  };
};

export default withRoleProtection;
