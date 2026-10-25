const { logger } = require('./logger');

// Audit trail middleware
exports.auditLog = (action) => {
  return (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function to capture response
    res.send = function (data) {
      // Log audit trail
      const auditData = {
        timestamp: new Date().toISOString(),
        action: action,
        userId: req.user ? req.user.userId : 'anonymous',
        userRole: req.user ? req.user.role : 'none',
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent'),
        statusCode: res.statusCode,
        requestBody: sanitizeData(req.body),
        query: req.query,
      };

      // Log based on status code
      if (res.statusCode >= 400) {
        logger.warn('Audit Trail:', auditData);
      } else {
        logger.info('Audit Trail:', auditData);
      }

      // Call original send
      originalSend.call(this, data);
    };

    next();
  };
};

// Sanitize sensitive data before logging
function sanitizeData(data) {
  if (!data) return data;
  
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'token', 'refreshToken', 'accessToken', 'cvv', 'cardNumber'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

// Critical action logging
exports.logCriticalAction = async (req, action, details) => {
  const criticalLog = {
    timestamp: new Date().toISOString(),
    action: action,
    userId: req.user ? req.user.userId : 'anonymous',
    userRole: req.user ? req.user.role : 'none',
    details: details,
    ip: req.ip || req.connection.remoteAddress,
  };

  logger.warn('CRITICAL ACTION:', criticalLog);

  // TODO: Save to audit database collection
  // await AuditLog.create(criticalLog);
};
