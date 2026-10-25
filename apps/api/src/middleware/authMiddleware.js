const jwt = require('jsonwebtoken');
const { verifyToken } = require('../config/jwt');
const User = require('../models/User');

/**
 * Authentication Middleware - Verify JWT and attach user to request
 * @route All protected routes
 * @access Private
 */
exports.authenticate = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if user still exists
    const user = await User.findById(decoded.userId).select('-password -refreshToken');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Attach user to request object
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      isVerified: user.isVerified
    };

    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Authorization Middleware - Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 * @returns Middleware function
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This resource is restricted to ${roles.join(', ')} only.`,
        code: 'FORBIDDEN',
        allowedRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Verify Email Middleware - Require verified email
 */
exports.requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email to access this resource.',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

/**
 * Optional Authentication - Attach user if token exists, but don't require it
 */
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const user = await User.findById(decoded.userId).select('-password -refreshToken');
        
        if (user && user.isActive) {
          req.user = {
            userId: user._id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
            isVerified: user.isVerified
          };
        }
      } catch (error) {
        // Token invalid, but that's okay for optional auth
        console.log('Optional auth token invalid:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

// Legacy compatibility - keep old names
exports.protect = exports.authenticate;
exports.restrictTo = exports.authorize;

module.exports = exports;
