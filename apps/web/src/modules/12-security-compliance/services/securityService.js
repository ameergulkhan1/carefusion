import api from '../../../utils/api';

export const securityService = {
  getAuditLogs: async (filters) => {
    const response = await api.get('/security/audit-logs', { params: filters });
    return response.data;
  },

  updateSecuritySettings: async (settings) => {
    const response = await api.put('/security/settings', settings);
    return response.data;
  },

  enable2FA: async (userId) => {
    const response = await api.post('/security/2fa/enable', { userId });
    return response.data;
  },

  getComplianceReport: async () => {
    const response = await api.get('/security/compliance-report');
    return response.data;
  }
};

export default securityService;