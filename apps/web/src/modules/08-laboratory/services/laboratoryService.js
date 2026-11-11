import api from '../../../utils/api';
import laboratoryMockService from './laboratoryMockService';

const API_URL = '/laboratory';

const FALLBACK_STATUS_CODES = new Set([404, 501, 502, 503, 504]);

const toErrorData = (error, fallbackMessage) => {
  const data = error?.response?.data;
  if (data && typeof data === 'object') return data;
  return { message: data?.message || error?.message || fallbackMessage };
};

const isFallbackError = (error) => {
  if (!error?.response) return true;
  return FALLBACK_STATUS_CODES.has(error.response.status);
};

const runWithFallback = async (apiCall, mockCall, errorMessage) => {
  try {
    const response = await apiCall();
    return response.data;
  } catch (error) {
    if (error?.response?.status === 429) {
      const errorData = toErrorData(error, 'Too many requests');
      errorData.message = 'Too many requests. Please wait a moment and try again.';
      throw errorData;
    }

    if (isFallbackError(error)) {
      console.warn(`Laboratory API unavailable for ${errorMessage}. Using mock backend fallback.`);
      return mockCall();
    }

    throw toErrorData(error, errorMessage);
  }
};

export const laboratoryService = {
  getAvailableLabs: async (params = {}) => {
    return runWithFallback(
      () => api.get(`${API_URL}/labs`, { params }),
      () => laboratoryMockService.getAvailableLabs(params),
      'Failed to fetch laboratories'
    );
  },

  getAllTests: async (params = {}) => {
    return runWithFallback(
      () => api.get(`${API_URL}/tests`, { params }),
      () => laboratoryMockService.getAllTests(params),
      'Failed to fetch laboratory tests'
    );
  },

  getTestCategories: async () => {
    return runWithFallback(
      () => api.get(`${API_URL}/tests/categories`),
      () => laboratoryMockService.getTestCategories(),
      'Failed to fetch test categories'
    );
  },

  getTestById: async (testId) => {
    return runWithFallback(
      () => api.get(`${API_URL}/tests/${testId}`),
      () => laboratoryMockService.getTestById(testId),
      'Failed to fetch test details'
    );
  },

  createOrder: async (orderData) => {
    return runWithFallback(
      () => api.post(`${API_URL}/orders`, orderData),
      () => laboratoryMockService.createOrder(orderData),
      'Failed to create laboratory order'
    );
  },

  getPatientOrders: async (params = {}) => {
    return runWithFallback(
      () => api.get(`${API_URL}/orders`, { params }),
      () => laboratoryMockService.getPatientOrders(params),
      'Failed to fetch patient laboratory orders'
    );
  },

  getLabOrders: async (params = {}) => {
    return runWithFallback(
      () => api.get(`${API_URL}/lab/orders`, { params }),
      () => laboratoryMockService.getLabOrders(params),
      'Failed to fetch laboratory operational orders'
    );
  },

  updateOrderStatus: async (orderId, payload) => {
    return runWithFallback(
      () => api.patch(`${API_URL}/lab/orders/${orderId}/status`, payload),
      () => laboratoryMockService.updateOrderStatus(orderId, payload),
      'Failed to update laboratory order status'
    );
  },

  // ✅ FIXED: Let Axios set the Content-Type automatically
  publishResult: async (orderId, testId, payload) => {
    const formData = new FormData();
    formData.append('overallResult', payload.overallResult);
    formData.append('remarks', payload.remarks || '');
    formData.append('markReported', payload.markReported);
    
    if (payload.file) {
      formData.append('labReport', payload.file);
    }

    return runWithFallback(
      () => api.post(`${API_URL}/lab/orders/${orderId}/tests/${testId}/result`, formData),
      () => laboratoryMockService.publishResult(orderId, testId, payload),
      'Failed to publish laboratory result'
    );
  },

  getOrderById: async (orderId) => {
    return runWithFallback(
      () => api.get(`${API_URL}/orders/${orderId}`),
      () => laboratoryMockService.getOrderById(orderId),
      'Failed to fetch laboratory order details'
    );
  },

  cancelOrder: async (orderId, cancelReason) => {
    return runWithFallback(
      () => api.put(`${API_URL}/orders/${orderId}/cancel`, { cancelReason }),
      () => laboratoryMockService.cancelOrder(orderId, cancelReason),
      'Failed to cancel laboratory order'
    );
  },

  getPatientResults: async () => {
    return runWithFallback(
      () => api.get(`${API_URL}/results`),
      () => laboratoryMockService.getPatientResults(),
      'Failed to fetch patient laboratory results'
    );
  },

  getResultById: async (resultId) => {
    return runWithFallback(
      () => api.get(`${API_URL}/results/${resultId}`),
      () => laboratoryMockService.getResultById(resultId),
      'Failed to fetch laboratory result details'
    );
  },

  downloadReport: async (resultId) => {
    return runWithFallback(
      () => api.get(`${API_URL}/results/${resultId}/download`),
      () => laboratoryMockService.downloadReport(resultId),
      'Failed to download laboratory report'
    );
  },

  getLaboratoryMetrics: async () => {
    return runWithFallback(
      () => api.get(`${API_URL}/metrics`),
      () => laboratoryMockService.getLaboratoryMetrics(),
      'Failed to load laboratory metrics'
    );
  }
};

export default laboratoryService;