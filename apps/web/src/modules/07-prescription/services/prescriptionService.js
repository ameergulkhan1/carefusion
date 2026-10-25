import api from '../../../utils/api';

const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.prescriptions)) return payload.prescriptions;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const prescriptionService = {
  getAvailablePharmacies: async () => {
    const response = await api.get('/prescriptions/pharmacies');
    return response.data;
  },

  getPrescriptions: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.patientId) params.append('patientId', filters.patientId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get(`/prescriptions?${params.toString()}`);
    return {
      ...response.data,
      data: normalizeList(response.data?.data)
    };
  },

  getPrescriptionById: async (prescriptionId) => {
    const response = await api.get(`/prescriptions/${prescriptionId}`);
    return response.data;
  },

  createPrescription: async (prescriptionData) => {
    const response = await api.post('/prescriptions', prescriptionData);
    return response.data;
  },

  updatePrescription: async (prescriptionId, prescriptionData) => {
    const response = await api.put(`/prescriptions/${prescriptionId}`, prescriptionData);
    return response.data;
  },

  markAsDispensed: async (prescriptionId) => {
    const response = await api.patch(`/prescriptions/${prescriptionId}/dispense`);
    return response.data;
  },

  sendToPharmacy: async (prescriptionId, payload) => {
    const response = await api.patch(`/prescriptions/${prescriptionId}/send-to-pharmacy`, payload);
    return response.data;
  },

  requestRefill: async (prescriptionId, payload = {}) => {
    const response = await api.patch(`/prescriptions/${prescriptionId}/refill`, payload);
    return response.data;
  },

  renewPrescription: async (prescriptionId, payload = {}) => {
    const response = await api.patch(`/prescriptions/${prescriptionId}/renew`, payload);
    return response.data;
  },

  generatePDF: async (prescriptionId) => {
    const response = await api.get(`/prescriptions/${prescriptionId}/pdf`, { responseType: 'blob' });
    return response.data;
  }
};

export default prescriptionService;