const authMiddleware = require('./authMiddleware');

module.exports = {
  authenticate: authMiddleware.authenticate,
  optionalAuth: authMiddleware.optionalAuth,
  requireVerified: authMiddleware.requireVerified,
  protect: authMiddleware.authenticate
};
