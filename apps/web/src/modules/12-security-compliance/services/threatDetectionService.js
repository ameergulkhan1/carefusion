import api from '../../../utils/api';

/**
 * Threat Detection and Response Service
 * Detects suspicious activities and potential security threats
 */
export const threatDetectionService = {
  /**
   * Get detected threats
   * @param {object} filters - Filter criteria
   * @returns {Promise} - List of threats
   */
  getDetectedThreats: async (filters = {}) => {
    try {
      const response = await api.get('/security/threats', {
        params: {
          severity: filters.severity,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: filters.limit || 50
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching threats:', error);
      throw error;
    }
  },

  /**
   * Get threat details
   * @param {string} threatId - Threat ID
   * @returns {Promise} - Threat details
   */
  getThreatDetails: async (threatId) => {
    try {
      const response = await api.get(`/security/threats/${threatId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching threat details:', error);
      throw error;
    }
  },

  /**
   * Report suspicious activity
   * @param {object} reportData - Suspicious activity details
   * @returns {Promise} - Created threat report
   */
  reportSuspiciousActivity: async (reportData) => {
    try {
      const response = await api.post('/security/threats/report', {
        type: reportData.type, // 'unauthorized_access', 'failed_login', 'data_exfiltration', etc.
        severity: reportData.severity || 'medium',
        description: reportData.description,
        userId: reportData.userId,
        resourceId: reportData.resourceId,
        ipAddress: reportData.ipAddress,
        timestamp: new Date().toISOString(),
        evidence: reportData.evidence
      });
      return response.data;
    } catch (error) {
      console.error('Error reporting suspicious activity:', error);
      throw error;
    }
  },

  /**
   * Detect brute force attempts
   * @param {object} filters - Filter criteria
   * @returns {Promise} - Brute force attempt data
   */
  detectBruteForceAttempts: async (filters = {}) => {
    try {
      const response = await api.get('/security/threats/brute-force', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          threshold: filters.threshold || 5
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting brute force attempts:', error);
      throw error;
    }
  },

  /**
   * Detect data access anomalies
   * @param {object} filters - Filter criteria
   * @returns {Promise} - Anomalies detected
   */
  detectDataAccessAnomalies: async (filters = {}) => {
    try {
      const response = await api.get('/security/threats/access-anomalies', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          threshold: filters.threshold || 0.7
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting access anomalies:', error);
      throw error;
    }
  },

  /**
   * Detect privilege escalation
   * @param {object} filters - Filter criteria
   * @returns {Promise} - Privilege escalation attempts
   */
  detectPrivilegeEscalation: async (filters = {}) => {
    try {
      const response = await api.get('/security/threats/privilege-escalation', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error detecting privilege escalation:', error);
      throw error;
    }
  },

  /**
   * Respond to threat
   * @param {string} threatId - Threat ID
   * @param {object} responseData - Response details
   * @returns {Promise} - Response confirmation
   */
  respondToThreat: async (threatId, responseData) => {
    try {
      const response = await api.post(`/security/threats/${threatId}/respond`, {
        action: responseData.action, // 'isolate', 'block', 'notify', 'investigate'
        severity: responseData.severity,
        notes: responseData.notes,
        respondedBy: responseData.respondedBy,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error responding to threat:', error);
      throw error;
    }
  },

  /**
   * Block user/IP
   * @param {string} identifierType - 'ip' or 'user'
   * @param {string} identifier - IP address or user ID
   * @returns {Promise} - Block confirmation
   */
  blockIdentifier: async (identifierType, identifier) => {
    try {
      const response = await api.post('/security/threats/block', {
        type: identifierType,
        identifier,
        reason: 'Suspicious activity detected',
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error blocking identifier:', error);
      throw error;
    }
  },

  /**
   * Get blocked IPs/Users
   * @returns {Promise} - List of blocked identifiers
   */
  getBlockedIdentifiers: async () => {
    try {
      const response = await api.get('/security/threats/blocked');
      return response.data;
    } catch (error) {
      console.error('Error fetching blocked identifiers:', error);
      throw error;
    }
  },

  /**
   * Unblock identifier
   * @param {string} blockId - Block ID
   * @returns {Promise} - Unblock confirmation
   */
  unblockIdentifier: async (blockId) => {
    try {
      const response = await api.delete(`/security/threats/blocked/${blockId}`);
      return response.data;
    } catch (error) {
      console.error('Error unblocking identifier:', error);
      throw error;
    }
  },

  /**
   * Get threat analytics
   * @returns {Promise} - Threat statistics
   */
  getThreatAnalytics: async () => {
    try {
      const response = await api.get('/security/threats/analytics');
      return response.data;
    } catch (error) {
      console.error('Error fetching threat analytics:', error);
      throw error;
    }
  },

  /**
   * Setup threat alerts
   * @param {object} alertConfig - Alert configuration
   * @returns {Promise} - Updated alert config
   */
  setupThreatAlerts: async (alertConfig) => {
    try {
      const response = await api.post('/security/threats/alerts', {
        enabledAlerts: alertConfig.enabledAlerts,
        notificationChannels: alertConfig.notificationChannels,
        severity: alertConfig.severity
      });
      return response.data;
    } catch (error) {
      console.error('Error setting up threat alerts:', error);
      throw error;
    }
  }
};

export default threatDetectionService;
