import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase.config';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const initAuth = async () => {
      if (!isMounted) return;
      await checkAuth();
    };

    initAuth();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (accessToken && storedUser) {
        // Verify token with backend
        try {
          const response = await authAPI.getProfile();
          if (response.data.success && response.data.data) {
            const userData = response.data.data.user || response.data.data;
            // Validate that we have actual user data
            if (userData && userData.email && userData.role) {
              localStorage.setItem('user', JSON.stringify(userData));
              setUser(userData);
              setIsAuthenticated(true);
            } else {
              throw new Error('Invalid user data from backend');
            }
          } else {
            throw new Error('Token verification failed');
          }
        } catch (error) {
          // Handle rate limiting gracefully
          if (error.response?.status === 429) {
            console.warn('Rate limit hit during token verification - using cached user');
            try {
              const cachedUser = JSON.parse(storedUser);
              if (cachedUser && cachedUser.email && cachedUser.role) {
                setUser(cachedUser);
                setIsAuthenticated(true);
                return;
              }
            } catch (parseError) {
              console.error('Failed to parse cached user:', parseError);
            }
          }
          
          console.error('Token verification failed:', error);
          // Token invalid, clear all storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          sessionStorage.clear();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear all auth data on error
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      // Clear any existing auth data before login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();

      const response = await authAPI.login(credentials);
      
      if (response.data.success && response.data.data) {
        const { tokens, user } = response.data.data;
        
        // Validate that we received proper tokens and user data
        if (!tokens?.accessToken || !tokens?.refreshToken) {
          throw new Error('Invalid tokens received from backend');
        }
        
        if (!user?.email || !user?.role) {
          throw new Error('Invalid user data received from backend');
        }
        
        // Verify the email matches what was entered
        if (user.email.toLowerCase() !== credentials.email.toLowerCase()) {
          console.warn('Email mismatch - entered:', credentials.email, 'received:', user.email);
        }
        
        // Store auth data
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));
        
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('Login successful for user:', user.email, 'role:', user.role);
        return response.data.data;
      }
      throw new Error(response.data.message || 'Login failed - invalid response');
    } catch (error) {
      // Clear all data on login failure
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const loginWithGoogle = async ({ idToken, role }) => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();

      const response = await authAPI.googleFirebaseAuth({ idToken, role });

      if (response.data.success && response.data.data) {
        const { tokens, user } = response.data.data;

        if (!tokens?.accessToken || !tokens?.refreshToken) {
          throw new Error('Invalid tokens received from backend');
        }

        if (!user?.email || !user?.role) {
          throw new Error('Invalid user data received from backend');
        }

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);
        setIsAuthenticated(true);
        return response.data.data;
      }

      throw new Error(response.data.message || 'Google authentication failed');
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      if (response.data.success) {
        localStorage.setItem('accessToken', response.data.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.data.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        setUser(response.data.data.user);
        setIsAuthenticated(true);
        return response.data.data;
      }
      throw new Error(response.data.message || 'Registration failed');
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await authAPI.logout();
      }
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Clear all storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      sessionStorage.clear();
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = '/login';
    }
  };

  const forgotPassword = async (email) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      throw new Error('Please enter a valid email address');
    }

    const actionCodeSettings = {
      url: process.env.REACT_APP_PASSWORD_RESET_CONTINUE_URL || `${window.location.origin}/login`,
      handleCodeInApp: false,
    };

    try {
      await sendPasswordResetEmail(auth, normalizedEmail, actionCodeSettings);
      return {
        success: true,
        message: 'If an account exists for this email, a reset link has been sent.'
      };
    } catch (firebaseError) {
      // If Firebase reset is unavailable for any reason, try backend flow as fallback.
      try {
        await authAPI.forgotPassword(normalizedEmail);
        return {
          success: true,
          message: 'If an account exists for this email, a reset link has been sent.'
        };
      } catch (apiError) {
        if (firebaseError?.code === 'auth/invalid-email') {
          throw new Error('Please enter a valid email address');
        }
        if (firebaseError?.code === 'auth/too-many-requests') {
          throw new Error('Too many attempts. Please wait a few minutes and try again.');
        }
        throw new Error(apiError?.response?.data?.message || 'Unable to send reset email right now. Please try again.');
      }
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    loginWithGoogle,
    register,
    logout,
    forgotPassword,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};