import api from '../../../utils/api';

/**
 * Audit Trail Service
 * Tracks all user activities, data access, and system events
 * Maintains HIPAA and compliance requirements
 */
export const auditService = {
  /**
   * Get audit logs with filters
   * @param {object} filters - Filter criteria
   * @returns {Promise} - Audit logs data
   */
  getAuditLogs: async (filters = {}) => {
    try {
      const response = await api.get('/security/audit-logs', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          userId: filters.userId,
          action: filters.action,
          resourceType: filters.resourceType,
          status: filters.status,
          limit: filters.limit || 50,
          offset: filters.offset || 0
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  },

  /**
   * Get audit logs for specific resource
   * @param {string} resourceType - Type of resource
   * @param {string} resourceId - Resource ID
   * @returns {Promise} - Resource audit history
   */
  getResourceAuditTrail: async (resourceType, resourceId) => {
    try {
      const response = await api.get(`/security/audit-logs/resource/${resourceType}/${resourceId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching resource audit trail:', error);
      throw error;
    }
  },

  /**
   * Get user activity history
   * @param {string} userId - User ID
   * @param {object} options - Filter options
   * @returns {Promise} - User activity logs
   */
  getUserActivityHistory: async (userId, options = {}) => {
    try {
      const response = await api.get(`/security/audit-logs/user/${userId}`, {
        params: {
          startDate: options.startDate,
          endDate: options.endDate,
          actionType: options.actionType,
          limit: options.limit || 100
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user activity:', error);
      throw error;
    }
  },

  /**
   * Log user action
   * @param {object} action - Action details
   * @returns {Promise} - Created audit entry
   */
  logAction: async (action) => {
    try {
      const response = await api.post('/security/audit-logs', {
        userId: action.userId,
        action: action.action,
        resourceType: action.resourceType,
        resourceId: action.resourceId,
        details: action.details,
        ipAddress: action.ipAddress,
        userAgent: action.userAgent,
        timestamp: new Date().toISOString(),
        status: action.status || 'success'
      });
      return response.data;
    } catch (error) {
      console.error('Error logging action:', error);
      throw error;
    }
  },

  /**
   * Log data access
   * @param {object} accessInfo - Access information
   * @returns {Promise} - Created audit entry
   */
  logDataAccess: async (accessInfo) => {
    try {
      const response = await api.post('/security/audit-logs/data-access', {
        userId: accessInfo.userId,
        patientId: accessInfo.patientId,
        dataType: accessInfo.dataType,
        accessType: accessInfo.accessType, // 'read', 'write', 'delete'
        reason: accessInfo.reason,
        ipAddress: accessInfo.ipAddress,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error logging data access:', error);
      throw error;
    }
  },

  /**
   * Log security event (login, failed auth, etc.)
   * @param {object} eventInfo - Event information
   * @returns {Promise} - Created audit entry
   */
  logSecurityEvent: async (eventInfo) => {
    try {
      const response = await api.post('/security/audit-logs/security-event', {
        eventType: eventInfo.eventType, // 'login', 'logout', 'failed_auth', 'permission_denied', etc.
        userId: eventInfo.userId,
        ipAddress: eventInfo.ipAddress,
        details: eventInfo.details,
        severity: eventInfo.severity || 'info', // 'info', 'warning', 'critical'
        timestamp: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      console.error('Error logging security event:', error);
      throw error;
    }
  },

  /**
   * Get suspicious activities
   * @param {object} filters - Filter criteria
   * @returns {Promise} - Suspicious activity logs
   */
  getSuspiciousActivities: async (filters = {}) => {
    try {
      const response = await api.get('/security/audit-logs/suspicious-activities', {
        params: {
          severity: filters.severity,
          startDate: filters.startDate,
          endDate: filters.endDate,
          limit: filters.limit || 50
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching suspicious activities:', error);
      throw error;
    }
  },

  /**
   * Get audit summary
   * @param {object} filters - Filter criteria
   * @returns {Promise} - Audit summary statistics
   */
  getAuditSummary: async (filters = {}) => {
    try {
      const response = await api.get('/security/audit-logs/summary', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          groupBy: filters.groupBy || 'date'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching audit summary:', error);
      throw error;
    }
  },

  /**
   * Export audit logs
   * @param {object} filters - Filter criteria
   * @param {string} format - Export format (csv, pdf, json)
   * @returns {Promise} - Export data
   */
  exportAuditLogs: async (filters = {}, format = 'csv') => {
    try {
      const response = await api.get('/security/audit-logs/export', {
        params: {
          ...filters,
          format
        },
        responseType: format === 'csv' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting audit logs:', error);
      throw error;
    }
  },

  /**
   * Get compliance audit report
   * @param {object} filters - Filter criteria
   * @returns {Promise} - Compliance report
   */
  getComplianceReport: async (filters = {}) => {
    try {
      const response = await api.get('/security/compliance-report', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          standard: filters.standard // 'HIPAA', 'GDPR', 'HITECH'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching compliance report:', error);
      throw error;
    }
  }
};

export default auditService;
