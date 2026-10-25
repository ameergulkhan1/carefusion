import api from '../../../utils/api';

const API_BASE = '/pharmacy';
const inFlightGetRequests = new Map();
const recentGetResponses = new Map();
const GET_CACHE_TTL_MS = 1000;

const buildUrl = (path, params) => {
  const query = params?.toString();
  return query ? `${API_BASE}${path}?${query}` : `${API_BASE}${path}`;
};

const getWithDedupe = async (url) => {
  const cached = recentGetResponses.get(url);
  if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL_MS) {
    return cached.data;
  }

  if (inFlightGetRequests.has(url)) {
    return inFlightGetRequests.get(url);
  }

  const request = api.get(url)
    .then((response) => {
      recentGetResponses.set(url, { data: response.data, timestamp: Date.now() });
      return response.data;
    })
    .finally(() => {
      inFlightGetRequests.delete(url);
    });

  inFlightGetRequests.set(url, request);
  return request;
};

export const pharmacyService = {
  // ============================================
  // PATIENT-FACING CATALOG
  // ============================================
  getMedicineCatalog: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.pharmacyId) params.append('pharmacyId', filters.pharmacyId);
      if (filters.lowStock !== undefined) params.append('lowStock', String(filters.lowStock));
      if (filters.limit) params.append('limit', filters.limit);

      return await getWithDedupe(buildUrl('/catalog', params));
    } catch (error) {
      throw error.response?.data || { message: 'Failed to load medicine catalog' };
    }
  },

  getPharmacyDirectory: async () => {
    try {
      return await getWithDedupe(`${API_BASE}/directory`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to load pharmacy directory' };
    }
  },

  // ============================================
  // DASHBOARD
  // ============================================
  getDashboardStats: async () => {
    try {
      return await getWithDedupe(`${API_BASE}/dashboard/stats`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get dashboard stats' };
    }
  },

  // ============================================
  // PRESCRIPTIONS
  // ============================================
  getPrescriptions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);

      return await getWithDedupe(buildUrl('/prescriptions', params));
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get prescriptions' };
    }
  },

  getPrescriptionById: async (prescriptionId) => {
    try {
      return await getWithDedupe(`${API_BASE}/prescriptions/${prescriptionId}`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get prescription details' };
    }
  },

  updatePrescriptionStatus: async (prescriptionId, status) => {
    try {
      const response = await api.patch(`${API_BASE}/prescriptions/${prescriptionId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update prescription status' };
    }
  },

  processPrescription: async (prescriptionId, processData) => {
    try {
      const response = await api.post(`${API_BASE}/prescriptions/${prescriptionId}/process`, processData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to process prescription' };
    }
  },

  // ============================================
  // INVENTORY
  // ============================================
  getInventory: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);
      if (filters.lowStock) params.append('lowStock', filters.lowStock);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      return await getWithDedupe(buildUrl('/inventory', params));
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get inventory' };
    }
  },

  getInventoryItem: async (itemId) => {
    try {
      return await getWithDedupe(`${API_BASE}/inventory/${itemId}`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get inventory item' };
    }
  },

  addInventoryItem: async (itemData) => {
    try {
      const response = await api.post(`${API_BASE}/inventory`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add inventory item' };
    }
  },

  updateInventoryItem: async (itemId, itemData) => {
    try {
      const response = await api.put(`${API_BASE}/inventory/${itemId}`, itemData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update inventory item' };
    }
  },

  deleteInventoryItem: async (itemId) => {
    try {
      const response = await api.delete(`${API_BASE}/inventory/${itemId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete inventory item' };
    }
  },

  getLowStockItems: async () => {
    try {
      return await getWithDedupe(`${API_BASE}/inventory/low-stock`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get low stock items' };
    }
  },

  // ============================================
  // ORDERS
  // ============================================
  getOrders: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      return await getWithDedupe(buildUrl('/orders', params));
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get orders' };
    }
  },

  getOrderById: async (orderId) => {
    try {
      return await getWithDedupe(`${API_BASE}/orders/${orderId}`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get order details' };
    }
  },

  updateOrderStatus: async (orderId, status, trackingInfo = {}) => {
    try {
      const response = await api.patch(`${API_BASE}/orders/${orderId}/status`, {
        status,
        ...trackingInfo
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update order status' };
    }
  },

  // ============================================
  // MEDICINE SEARCH
  // ============================================
  searchMedicine: async (query) => {
    try {
      return await getWithDedupe(`${API_BASE}/medicines/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to search medicines' };
    }
  },

  getMedicineById: async (medicineId) => {
    try {
      return await getWithDedupe(`${API_BASE}/medicines/${medicineId}`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get medicine details' };
    }
  },

  // ============================================
  // REORDER MANAGEMENT
  // ============================================
  createReorder: async (reorderData) => {
    try {
      const response = await api.post(`${API_BASE}/reorders`, reorderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create reorder' };
    }
  },

  getReorders: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);

      return await getWithDedupe(buildUrl('/reorders', params));
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get reorders' };
    }
  },

  // ============================================
  // ANALYTICS
  // ============================================
  getSalesReport: async (startDate, endDate) => {
    try {
      return await getWithDedupe(`${API_BASE}/analytics/sales?startDate=${startDate}&endDate=${endDate}`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get sales report' };
    }
  },

  getInventoryReport: async () => {
    try {
      return await getWithDedupe(`${API_BASE}/analytics/inventory`);
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get inventory report' };
    }
  },

  // ✅ NEW: Aggregated reports for the Reports page
  getReports: async (filters = {}) => {
    try {
      const today = new Date();
      const defaultEnd = today.toISOString().split('T')[0];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const defaultStart = thirtyDaysAgo.toISOString().split('T')[0];

      const startDate = filters.startDate || defaultStart;
      const endDate = filters.endDate || defaultEnd;

      const [salesResponse, inventoryResponse] = await Promise.all([
        getWithDedupe(`${API_BASE}/analytics/sales?startDate=${startDate}&endDate=${endDate}`),
        getWithDedupe(`${API_BASE}/analytics/inventory`)
      ]);

      return {
        success: true,
        data: {
          sales: salesResponse?.data || [],
          inventory: inventoryResponse?.data || {}
        }
      };
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get reports' };
    }
  }
};

export default pharmacyService;