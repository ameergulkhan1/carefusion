import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleBasedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const normalizedUserRole = String(user.role || '').trim().toLowerCase();
  const normalizedAllowedRoles = (allowedRoles || []).map((role) =>
    String(role).trim().toLowerCase()
  );

  if (normalizedAllowedRoles.length > 0 && !normalizedAllowedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Outlet />;
};

export default RoleBasedRoute;