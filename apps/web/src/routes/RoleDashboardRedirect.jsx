import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RoleDashboardRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ color: '#666', marginTop: '1rem' }}>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  const roleRoutes = {
    admin: '/admin/dashboard',
    doctor: '/doctor/dashboard',
    pharmacy: '/pharmacy/dashboard',
    lab: '/laboratory/dashboard',
    laboratory: '/laboratory/dashboard',
    patient: '/patient/dashboard' // Patients now have their own dashboard
  };

  const normalizedRole = String(user.role || '').trim().toLowerCase();
  const redirectPath = roleRoutes[normalizedRole] || '/profile';

  return <Navigate to={redirectPath} replace />;
};

export default RoleDashboardRedirect;
