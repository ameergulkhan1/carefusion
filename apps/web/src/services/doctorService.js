import api from '../utils/api';

const API_BASE = '/doctors';

export const doctorService = {
  // Get all available doctors (for patients to book appointments)
  getAllDoctors: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.specialization) params.append('specialization', filters.specialization);
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.available) params.append('available', filters.available);

      const response = await api.get(`${API_BASE}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get doctors' };
    }
  },

  // Get doctor by ID (public endpoint for patients)
  getDoctorById: async (doctorId) => {
    try {
      const response = await api.get(`${API_BASE}/${doctorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get doctor details' };
    }
  },

  // Get available time slots for a doctor
  getAvailableSlots: async (doctorId, date) => {
    try {
      const response = await api.get(`${API_BASE}/${doctorId}/available-slots?date=${date}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get available slots' };
    }
  },

  // Get all specializations
  getSpecializations: async () => {
    try {
      const response = await api.get(`${API_BASE}/specializations`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get specializations' };
    }
  },

  // Doctor Dashboard Stats
  getDashboardStats: async () => {
    try {
      const response = await api.get(`${API_BASE}/dashboard/stats`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get dashboard stats' };
    }
  },

  // Doctor Profile
  getProfile: async () => {
    try {
      const response = await api.get(`${API_BASE}/profile`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get doctor profile' };
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put(`${API_BASE}/profile`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update profile' };
    }
  },

  // Appointments
  getAppointments: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.date) params.append('date', filters.date);

      const response = await api.get(`${API_BASE}/appointments?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get appointments' };
    }
  },

  getTodaysAppointments: async () => {
    try {
      const response = await api.get(`${API_BASE}/appointments/today`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get today\'s appointments' };
    }
  },

  getAppointmentById: async (appointmentId) => {
    try {
      const response = await api.get(`${API_BASE}/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get appointment details' };
    }
  },

  updateAppointmentStatus: async (appointmentId, status) => {
    try {
      const response = await api.patch(`${API_BASE}/appointments/${appointmentId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update appointment status' };
    }
  },

  // Patients
  getPatients: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`${API_BASE}/patients?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get patients' };
    }
  },

  getPatientById: async (patientId) => {
    try {
      const response = await api.get(`${API_BASE}/patients/${patientId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get patient details' };
    }
  },

  getPatientMedicalHistory: async (patientId) => {
    try {
      const response = await api.get(`${API_BASE}/patients/${patientId}/medical-history`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get patient medical history' };
    }
  },

  // Prescriptions
  getPrescriptions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.patientId) params.append('patientId', filters.patientId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`${API_BASE}/prescriptions?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get prescriptions' };
    }
  },

  createPrescription: async (prescriptionData) => {
    try {
      const response = await api.post(`${API_BASE}/prescriptions`, prescriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create prescription' };
    }
  },

  updatePrescription: async (prescriptionId, prescriptionData) => {
    try {
      const response = await api.put(`${API_BASE}/prescriptions/${prescriptionId}`, prescriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update prescription' };
    }
  },

  // Clinical Notes
  getClinicalNotes: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.patientId) params.append('patientId', filters.patientId);
      if (filters.appointmentId) params.append('appointmentId', filters.appointmentId);

      const response = await api.get(`${API_BASE}/clinical-notes?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get clinical notes' };
    }
  },

  createClinicalNote: async (noteData) => {
    try {
      const response = await api.post(`${API_BASE}/clinical-notes`, noteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create clinical note' };
    }
  },

  updateClinicalNote: async (noteId, noteData) => {
    try {
      const response = await api.put(`${API_BASE}/clinical-notes/${noteId}`, noteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update clinical note' };
    }
  },

  // Schedule
  getSchedule: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`${API_BASE}/schedule?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get schedule' };
    }
  },

  updateSchedule: async (scheduleData) => {
    try {
      const response = await api.put(`${API_BASE}/schedule`, scheduleData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update schedule' };
    }
  },

  // Activity logs
  getRecentActivity: async (limit = 10) => {
    try {
      const response = await api.get(`${API_BASE}/activity?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get recent activity' };
    }
  },

  // Consultations
  getConsultations: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`${API_BASE}/consultations?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get consultations' };
    }
  },

  startConsultation: async (appointmentId) => {
    try {
      const response = await api.post(`${API_BASE}/consultations/${appointmentId}/start`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to start consultation' };
    }
  },

  endConsultation: async (consultationId, consultationData) => {
    try {
      const response = await api.post(`${API_BASE}/consultations/${consultationId}/end`, consultationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to end consultation' };
    }
  }
};

export default doctorService;
