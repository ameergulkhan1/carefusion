import api from '../../../utils/api';

const appointmentService = {
  bookAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to book appointment' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      }
      throw errorData;
    }
  },

  getAppointments: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`/appointments?${params.toString()}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to get appointments' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status === 404) {
        // Return empty array if no appointments found
        return { success: true, data: [] };
      }
      throw errorData;
    }
  },

  getAppointmentById: async (appointmentId) => {
    try {
      const response = await api.get(`/appointments/${appointmentId}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to get appointment' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      }
      throw errorData;
    }
  },

  cancelAppointment: async (appointmentId, reason) => {
    try {
      const response = await api.patch(`/appointments/${appointmentId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to cancel appointment' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      }
      throw errorData;
    }
  },

  updateAppointment: async (appointmentId, updateData) => {
    try {
      const response = await api.put(`/appointments/${appointmentId}`, updateData);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to update appointment' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      }
      throw errorData;
    }
  }
};

export default appointmentService;