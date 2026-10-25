const jwt = require('jsonwebtoken');

const jwtConfig = {
  secret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET,
  expiresIn: process.env.JWT_EXPIRE || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
};

// Generate access token
const generateToken = (userId, role, expiresIn) => {
  return jwt.sign(
    { userId, role },
    jwtConfig.secret,
    { expiresIn: expiresIn || jwtConfig.expiresIn }
  );
};

// Generate refresh token
const generateRefreshToken = (userId, expiresIn) => {
  return jwt.sign(
    { userId },
    jwtConfig.refreshSecret,
    { expiresIn: expiresIn || jwtConfig.refreshExpiresIn }
  );
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.refreshSecret);
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

module.exports = {
  jwtConfig,
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken
};
