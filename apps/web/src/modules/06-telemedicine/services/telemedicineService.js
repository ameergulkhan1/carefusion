import api from '../../../utils/api';

export const telemedicineService = {
  startConsultation: async (appointmentId) => {
    const response = await api.post('/telemedicine/start', { appointmentId });
    return response.data;
  },

  endConsultation: async (sessionId) => {
    const response = await api.post('/telemedicine/end', { sessionId });
    return response.data;
  },

  sendMessage: async (sessionId, message) => {
    const response = await api.post('/telemedicine/message', { sessionId, message });
    return response.data;
  },

  getConsultationHistory: async (patientId) => {
    const response = await api.get(`/telemedicine/history/${patientId}`);
    return response.data;
  }
};

export default telemedicineService;