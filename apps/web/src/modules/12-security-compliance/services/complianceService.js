import api from '../../../utils/api';

/**
 * Compliance Management Service
 * Handles healthcare regulations compliance (HIPAA, GDPR, HITECH Act)
 */
export const complianceService = {
  /**
   * Get compliance status
   * @returns {Promise} - Current compliance status
   */
  getComplianceStatus: async () => {
    try {
      const response = await api.get('/security/compliance/status');
      return response.data;
    } catch (error) {
      console.error('Error fetching compliance status:', error);
      throw error;
    }
  },

  /**
   * Get HIPAA compliance report
   * @param {object} filters - Filter criteria
   * @returns {Promise} - HIPAA compliance data
   */
  getHIPAAReport: async (filters = {}) => {
    try {
      const response = await api.get('/security/compliance/hipaa', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          detailed: filters.detailed || true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching HIPAA report:', error);
      throw error;
    }
  },

  /**
   * Get GDPR compliance report
   * @param {object} filters - Filter criteria
   * @returns {Promise} - GDPR compliance data
   */
  getGDPRReport: async (filters = {}) => {
    try {
      const response = await api.get('/security/compliance/gdpr', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          detailed: filters.detailed || true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching GDPR report:', error);
      throw error;
    }
  },

  /**
   * Get HITECH Act compliance report
   * @param {object} filters - Filter criteria
   * @returns {Promise} - HITECH compliance data
   */
  getHITECHReport: async (filters = {}) => {
    try {
      const response = await api.get('/security/compliance/hitech', {
        params: {
          startDate: filters.startDate,
          endDate: filters.endDate,
          detailed: filters.detailed || true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching HITECH report:', error);
      throw error;
    }
  },

  /**
   * Get all compliance violations
   * @param {object} filters - Filter criteria
   * @returns {Promise} - List of violations
   */
  getComplianceViolations: async (filters = {}) => {
    try {
      const response = await api.get('/security/compliance/violations', {
        params: {
          severity: filters.severity,
          standard: filters.standard,
          status: filters.status,
          startDate: filters.startDate,
          endDate: filters.endDate
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching compliance violations:', error);
      throw error;
    }
  },

  /**
   * Report compliance violation
   * @param {object} violationData - Violation details
   * @returns {Promise} - Created violation report
   */
  reportViolation: async (violationData) => {
    try {
      const response = await api.post('/security/compliance/violations', {
        type: violationData.type,
        standard: violationData.standard,
        severity: violationData.severity,
        description: violationData.description,
        affectedRecords: violationData.affectedRecords,
        discoveredDate: violationData.discoveredDate,
        reportedBy: violationData.reportedBy
      });
      return response.data;
    } catch (error) {
      console.error('Error reporting violation:', error);
      throw error;
    }
  },

  /**
   * Remediate compliance violation
   * @param {string} violationId - Violation ID
   * @param {object} remediationData - Remediation details
   * @returns {Promise} - Updated violation
   */
  remediateViolation: async (violationId, remediationData) => {
    try {
      const response = await api.put(
        `/security/compliance/violations/${violationId}`,
        {
          status: 'resolved',
          remediationSteps: remediationData.steps,
          completedDate: new Date().toISOString(),
          notes: remediationData.notes
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error remediating violation:', error);
      throw error;
    }
  },

  /**
   * Get data retention policy
   * @returns {Promise} - Data retention settings
   */
  getDataRetentionPolicy: async () => {
    try {
      const response = await api.get('/security/compliance/data-retention');
      return response.data;
    } catch (error) {
      console.error('Error fetching data retention policy:', error);
      throw error;
    }
  },

  /**
   * Update data retention policy
   * @param {object} policyData - Policy details
   * @returns {Promise} - Updated policy
   */
  updateDataRetentionPolicy: async (policyData) => {
    try {
      const response = await api.put('/security/compliance/data-retention', {
        patientRecords: policyData.patientRecords,
        medicalRecords: policyData.medicalRecords,
        auditLogs: policyData.auditLogs,
        communications: policyData.communications,
        backups: policyData.backups
      });
      return response.data;
    } catch (error) {
      console.error('Error updating data retention policy:', error);
      throw error;
    }
  },

  /**
   * Get password policy
   * @returns {Promise} - Password policy settings
   */
  getPasswordPolicy: async () => {
    try {
      const response = await api.get('/security/compliance/password-policy');
      return response.data;
    } catch (error) {
      console.error('Error fetching password policy:', error);
      throw error;
    }
  },

  /**
   * Update password policy
   * @param {object} policyData - Policy details
   * @returns {Promise} - Updated policy
   */
  updatePasswordPolicy: async (policyData) => {
    try {
      const response = await api.put('/security/compliance/password-policy', {
        minLength: policyData.minLength,
        complexityRequired: policyData.complexityRequired,
        expirationDays: policyData.expirationDays,
        historyCount: policyData.historyCount,
        lockoutAttempts: policyData.lockoutAttempts,
        lockoutDuration: policyData.lockoutDuration
      });
      return response.data;
    } catch (error) {
      console.error('Error updating password policy:', error);
      throw error;
    }
  },

  /**
   * Get training records
   * @returns {Promise} - Compliance training records
   */
  getTrainingRecords: async () => {
    try {
      const response = await api.get('/security/compliance/training');
      return response.data;
    } catch (error) {
      console.error('Error fetching training records:', error);
      throw error;
    }
  },

  /**
   * Record training completion
   * @param {object} trainingData - Training details
   * @returns {Promise} - Created training record
   */
  recordTraining: async (trainingData) => {
    try {
      const response = await api.post('/security/compliance/training', {
        userId: trainingData.userId,
        courseId: trainingData.courseId,
        courseName: trainingData.courseName,
        completionDate: new Date().toISOString(),
        score: trainingData.score,
        certificateUrl: trainingData.certificateUrl
      });
      return response.data;
    } catch (error) {
      console.error('Error recording training:', error);
      throw error;
    }
  },

  /**
   * Get incident response plan
   * @returns {Promise} - Incident response procedures
   */
  getIncidentResponsePlan: async () => {
    try {
      const response = await api.get('/security/compliance/incident-response-plan');
      return response.data;
    } catch (error) {
      console.error('Error fetching incident response plan:', error);
      throw error;
    }
  },

  /**
   * Report security incident
   * @param {object} incidentData - Incident details
   * @returns {Promise} - Created incident report
   */
  reportSecurityIncident: async (incidentData) => {
    try {
      const response = await api.post('/security/compliance/incidents', {
        type: incidentData.type,
        severity: incidentData.severity,
        description: incidentData.description,
        affectedUsers: incidentData.affectedUsers,
        discoveredDate: incidentData.discoveredDate,
        reportedBy: incidentData.reportedBy,
        initialResponse: incidentData.initialResponse
      });
      return response.data;
    } catch (error) {
      console.error('Error reporting incident:', error);
      throw error;
    }
  },

  /**
   * Get audit readiness
   * @returns {Promise} - Audit readiness assessment
   */
  getAuditReadiness: async () => {
    try {
      const response = await api.get('/security/compliance/audit-readiness');
      return response.data;
    } catch (error) {
      console.error('Error fetching audit readiness:', error);
      throw error;
    }
  }
};

export default complianceService;
