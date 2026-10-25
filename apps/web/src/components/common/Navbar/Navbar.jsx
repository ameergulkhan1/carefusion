import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const userMenuRef = useRef(null);

  const isActive = (path) => location.pathname === path;

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isDashboardRoute = location.pathname.includes('/dashboard') || 
                          location.pathname.includes('/profile') || 
                          location.pathname.includes('/patient') || 
                          location.pathname.includes('/doctor') || 
                          location.pathname.includes('/pharmacy') || 
                          location.pathname.includes('/lab') || 
                          location.pathname.includes('/admin');

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-brand-link" aria-label="CareFusion home">
            <span className="navbar-logo-icon" aria-hidden="true">🏥</span>
            <span className="navbar-brand-text">CareFusion</span>
          </Link>
        </div>
        
        <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        {!isDashboardRoute && (
          <ul className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
            <li><Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link></li>
            <li><Link to="/services" className={isActive('/services') ? 'active' : ''}>Services</Link></li>
            <li><Link to="/about" className={isActive('/about') ? 'active' : ''}>About</Link></li>
            <li><Link to="/contact" className={isActive('/contact') ? 'active' : ''}>Contact</Link></li>
          </ul>
        )}
        
        <div className="navbar-actions">
          {isAuthenticated && user ? (
            <div className="user-menu-container" ref={userMenuRef}>
              <button 
                className="user-menu-button" 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="user-avatar">
                  {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.fullName} />
                  ) : (
                    <span>{user.fullName?.charAt(0) || user.email?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <span className="user-name">{user.fullName || user.email}</span>
                <svg className="dropdown-icon" width="12" height="8" viewBox="0 0 12 8">
                  <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <p className="user-info-name">{user.fullName || user.email}</p>
                    <p className="user-info-email">{user.email}</p>
                    <p className="user-info-role">{user.role?.toUpperCase()}</p>
                  </div>
                  <div className="user-menu-divider"></div>
                  <Link to="/dashboard" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                    <span>📊</span> Dashboard
                  </Link>
                  <Link to="/profile" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                    <span>👤</span> Profile
                  </Link>
                  <Link to="/notifications" className="user-menu-item" onClick={() => setUserMenuOpen(false)}>
                    <span>🔔</span> Notifications
                  </Link>
                  <div className="user-menu-divider"></div>
                  <button onClick={handleLogout} className="user-menu-item user-menu-logout">
                    <span>🚪</span> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn-register">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;