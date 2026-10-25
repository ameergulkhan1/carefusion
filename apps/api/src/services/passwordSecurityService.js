/**
 * Password Security Service
 * Implements NIST guidelines and professional password security standards
 */

class PasswordSecurityService {
  /**
   * Validate password strength
   * Requirements:
   * - Minimum 12 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   * - Not common passwords
   */
  static validatePasswordStrength(password) {
    const issues = [];
    const score = this.calculatePasswordScore(password);

    // Length check
    if (password.length < 12) {
      issues.push('Password must be at least 12 characters long');
    }

    // Uppercase check
    if (!/[A-Z]/.test(password)) {
      issues.push('Password must contain at least one uppercase letter');
    }

    // Lowercase check
    if (!/[a-z]/.test(password)) {
      issues.push('Password must contain at least one lowercase letter');
    }

    // Number check
    if (!/\d/.test(password)) {
      issues.push('Password must contain at least one number');
    }

    // Special character check
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      issues.push('Password must contain at least one special character (!@#$%^&* etc)');
    }

    // Check against common passwords
    if (this.isCommonPassword(password)) {
      issues.push('Password is too common or previously breached');
    }

    // Check for sequential characters
    if (this.hasSequentialChars(password)) {
      issues.push('Password contains sequential characters (e.g., abc, 123)');
    }

    // Check for repeated characters
    if (this.hasRepeatedChars(password)) {
      issues.push('Password contains too many repeated characters');
    }

    return {
      valid: issues.length === 0,
      score, // 0-100
      strength: this.getStrengthLevel(score),
      issues,
      message: issues.length === 0 ? 'Password is strong' : 'Password is too weak'
    };
  }

  /**
   * Calculate password score (0-100)
   */
  static calculatePasswordScore(password) {
    let score = 0;

    // Length scoring
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    if (password.length >= 20) score += 10;

    // Character diversity
    if (/[a-z]/.test(password)) score += 15;
    if (/[A-Z]/.test(password)) score += 15;
    if (/\d/.test(password)) score += 15;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

    // Bonus for very strong passwords
    if (password.length >= 24 && 
        /[a-z]/.test(password) && 
        /[A-Z]/.test(password) && 
        /\d/.test(password) && 
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  /**
   * Get strength level label
   */
  static getStrengthLevel(score) {
    if (score >= 80) return 'VERY_STRONG';
    if (score >= 60) return 'STRONG';
    if (score >= 40) return 'MODERATE';
    if (score >= 20) return 'WEAK';
    return 'VERY_WEAK';
  }

  /**
   * Check against common/breached passwords
   */
  static isCommonPassword(password) {
    const commonPasswords = [
      'password', 'password123', 'admin', 'admin123',
      'letmein', 'welcome', 'monkey', 'dragon',
      'qwerty', 'abc123', '123456', 'princess',
      'iloveyou', 'pakistan', 'lahore', 'karachi',
      'islamabad', 'password1', 'pass123', 'test123'
    ];

    return commonPasswords.some(common => 
      password.toLowerCase().includes(common.toLowerCase())
    );
  }

  /**
   * Check for sequential characters
   */
  static hasSequentialChars(password) {
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);

      // Check if sequential
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check for repeated characters
   */
  static hasRepeatedChars(password) {
    const repeatedPattern = /(.)\1{2,}/;
    return repeatedPattern.test(password);
  }

  /**
   * Generate secure random password
   */
  static generateSecurePassword(length = 16) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const all = uppercase + lowercase + numbers + special;
    let password = '';

    // Ensure at least one of each type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill remaining length
    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

module.exports = PasswordSecurityService;
