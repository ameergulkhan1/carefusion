import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import '../Login/Login.css';
import './ForgotPassword.css';

const ForgotPassword = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validateEmail = () => {
    const newErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;
    if (!validateEmail()) return;

    setLoading(true);
    setErrors({});

    try {
      await forgotPassword(email);
      setSent(true);
    } catch (error) {
      setErrors({
        email: error.message || 'Unable to send reset email right now. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal forgot-password-modal">
        <div className="auth-modal-header">
          <h2>Forgot Password</h2>
          <p>Enter your email and we will send you a secure reset link.</p>
        </div>

        {!sent ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) {
                    setErrors({ ...errors, email: '' });
                  }
                }}
                className={errors.email ? 'error' : ''}
                placeholder="your@email.com"
                autoComplete="email"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending reset link...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        ) : (
          <div className="reset-sent-state">
            <p>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </p>
            <p className="reset-help-text">
              Check your inbox and spam folder, then follow the link to create a new password.
            </p>
          </div>
        )}

        <div className="auth-footer">
          <p>Remembered your password? <Link to="/login" className="link">Back to Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;