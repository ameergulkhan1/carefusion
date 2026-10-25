const { hasRole } = require('./roleCheck');

const authorize = (...roles) => {
  const allowedRoles = roles.length === 1 && Array.isArray(roles[0]) ? roles[0] : roles;
  return hasRole(...allowedRoles);
};

module.exports = {
  authorize
};
