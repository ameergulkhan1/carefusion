import api from '../../../utils/api';

export const adminService = {
  /* ===================== DASHBOARD STATS ===================== */
  
  // Get overall dashboard statistics
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Get real-time metrics
  getRealTimeMetrics: async () => {
    const response = await api.get('/admin/metrics/realtime');
    return response.data;
  },

  // Get platform usage overview
  getPlatformUsage: async (startDate, endDate) => {
    const response = await api.get(`/admin/usage?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  /* ===================== APPOINTMENTS & CONSULTATIONS ===================== */

  // Get all appointments with filters
  getAppointments: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/admin/appointments?${params}`);
    return response.data;
  },

  // Get appointment statistics
  getAppointmentStats: async (startDate, endDate) => {
    const response = await api.get(`/admin/appointments/stats?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get consultation metrics
  getConsultationMetrics: async () => {
    const response = await api.get('/admin/consultations/metrics');
    return response.data;
  },

  // Get doctor performance metrics
  getDoctorPerformance: async () => {
    const response = await api.get('/admin/doctors/performance');
    return response.data;
  },

  /* ===================== REPORTS & ANALYTICS ===================== */

  // Generate custom report
  generateReport: async (reportConfig) => {
    const response = await api.post('/admin/reports/generate', reportConfig);
    return response.data;
  },

  // Get predefined reports
  getPredefinedReports: async () => {
    const response = await api.get('/admin/reports/predefined');
    return response.data;
  },

  // Get report by id
  getReportById: async (reportId) => {
    const response = await api.get(`/admin/reports/${reportId}`);
    return response.data;
  },

  // Export report
  exportReport: async (reportId, format = 'pdf') => {
    const response = await api.get(`/admin/reports/${reportId}/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get financial analytics
  getFinancialAnalytics: async (startDate, endDate) => {
    const response = await api.get(`/admin/analytics/financial?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get user growth analytics
  getUserGrowthAnalytics: async () => {
    const response = await api.get('/admin/analytics/user-growth');
    return response.data;
  },

  /* ===================== SYSTEM PERFORMANCE ===================== */

  // Get system health
  getSystemHealth: async () => {
    const response = await api.get('/admin/system/health');
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async () => {
    const response = await api.get('/admin/system/performance');
    return response.data;
  },

  // Get server logs
  getServerLogs: async (limit = 100, offset = 0) => {
    const response = await api.get(`/admin/system/logs?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Get error logs
  getErrorLogs: async (limit = 100, offset = 0) => {
    const response = await api.get(`/admin/system/errors?limit=${limit}&offset=${offset}`);
    return response.data;
  },

  // Get API performance
  getApiPerformance: async () => {
    const response = await api.get('/admin/system/api-performance');
    return response.data;
  },

  // Get database performance
  getDatabasePerformance: async () => {
    const response = await api.get('/admin/system/db-performance');
    return response.data;
  },

  /* ===================== USER MANAGEMENT ===================== */

  // Get all users
  getUsers: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/admin/users?${params}`);
    return response.data;
  },

  // Get user by id
  getUserById: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  // Update user status
  updateUserStatus: async (userId, status) => {
    const response = await api.put(`/admin/users/${userId}/status`, { status });
    return response.data;
  },

  // Block/Unblock user
  toggleUserBlock: async (userId, isBlocked) => {
    const response = await api.put(`/admin/users/${userId}/block`, { isBlocked });
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Reset user password
  resetUserPassword: async (userId) => {
    const response = await api.post(`/admin/users/${userId}/reset-password`);
    return response.data;
  },

  // Get user activity logs
  getUserActivityLogs: async (userId, limit = 50) => {
    const response = await api.get(`/admin/users/${userId}/activity?limit=${limit}`);
    return response.data;
  },

  /* ===================== DOCTOR MANAGEMENT ===================== */

  // Get all doctors with verification status
  getDoctors: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/admin/doctors?${params}`);
    return response.data;
  },

  // Verify doctor credentials
  verifyDoctor: async (doctorId, verificationData) => {
    const response = await api.put(`/admin/doctors/${doctorId}/verify`, verificationData);
    return response.data;
  },

  // Get pending doctor verifications
  getPendingVerifications: async () => {
    const response = await api.get('/admin/doctors/pending-verification');
    return response.data;
  },

  // Get doctor statistics
  getDoctorStats: async () => {
    const response = await api.get('/admin/doctors/stats');
    return response.data;
  },

  /* ===================== PATIENT MANAGEMENT ===================== */

  // Get all patients
  getPatients: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/admin/patients?${params}`);
    return response.data;
  },

  // Get patient statistics
  getPatientStats: async () => {
    const response = await api.get('/admin/patients/stats');
    return response.data;
  },

  // Get patient demographics
  getPatientDemographics: async () => {
    const response = await api.get('/admin/patients/demographics');
    return response.data;
  },

  /* ===================== USER ACTIVITY & ANALYTICS ===================== */

  // Get overall analytics
  getAnalytics: async (startDate, endDate) => {
    const response = await api.get(`/admin/analytics?startDate=${startDate}&endDate=${endDate}`);
    return response.data;
  },

  // Get daily active users
  getDailyActiveUsers: async (days = 30) => {
    const response = await api.get(`/admin/analytics/daily-active?days=${days}`);
    return response.data;
  },

  // Get user retention metrics
  getUserRetention: async () => {
    const response = await api.get('/admin/analytics/retention');
    return response.data;
  },

  // Get feature usage statistics
  getFeatureUsage: async () => {
    const response = await api.get('/admin/analytics/feature-usage');
    return response.data;
  },

  // Get geographic analytics
  getGeographicAnalytics: async () => {
    const response = await api.get('/admin/analytics/geographic');
    return response.data;
  },

  /* ===================== AUDIT & COMPLIANCE ===================== */

  // Get audit logs
  getAuditLogs: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const response = await api.get(`/admin/audit-logs?${params}`);
    return response.data;
  },

  // Get compliance reports
  getComplianceReports: async () => {
    const response = await api.get('/admin/compliance/reports');
    return response.data;
  },

  // Generate compliance audit
  generateComplianceAudit: async (auditType) => {
    const response = await api.post('/admin/compliance/generate-audit', { auditType });
    return response.data;
  },

  /* ===================== NOTIFICATIONS & ALERTS ===================== */

  // Get system alerts
  getSystemAlerts: async () => {
    const response = await api.get('/admin/alerts');
    return response.data;
  },

  // Mark alert as resolved
  resolveAlert: async (alertId) => {
    const response = await api.put(`/admin/alerts/${alertId}/resolve`);
    return response.data;
  },

  // Configure alert thresholds
  configureAlertThresholds: async (thresholds) => {
    const response = await api.put('/admin/alerts/configure', { thresholds });
    return response.data;
  }
};

export default adminService;