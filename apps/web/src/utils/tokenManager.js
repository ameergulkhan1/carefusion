/**
 * Utility functions for token management
 */

/**
 * Decode JWT token without verification (for debugging)
 */
exports.decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
exports.isTokenExpired = (token) => {
  const decoded = exports.decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return Date.now() >= decoded.exp * 1000;
};

/**
 * Get token expiry date
 */
exports.getTokenExpiry = (token) => {
  const decoded = exports.decodeToken(token);
  if (!decoded || !decoded.exp) return null;
  return new Date(decoded.exp * 1000);
};

/**
 * Format time remaining until token expires
 */
exports.getTimeUntilExpiry = (token) => {
  const expiry = exports.getTokenExpiry(token);
  if (!expiry) return null;
  
  const now = new Date();
  const diff = expiry - now;
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

/**
 * Store auth tokens securely
 */
exports.storeTokens = (accessToken, refreshToken, user) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('tokenTimestamp', Date.now().toString());
  }
};

/**
 * Retrieve stored tokens
 */
exports.getStoredTokens = () => {
  if (typeof window === 'undefined') return null;
  
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const userStr = localStorage.getItem('user');
  const timestamp = localStorage.getItem('tokenTimestamp');
  
  if (!accessToken || !refreshToken) return null;
  
  return {
    accessToken,
    refreshToken,
    user: userStr ? JSON.parse(userStr) : null,
    timestamp: timestamp ? parseInt(timestamp) : null
  };
};

/**
 * Clear all auth data from storage
 */
exports.clearAuthTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp');
  }
};

/**
 * Check if user is authenticated (has valid token)
 */
exports.isAuthenticated = () => {
  const tokens = exports.getStoredTokens();
  if (!tokens) return false;
  
  // Check if access token is expired
  return !exports.isTokenExpired(tokens.accessToken);
};

/**
 * Get current user from stored data
 */
exports.getCurrentUser = () => {
  const tokens = exports.getStoredTokens();
  return tokens ? tokens.user : null;
};

/**
 * Check if current user has specific role
 */
exports.hasRole = (role) => {
  const user = exports.getCurrentUser();
  if (!user) return false;
  
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  
  return user.role === role;
};

/**
 * Get authorization header value
 */
exports.getAuthHeader = () => {
  const tokens = exports.getStoredTokens();
  if (!tokens) return null;
  return `Bearer ${tokens.accessToken}`;
};

module.exports = exports;
