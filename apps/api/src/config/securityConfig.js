/**
 * Comprehensive Security Configuration
 * Professional-grade security settings following OWASP and industry standards
 */

const securityConfig = {
  // Password Policy
  password: {
    minLength: 12,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSpecialChars: 1,
    expiryDays: 90, // Require password change every 90 days
    historyCount: 5, // Cannot reuse last 5 passwords
    complexity: 'HIGH', // HIGH, MEDIUM, LOW
    preventCommonPasswords: true,
    preventSequentialChars: true,
    preventRepeatedChars: true
  },

  // Account Lockout Policy
  accountLockout: {
    enabled: true,
    maxAttempts: 5, // Lock after 5 failed attempts
    lockoutDurationMinutes: 15, // Initial lockout of 15 minutes
    lockoutDurationMultiplier: 2, // Double lockout on each subsequent lock
    maxLockoutDurationHours: 24, // Maximum 24 hours lockout
    countFailedAttemptsWindow: 1, // 1 hour window for counting attempts
    unlockMethod: 'automatic', // automatic, manual, email
    notifyOnLockout: true
  },

  // Session Management
  session: {
    maxActiveSessions: 5, // Max concurrent sessions per user
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
    absoluteTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days absolute max
    requireNewLoginAfterPasswordChange: true,
    terminateOtherSessionsOnPasswordChange: true,
    trackSessionActivity: true,
    detectLocationChange: true
  },

  // Two-Factor Authentication
  twoFactor: {
    enabled: true,
    required: false, // Make optional but encourage
    methods: ['email', 'sms', 'authenticator'], // Supported methods
    defaultMethod: 'email',
    codeLength: 6,
    codeExpiry: 15 * 60 * 1000, // 15 minutes
    backupCodesCount: 10,
    maxAttempts: 3,
    lockoutAfterFailedAttempts: true
  },

  // IP Management
  ipManagement: {
    enabled: true,
    trackIPChanges: true,
    requireTrustNewIP: true,
    blockUnknownIP: false, // Set to true for high security
    trustedIPExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days
    blockSuspiciousIP: true,
    geoIPBlocking: false // Can enable for specific countries
  },

  // Device Management
  device: {
    enabled: true,
    trackDevices: true,
    deviceFingerprinting: true,
    maxTrustedDevices: 10,
    requireDeviceTrust: true,
    notifyOnNewDevice: true
  },

  // Rate Limiting
  rateLimiting: {
    enabled: true,
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxAttempts: 5
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxAttempts: 3
    },
    apiGeneral: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    }
  },

  // CSRF Protection
  csrf: {
    enabled: true,
    tokenLength: 32,
    tokenExpiry: 60 * 60 * 1000, // 1 hour
    methods: ['POST', 'PUT', 'DELETE', 'PATCH']
  },

  // CORS Configuration
  cors: {
    enabled: true,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Page-Count'],
    credentials: true,
    maxAge: 86400 // 24 hours
  },

  // Security Headers
  securityHeaders: {
    'X-Frame-Options': 'DENY', // Prevent clickjacking
    'X-Content-Type-Options': 'nosniff', // Prevent MIME sniffing
    'X-XSS-Protection': '1; mode=block', // Enable XSS protection
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // HSTS
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  },

  // Encryption
  encryption: {
    enabled: true,
    algorithm: 'aes-256-cbc',
    fieldsToEncrypt: ['password', 'twoFactorSecret', 'recoveryPhone', 'ssn'],
    keyRotationInterval: 90 * 24 * 60 * 60 * 1000 // 90 days
  },

  // Audit Logging
  auditLogging: {
    enabled: true,
    logAllEvents: true,
    logRetentionDays: 90,
    events: [
      'LOGIN_SUCCESS',
      'LOGIN_FAILED',
      'ACCOUNT_LOCKED',
      'PASSWORD_CHANGED',
      'PASSWORD_RESET',
      'EMAIL_VERIFIED',
      'UNAUTHORIZED_ACCESS',
      'SUSPICIOUS_ACTIVITY',
      'PERMISSION_DENIED',
      '2FA_ENABLED',
      '2FA_DISABLED',
      '2FA_FAILED',
      'SESSION_CREATED',
      'SESSION_TERMINATED'
    ]
  },

  // Suspicious Activity Detection
  suspiciousActivity: {
    enabled: true,
    detectionMethods: [
      'LOGIN_FROM_NEW_IP',
      'RAPID_LOGIN_ATTEMPTS',
      'MULTIPLE_FAILED_ATTEMPTS',
      'DEVICE_FINGERPRINT_CHANGE',
      'UNUSUAL_TIME_LOGIN',
      'UNUSUAL_LOCATION_LOGIN',
      'API_ABUSE'
    ],
    actions: {
      LOW: 'MONITOR', // Just log
      MEDIUM: 'WARN', // Notify user
      HIGH: 'CHALLENGE', // Require 2FA
      CRITICAL: 'BLOCK' // Block access
    }
  },

  // Admin Security
  admin: {
    requireMFA: true,
    restrictAdminIP: true,
    adminIPWhitelist: process.env.ADMIN_IP_WHITELIST?.split(',') || [],
    auditAllAdminActions: true,
    adminSessionTimeout: 2 * 60 * 60 * 1000, // 2 hours
    requireAdminVerification: true
  },

  // Data Protection
  dataProtection: {
    enableEncryption: true,
    enableBackups: true,
    backupFrequency: 'daily',
    deleteInactiveAccountsAfterDays: 365,
    maskSensitiveData: true,
    dataRetentionPolicy: {
      auditLogs: 90,
      sessions: 30,
      failedLogins: 90
    }
  },

  // Compliance
  compliance: {
    gdpr: true, // EU GDPR
    hipaa: true, // Healthcare
    hitech: true, // Healthcare
    pci: false, // Payment processing (if accepting payments)
    ccpa: false // California Privacy
  },

  // Environment-specific Settings
  environments: {
    production: {
      enforceHTTPS: true,
      sendSecurityHeaders: true,
      logDetailedErrors: false,
      disableDebugMode: true,
      requirePasswordComplexity: 'HIGH',
      enforce2FA: false, // Optional but encouraged
      enableRateLimiting: true,
      enableCSRFProtection: true
    },
    staging: {
      enforceHTTPS: true,
      sendSecurityHeaders: true,
      logDetailedErrors: true,
      disableDebugMode: false,
      requirePasswordComplexity: 'HIGH',
      enforce2FA: false,
      enableRateLimiting: true,
      enableCSRFProtection: true
    },
    development: {
      enforceHTTPS: false,
      sendSecurityHeaders: false,
      logDetailedErrors: true,
      disableDebugMode: false,
      requirePasswordComplexity: 'MEDIUM',
      enforce2FA: false,
      enableRateLimiting: false,
      enableCSRFProtection: false
    }
  }
};

module.exports = securityConfig;
