const User = require('../models/User');
const AccountSecurity = require('../models/AccountSecurity');
const SecurityAudit = require('../models/SecurityAudit');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const geoip = require('geoip-lite');

class SecurityService {
  /**
   * Log security event
   */
  static async logSecurityEvent(userId, email, eventType, options = {}) {
    try {
      const {
        ipAddress,
        userAgent,
        status = 'SUCCESS',
        reason = null,
        riskLevel = 'LOW',
        sessionId,
        tokenType,
        metadata
      } = options;

      // Parse device info from user agent
      const deviceInfo = this.parseUserAgent(userAgent);
      
      // Get geolocation from IP
      const location = geoip.lookup(ipAddress);

      const auditEntry = new SecurityAudit({
        userId,
        email,
        eventType,
        status,
        riskLevel,
        ipAddress,
        userAgent,
        deviceInfo,
        reason,
        sessionId,
        tokenType,
        metadata,
        location: location ? {
          country: location.country,
          city: location.city,
          coordinates: {
            type: 'Point',
            coordinates: [location.ll[1], location.ll[0]]
          }
        } : null
      });

      await auditEntry.save();
      return auditEntry;
    } catch (error) {
      console.error('Error logging security event:', error);
      throw error;
    }
  }

  /**
   * Record login attempt
   */
  static async recordLoginAttempt(email, ipAddress, userAgent, success = false) {
    try {
      let accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        const user = await User.findOne({ email });
        if (!user) {
          throw new Error('User not found');
        }

        accountSecurity = new AccountSecurity({
          userId: user._id,
          email
        });
      }

      if (success) {
        // Reset failed attempts on successful login
        accountSecurity.loginAttempts = 0;
        accountSecurity.failedLoginAttempts = [];
        accountSecurity.lastFailedLoginAttempt = null;
      } else {
        // Increment failed login attempts
        accountSecurity.loginAttempts += 1;
        accountSecurity.lastFailedLoginAttempt = new Date();
        accountSecurity.failedLoginAttempts.push({
          timestamp: new Date(),
          ipAddress,
          reason: 'Invalid credentials'
        });

        // Keep only last 10 failed attempts
        if (accountSecurity.failedLoginAttempts.length > 10) {
          accountSecurity.failedLoginAttempts = accountSecurity.failedLoginAttempts.slice(-10);
        }

        // Lock account if too many failed attempts
        if (accountSecurity.loginAttempts >= 5) {
          const lockDurationMinutes = Math.min(15 * Math.pow(2, accountSecurity.loginAttempts - 5), 1440); // Max 24 hours
          accountSecurity.isLocked = true;
          accountSecurity.lockReason = `Too many failed login attempts (${accountSecurity.loginAttempts})`;
          accountSecurity.lockedAt = new Date();
          accountSecurity.lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);

          // Log account lock
          await this.logSecurityEvent(accountSecurity.userId, email, 'ACCOUNT_LOCKED', {
            ipAddress,
            userAgent,
            status: 'SUCCESS',
            reason: accountSecurity.lockReason,
            riskLevel: 'HIGH'
          });
        }
      }

      await accountSecurity.save();
      return accountSecurity;
    } catch (error) {
      console.error('Error recording login attempt:', error);
      throw error;
    }
  }

  /**
   * Check if account is locked
   */
  static async checkAccountLocked(email) {
    try {
      const accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        return { isLocked: false };
      }

      // Check if lock has expired
      if (accountSecurity.isLocked && accountSecurity.lockedUntil) {
        if (new Date() > accountSecurity.lockedUntil) {
          // Auto-unlock
          accountSecurity.isLocked = false;
          accountSecurity.lockReason = null;
          accountSecurity.lockedAt = null;
          accountSecurity.lockedUntil = null;
          await accountSecurity.save();
          
          await this.logSecurityEvent(accountSecurity.userId, email, 'ACCOUNT_UNLOCKED', {
            status: 'SUCCESS',
            reason: 'Auto-unlock due to expiration',
            riskLevel: 'LOW'
          });
          
          return { isLocked: false };
        }

        return {
          isLocked: true,
          lockedUntil: accountSecurity.lockedUntil,
          reason: accountSecurity.lockReason
        };
      }

      return { isLocked: false };
    } catch (error) {
      console.error('Error checking account lock:', error);
      throw error;
    }
  }

  /**
   * Unlock account manually
   */
  static async unlockAccount(email, reason = 'Manual unlock by admin') {
    try {
      const accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        throw new Error('Account security record not found');
      }

      accountSecurity.isLocked = false;
      accountSecurity.lockReason = null;
      accountSecurity.lockedAt = null;
      accountSecurity.lockedUntil = null;
      accountSecurity.loginAttempts = 0;
      accountSecurity.failedLoginAttempts = [];
      await accountSecurity.save();

      await this.logSecurityEvent(accountSecurity.userId, email, 'ACCOUNT_UNLOCKED', {
        status: 'SUCCESS',
        reason,
        riskLevel: 'LOW'
      });

      return accountSecurity;
    } catch (error) {
      console.error('Error unlocking account:', error);
      throw error;
    }
  }

  /**
   * Create session
   */
  static async createSession(userId, email, ipAddress, userAgent) {
    try {
      const sessionId = crypto.randomBytes(32).toString('hex');
      const deviceInfo = this.parseUserAgent(userAgent);
      
      let accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        accountSecurity = new AccountSecurity({
          userId,
          email
        });
      }

      const session = {
        sessionId,
        ipAddress,
        userAgent,
        deviceInfo,
        createdAt: new Date(),
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      };

      accountSecurity.activeSessions.push(session);

      // Remove old sessions if exceeds max
      if (accountSecurity.activeSessions.length > accountSecurity.maxActiveSessions) {
        accountSecurity.activeSessions = accountSecurity.activeSessions.slice(-accountSecurity.maxActiveSessions);
      }

      await accountSecurity.save();

      await this.logSecurityEvent(userId, email, 'SESSION_CREATED', {
        ipAddress,
        userAgent,
        sessionId,
        status: 'SUCCESS',
        riskLevel: 'LOW'
      });

      return { sessionId, expiresAt: session.expiresAt };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Validate and update session activity
   */
  static async updateSessionActivity(email, sessionId, ipAddress) {
    try {
      const accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        return { valid: false, reason: 'Account security record not found' };
      }

      const session = accountSecurity.activeSessions.find(s => s.sessionId === sessionId);
      
      if (!session) {
        return { valid: false, reason: 'Session not found' };
      }

      // Check if session has expired
      if (new Date() > new Date(session.expiresAt)) {
        accountSecurity.activeSessions = accountSecurity.activeSessions.filter(s => s.sessionId !== sessionId);
        await accountSecurity.save();
        return { valid: false, reason: 'Session expired' };
      }

      // Update activity
      session.lastActivityAt = new Date();
      session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Extend by 24 hours

      // Detect location change
      if (session.ipAddress !== ipAddress) {
        await this.logSecurityEvent(accountSecurity.userId, email, 'IP_CHANGED', {
          ipAddress,
          status: 'SUSPICIOUS',
          riskLevel: 'MEDIUM',
          metadata: { previousIP: session.ipAddress, newIP: ipAddress }
        });
      }

      await accountSecurity.save();
      return { valid: true, session };
    } catch (error) {
      console.error('Error updating session activity:', error);
      throw error;
    }
  }

  /**
   * Enable two-factor authentication
   */
  static async enableTwoFactorAuth(email, method = 'email') {
    try {
      const accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        throw new Error('Account security record not found');
      }

      if (method === 'authenticator') {
        // Generate secret for authenticator app
        const secret = speakeasy.generateSecret({
          name: `ClinicXSol (${email})`,
          length: 32
        });

        accountSecurity.twoFactorSecret = this.encryptData(secret.base32);
        
        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
          crypto.randomBytes(4).toString('hex').toUpperCase()
        );
        
        accountSecurity.twoFactorBackupCodes = backupCodes.map(code => this.hashData(code));
        
        return {
          secret: secret.base32,
          qrCode: secret.otpauth_url,
          backupCodes
        };
      } else {
        accountSecurity.twoFactorEnabled = true;
        accountSecurity.twoFactorMethod = method;
        await accountSecurity.save();
        return { enabled: true, method };
      }
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  }

  /**
   * Verify two-factor authentication
   */
  static async verifyTwoFactorAuth(email, token) {
    try {
      const accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity || !accountSecurity.twoFactorEnabled) {
        throw new Error('2FA not enabled for this account');
      }

      if (accountSecurity.twoFactorMethod === 'authenticator') {
        const secret = this.decryptData(accountSecurity.twoFactorSecret);
        
        const verified = speakeasy.totp.verify({
          secret,
          encoding: 'base32',
          token,
          window: 2
        });

        if (!verified) {
          throw new Error('Invalid 2FA token');
        }
      }

      accountSecurity.twoFactorVerifiedAt = new Date();
      await accountSecurity.save();

      await this.logSecurityEvent(accountSecurity.userId, email, '2FA_VERIFIED', {
        status: 'SUCCESS',
        riskLevel: 'LOW'
      });

      return { verified: true };
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw error;
    }
  }

  /**
   * Add trusted IP
   */
  static async addTrustedIP(email, ipAddress, deviceName) {
    try {
      const accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        throw new Error('Account security record not found');
      }

      const existingIP = accountSecurity.trustedIPs.find(ip => ip.ipAddress === ipAddress);
      
      if (!existingIP) {
        accountSecurity.trustedIPs.push({
          ipAddress,
          deviceName,
          addedAt: new Date(),
          lastUsedAt: new Date()
        });
      } else {
        existingIP.lastUsedAt = new Date();
      }

      await accountSecurity.save();

      await this.logSecurityEvent(accountSecurity.userId, email, 'DEVICE_ADDED', {
        ipAddress,
        status: 'SUCCESS',
        riskLevel: 'LOW',
        metadata: { deviceName }
      });

      return accountSecurity.trustedIPs;
    } catch (error) {
      console.error('Error adding trusted IP:', error);
      throw error;
    }
  }

  /**
   * Check if IP is trusted
   */
  static async isTrustedIP(email, ipAddress) {
    try {
      const accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        return false;
      }

      return accountSecurity.trustedIPs.some(ip => ip.ipAddress === ipAddress);
    } catch (error) {
      console.error('Error checking trusted IP:', error);
      return false;
    }
  }

  /**
   * Get security audit logs
   */
  static async getSecurityAuditLogs(userId, options = {}) {
    try {
      const {
        limit = 50,
        skip = 0,
        eventType = null,
        status = null,
        dateFrom = null,
        dateTo = null
      } = options;

      let query = { userId };

      if (eventType) {
        query.eventType = eventType;
      }

      if (status) {
        query.status = status;
      }

      if (dateFrom || dateTo) {
        query.createdAt = {};
        if (dateFrom) {
          query.createdAt.$gte = new Date(dateFrom);
        }
        if (dateTo) {
          query.createdAt.$lte = new Date(dateTo);
        }
      }

      const logs = await SecurityAudit
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const total = await SecurityAudit.countDocuments(query);

      return {
        logs,
        total,
        pages: Math.ceil(total / limit),
        currentPage: Math.floor(skip / limit) + 1
      };
    } catch (error) {
      console.error('Error fetching security audit logs:', error);
      throw error;
    }
  }

  /**
   * Detect suspicious activity
   */
  static async detectSuspiciousActivity(email, ipAddress, userAgent) {
    try {
      const accountSecurity = await AccountSecurity.findOne({ email });
      
      if (!accountSecurity) {
        return { suspicious: false };
      }

      const suspiciousIndicators = [];
      let riskLevel = 'LOW';

      // Check if IP is blocked
      const blockedIP = accountSecurity.blockedIPs.find(ip => 
        ip.ipAddress === ipAddress && new Date() < new Date(ip.blockedUntil)
      );
      
      if (blockedIP) {
        suspiciousIndicators.push('IP is blocked');
        riskLevel = 'CRITICAL';
      }

      // Check if IP is trusted
      const isTrusted = await this.isTrustedIP(email, ipAddress);
      
      if (!isTrusted && accountSecurity.trustedIPs.length > 0) {
        suspiciousIndicators.push('Login from new IP address');
        riskLevel = 'MEDIUM';
      }

      // Check for rapid login attempts
      const recentAttempts = accountSecurity.failedLoginAttempts.filter(attempt =>
        new Date(attempt.timestamp) > new Date(Date.now() - 60 * 60 * 1000) // Last 1 hour
      );
      
      if (recentAttempts.length > 3) {
        suspiciousIndicators.push('Multiple failed login attempts');
        riskLevel = 'HIGH';
      }

      // Check browser/device fingerprint
      const lastSession = accountSecurity.activeSessions[accountSecurity.activeSessions.length - 1];
      if (lastSession) {
        const currentDeviceInfo = this.parseUserAgent(userAgent);
        if (JSON.stringify(currentDeviceInfo) !== JSON.stringify(lastSession.deviceInfo)) {
          suspiciousIndicators.push('Different device detected');
          if (riskLevel === 'LOW') riskLevel = 'LOW';
        }
      }

      return {
        suspicious: suspiciousIndicators.length > 0 || blockedIP !== undefined,
        riskLevel,
        indicators: suspiciousIndicators
      };
    } catch (error) {
      console.error('Error detecting suspicious activity:', error);
      throw error;
    }
  }

  /**
   * Parse user agent to get device info
   */
  static parseUserAgent(userAgent) {
    // Simple parsing - can be enhanced with ua-parser-js library
    const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);
    const isWindows = /windows/i.test(userAgent);
    const isMac = /macintosh|macintel/i.test(userAgent);
    const isLinux = /linux/i.test(userAgent);

    let os = 'Unknown';
    if (isWindows) os = 'Windows';
    if (isMac) os = 'macOS';
    if (isLinux) os = 'Linux';

    let browser = 'Unknown';
    if (/chrome/i.test(userAgent)) browser = 'Chrome';
    if (/firefox/i.test(userAgent)) browser = 'Firefox';
    if (/safari/i.test(userAgent)) browser = 'Safari';
    if (/edge/i.test(userAgent)) browser = 'Edge';

    return {
      browser,
      os,
      device: isMobile ? 'Mobile' : 'Desktop'
    };
  }

  /**
   * Encrypt sensitive data
   */
  static encryptData(data) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-secret-key'.padEnd(32), 'utf-8');
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  static decryptData(encryptedData) {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.ENCRYPTION_KEY || 'your-secret-key'.padEnd(32), 'utf-8');
    
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    
    return decrypted;
  }

  /**
   * Hash sensitive data
   */
  static hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

module.exports = SecurityService;
