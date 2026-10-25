const mongoose = require('mongoose');

const accountSecuritySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
    index: true
  },
  // Login attempt tracking
  loginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLoginAttempt: Date,
  failedLoginAttempts: [{
    timestamp: Date,
    ipAddress: String,
    reason: String
  }],
  
  // Account lockout
  isLocked: {
    type: Boolean,
    default: false,
    index: true
  },
  lockReason: String,
  lockedAt: Date,
  lockedUntil: Date,
  unlockToken: String,
  
  // Two-factor authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorMethod: {
    type: String,
    enum: ['email', 'sms', 'authenticator'],
    default: 'email'
  },
  twoFactorSecret: String, // Encrypted
  twoFactorBackupCodes: [String], // Encrypted
  twoFactorVerifiedAt: Date,
  
  // Session management
  activeSessions: [{
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    deviceInfo: {
      browser: String,
      os: String,
      device: String
    },
    createdAt: Date,
    lastActivityAt: Date,
    expiresAt: Date
  }],
  maxActiveSessions: {
    type: Number,
    default: 5 // Max active sessions per user
  },
  
  // IP whitelist/blacklist
  trustedIPs: [{
    ipAddress: String,
    deviceName: String,
    addedAt: Date,
    lastUsedAt: Date
  }],
  blockedIPs: [{
    ipAddress: String,
    reason: String,
    blockedAt: Date,
    blockedUntil: Date
  }],
  
  // Password security
  passwordHistory: [{
    hash: String,
    createdAt: Date
  }],
  passwordLastChanged: Date,
  passwordExpiresAt: Date,
  requirePasswordChange: {
    type: Boolean,
    default: false
  },
  
  // Account recovery
  recoveryEmail: String,
  recoveryPhone: String,
  recoveryEmailVerified: Boolean,
  recoveryPhoneVerified: Boolean,
  
  // Security questions
  securityQuestions: [{
    question: String,
    answerHash: String
  }],
  
  // Login notifications
  notifyOnLogin: {
    type: Boolean,
    default: true
  },
  notifyOnFailedAttempt: {
    type: Boolean,
    default: true
  },
  notifyOnNewDevice: {
    type: Boolean,
    default: true
  },
  
  // Device management
  trustedDevices: [{
    deviceId: String,
    deviceName: String,
    deviceType: String,
    addedAt: Date,
    lastUsedAt: Date,
    isActive: Boolean
  }],
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for queries
accountSecuritySchema.index({ userId: 1, createdAt: -1 });
accountSecuritySchema.index({ email: 1, createdAt: -1 });
accountSecuritySchema.index({ isLocked: 1, lockedUntil: 1 });
accountSecuritySchema.index({ 'failedLoginAttempts.timestamp': 1 });

module.exports = mongoose.model('AccountSecurity', accountSecuritySchema);
