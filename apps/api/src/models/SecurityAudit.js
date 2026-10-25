const mongoose = require('mongoose');

const securityAuditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  eventType: {
    type: String,
    enum: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'LOGIN_ATTEMPT_FAILED',
      'ACCOUNT_LOCKED',
      'ACCOUNT_UNLOCKED',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET',
      'EMAIL_VERIFIED',
      'TOKEN_GENERATED',
      'TOKEN_EXPIRED',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'SUSPICIOUS_ACTIVITY',
      'PERMISSION_DENIED',
      '2FA_ENABLED',
      '2FA_DISABLED',
      '2FA_VERIFIED',
      '2FA_FAILED',
      'SESSION_CREATED',
      'SESSION_TERMINATED',
      'IP_CHANGED',
      'DEVICE_ADDED',
      'DEVICE_REMOVED'
    ],
    required: true,
    index: true
  },
  ipAddress: String,
  userAgent: String,
  deviceInfo: {
    browser: String,
    os: String,
    device: String
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'SUSPICIOUS'],
    default: 'SUCCESS',
    index: true
  },
  reason: String, // reason for failure or suspension
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  location: {
    country: String,
    city: String,
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: [Number] // [longitude, latitude]
    }
  },
  sessionId: String,
  tokenType: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 90 * 24 * 60 * 60 // Auto-delete after 90 days
  }
}, { timestamps: true });

// Index for finding suspicious activity
securityAuditSchema.index({ userId: 1, eventType: 1, createdAt: -1 });
securityAuditSchema.index({ email: 1, createdAt: -1 });
securityAuditSchema.index({ ipAddress: 1, createdAt: -1 });
securityAuditSchema.index({ status: 1, createdAt: -1 });
securityAuditSchema.index({ riskLevel: 1, createdAt: -1 });

module.exports = mongoose.model('SecurityAudit', securityAuditSchema);
