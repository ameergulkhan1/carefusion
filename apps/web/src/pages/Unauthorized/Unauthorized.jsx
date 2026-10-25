import React from 'react';
import { Link } from 'react-router-dom';
import './Unauthorized.css';

const Unauthorized = () => {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">
          <svg width="120" height="120" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1>Access Denied</h1>
        <p className="unauthorized-message">
          You don't have permission to access this page.
        </p>
        <p className="unauthorized-description">
          This page is restricted to specific user roles. Please contact your administrator if you believe you should have access.
        </p>
        <div className="unauthorized-actions">
          <Link to="/dashboard" className="btn-primary">
            Go to Dashboard
          </Link>
          <Link to="/login" className="btn-secondary">
            Login as Different User
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
