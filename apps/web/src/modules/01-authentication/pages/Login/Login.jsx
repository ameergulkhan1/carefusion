import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../../../../context/AuthContext';
import { auth, googleProvider } from '../../../../config/firebase.config';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clear any cached auth data on component mount
  React.useEffect(() => {
    // Only clear if on login page and not authenticated
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      localStorage.removeItem('user');
      sessionStorage.clear();
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting || loading) {
      console.log('Login already in progress, ignoring duplicate submission');
      return;
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setLoading(true);
    setErrors({});
    
    try {
      console.log('Attempting login for:', formData.email);
      
      // Call auth context login
      const data = await login({ 
        email: formData.email.trim(), 
        password: formData.password,
        rememberMe 
      });
      
      console.log('Login response:', { 
        email: data.user?.email, 
        role: data.user?.role,
        name: data.user?.fullName 
      });
      
      // Verify the logged-in user matches entered email
      if (data.user && data.user.email.toLowerCase() !== formData.email.trim().toLowerCase()) {
        console.error('Email mismatch detected!');
        alert(`Warning: You logged in as ${data.user.email}, but entered ${formData.email}`);
      }
      
      // Navigate to dashboard which will redirect based on role
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        setErrors({ 
          email: 'Too many login attempts. Please wait a few minutes and try again.' 
        });
        return;
      }
      
      // Handle error response
      const errorMessage = error.response?.data?.message 
        || error.message 
        || 'Login failed. Please check your credentials and try again.';
      
      if (error.response?.status === 401) {
        setErrors({ 
          email: 'Invalid email or password', 
          password: 'Invalid email or password' 
        });
      } else if (error.response?.status === 404) {
        setErrors({ email: 'No account found with this email' });
      } else {
        setErrors({ email: errorMessage });
      }
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isSubmitting || loading) return;

    setIsSubmitting(true);
    setLoading(true);
    setErrors({});

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      await loginWithGoogle({ idToken });
      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign-in error:', error);
      const message = error.response?.data?.message || 'Google sign-in failed. Please try again.';
      setErrors({ email: message });
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>Welcome Back!</h2>
          <p>Sign in to access your healthcare dashboard</p>
        </div>

        <button className="google-signin-btn" onClick={handleGoogleSignIn}>
          <svg className="google-icon" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="your@email.com"
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register" className="link">Sign up free</Link></p>
        </div>

        <div className="auth-meta">
          <p>Protected by reCAPTCHA and subject to the ClinixSol <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms of Service</Link>.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;