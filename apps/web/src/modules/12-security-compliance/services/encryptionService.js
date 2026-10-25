import crypto from 'crypto-js';

/**
 * Encryption Service for handling sensitive data encryption/decryption
 * Handles patient information, medical records, and confidential data
 */
export const encryptionService = {
  // Encryption key (should be from environment variables in production)
  ENCRYPTION_KEY: process.env.REACT_APP_ENCRYPTION_KEY || 'default-secure-key-change-in-prod',

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @returns {string} - Encrypted data
   */
  encrypt: (data) => {
    try {
      if (!data) return '';
      const encrypted = crypto.AES.encrypt(
        JSON.stringify(data),
        encryptionService.ENCRYPTION_KEY
      ).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  },

  /**
   * Decrypt sensitive data
   * @param {string} encryptedData - Encrypted data
   * @returns {any} - Decrypted data
   */
  decrypt: (encryptedData) => {
    try {
      if (!encryptedData) return null;
      const decrypted = crypto.AES.decrypt(
        encryptedData,
        encryptionService.ENCRYPTION_KEY
      ).toString(crypto.enc.Utf8);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  },

  /**
   * Hash sensitive data (one-way)
   * @param {string} data - Data to hash
   * @returns {string} - Hashed data
   */
  hash: (data) => {
    try {
      return crypto.SHA256(data).toString();
    } catch (error) {
      console.error('Hash error:', error);
      throw new Error('Failed to hash data');
    }
  },

  /**
   * Encrypt patient records
   * @param {object} patientData - Patient data to encrypt
   * @returns {object} - Encrypted patient object
   */
  encryptPatientData: (patientData) => {
    return {
      id: patientData.id,
      encryptedData: encryptionService.encrypt(patientData),
      encryptedAt: new Date().toISOString(),
      dataHash: encryptionService.hash(JSON.stringify(patientData))
    };
  },

  /**
   * Decrypt patient records
   * @param {object} encryptedPatientData - Encrypted patient data
   * @returns {object} - Decrypted patient object
   */
  decryptPatientData: (encryptedPatientData) => {
    const decrypted = encryptionService.decrypt(encryptedPatientData.encryptedData);
    // Verify data integrity
    const currentHash = encryptionService.hash(JSON.stringify(decrypted));
    if (currentHash !== encryptedPatientData.dataHash) {
      throw new Error('Data integrity check failed');
    }
    return decrypted;
  },

  /**
   * Encrypt medical records
   * @param {object} medicalRecord - Medical record to encrypt
   * @returns {object} - Encrypted medical record
   */
  encryptMedicalRecord: (medicalRecord) => {
    return {
      recordId: medicalRecord.id,
      encryptedRecord: encryptionService.encrypt(medicalRecord),
      encryptionMethod: 'AES-256',
      encryptedAt: new Date().toISOString()
    };
  },

  /**
   * Create secure token
   * @param {string} userId - User ID
   * @returns {string} - Secure token
   */
  createSecureToken: (userId) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const token = `${userId}-${timestamp}-${random}`;
    return encryptionService.hash(token);
  },

  /**
   * Mask sensitive information (SSN, credit card, etc.)
   * @param {string} value - Value to mask
   * @param {string} type - Type of value (ssn, card, phone, email)
   * @returns {string} - Masked value
   */
  maskSensitiveData: (value, type = 'ssn') => {
    if (!value) return '';

    switch (type) {
      case 'ssn':
        return value.replace(/\d(?=\d{4})/g, '*');
      case 'card':
        return value.replace(/\d(?=\d{4})/g, '*');
      case 'phone':
        return value.replace(/(\d{3})\d{3}(\d{4})/, '($1)***-$2');
      case 'email':
        const [before, after] = value.split('@');
        return `${before[0]}${'*'.repeat(before.length - 1)}@${after}`;
      default:
        return value;
    }
  }
};

export default encryptionService;
