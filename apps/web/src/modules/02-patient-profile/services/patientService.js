import axios from 'axios';
import { jsPDF } from 'jspdf';
import api from '../../../utils/api';

const API_BASE = '/patients';
const ML_SERVICE_BASE_URL = process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:5001';
const AI_SUMMARY_STORAGE_KEY = 'clinixsol_ai_clinical_summaries';

const readLocalSummaries = () => {
  try {
    const raw = localStorage.getItem(AI_SUMMARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to read local AI summaries:', error);
    return [];
  }
};

const writeLocalSummaries = (summaries) => {
  localStorage.setItem(AI_SUMMARY_STORAGE_KEY, JSON.stringify(summaries));
};

const wrapPdfText = (doc, text, x, y, maxWidth, lineHeight = 6) => {
  const lines = doc.splitTextToSize(String(text || ''), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const SUPPORTED_REPORT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const normalizeTags = (tagsValue) => {
  if (!tagsValue) return [];
  if (Array.isArray(tagsValue)) {
    return tagsValue.map((tag) => String(tag || '').trim().toLowerCase()).filter(Boolean);
  }
  return String(tagsValue)
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
};

const isSummaryRecord = (record = {}) => {
  const tags = normalizeTags(record.tags);
  if (tags.includes('ai_clinical_summary')) return true;

  const name = String(record.fileName || '').toLowerCase();
  return name.includes('ai-clinical-summary') || name.includes('ai clinical summary');
};

const isSupportedReportFile = (file) => (
  file && SUPPORTED_REPORT_MIME_TYPES.includes(file.type)
);

const isReportRecord = (record = {}) => {
  if (!record || isSummaryRecord(record)) return false;
  const mimeType = String(record.mimeType || '').toLowerCase();
  const fileName = String(record.fileName || '').toLowerCase();

  if (SUPPORTED_REPORT_MIME_TYPES.includes(mimeType)) return true;
  return fileName.endsWith('.pdf') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileName.endsWith('.webp');
};

export const patientService = {
  // Profile operations
  getProfile: async () => {
    try {
      const response = await api.get(`${API_BASE}/profile`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to get profile' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      }
      throw errorData;
    }
  },

  updateProfile: async (data) => {
    try {
      const response = await api.put(`${API_BASE}/profile`, data);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to update profile' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      }
      throw errorData;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get(`${API_BASE}/stats`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to get stats' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status === 404) {
        // Return empty stats if endpoint doesn't exist yet
        return { 
          success: true, 
          data: { 
            totalAppointments: 0, 
            totalPrescriptions: 0, 
            pendingLabTests: 0,
            healthScore: 0
          } 
        };
      }
      throw errorData;
    }
  },

  // Medical records operations
  getMedicalRecords: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.tags) params.append('tags', filters.tags);

      const response = await api.get(`${API_BASE}/records?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get medical records' };
    }
  },

  getMedicalRecordById: async (id) => {
    try {
      const response = await api.get(`${API_BASE}/records/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get medical record' };
    }
  },

  uploadMedicalRecord: async (file, recordData) => {
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', recordData.documentType);
      if (recordData.documentDate) formData.append('documentDate', recordData.documentDate);
      if (recordData.notes) formData.append('notes', recordData.notes);
      if (recordData.tags) formData.append('tags', recordData.tags);
      if (recordData.doctorName) formData.append('doctorName', recordData.doctorName);
      if (recordData.hospitalName) formData.append('hospitalName', recordData.hospitalName);

      const response = await api.post(`${API_BASE}/records`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to upload medical record' };
    }
  },

  summarizePdfReports: async (reportFiles = [], context = {}) => {
    try {
      const files = Array.isArray(reportFiles) ? reportFiles : [reportFiles];
      const validReportFiles = files.filter((file) => isSupportedReportFile(file));

      if (validReportFiles.length === 0) {
        throw { message: 'No supported report files provided for AI summarization' };
      }

      const buildFormData = () => {
        const formData = new FormData();
        validReportFiles.forEach((file) => formData.append('documents', file));
        // Do not include patient-identifying details in AI summarization payload.
        if (context.documentType) formData.append('documentType', context.documentType);
        return formData;
      };

      const endpoints = [
        `${ML_SERVICE_BASE_URL}/api/v1/summarize-report-documents`,
        `${ML_SERVICE_BASE_URL}/summarize-report-documents`
      ];

      let lastError = null;
      for (const endpoint of endpoints) {
        try {
          const response = await axios.post(endpoint, buildFormData(), {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000
          });
          if (response?.data?.success === false) {
            throw response.data;
          }
          return response.data;
        } catch (endpointError) {
          lastError = endpointError;
          const status = endpointError?.response?.status;
          if (status && status !== 404) {
            break;
          }
        }
      }

      const serverMessage =
        lastError?.response?.data?.message ||
        lastError?.response?.data?.error ||
        lastError?.message;

      throw {
        message: serverMessage ||
          'AI summary service is unavailable. Ensure ML service is running on port 5001 and retry.'
      };
    } catch (error) {
      throw error?.message
        ? error
        : error.response?.data || { message: 'Failed to summarize uploaded report documents' };
    }
  },

  createClinicalSummaryPdfBlob: (summaryPayload = {}) => {
    const summary = summaryPayload.summary || summaryPayload;
    const structured = summary.structuredSummary || {};
    const generatedAt = new Date().toLocaleString();
    const doc = new jsPDF();
    let y = 16;

    doc.setFontSize(16);
    doc.text('AI Clinical Notes Summary', 14, y);

    y += 8;
    doc.setFontSize(10);
    doc.text(`Generated: ${generatedAt}`, 14, y);

    const patientBits = [
      structured.patientName,
      structured.patientAge && structured.patientGender
        ? `${structured.patientAge}, ${structured.patientGender}`
        : structured.patientAge || structured.patientGender
    ].filter(Boolean);

    if (patientBits.length > 0 || structured.date) {
      y += 7;
      doc.setFontSize(10);
      if (patientBits.length > 0) {
        doc.text(`Patient: ${patientBits.join(' | ')}`, 14, y);
        y += 5;
      }
      if (structured.date) {
        doc.text(`Date: ${structured.date}`, 14, y);
      }
    }

    const shortSummary = summary.shortSummary || 'No summary available.';
    y += 10;
    doc.setFontSize(12);
    doc.text('Summary', 14, y);
    y += 6;
    doc.setFontSize(10);
    y = wrapPdfText(doc, shortSummary, 14, y, 180);

    const findings = Array.isArray(structured.findings)
      ? structured.findings
      : (Array.isArray(summary.keyFindings) ? summary.keyFindings : []);
    if (findings.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 16;
      }
      y += 6;
      doc.setFontSize(12);
      doc.text('Key Findings', 14, y);
      y += 6;
      doc.setFontSize(10);
      findings.slice(0, 8).forEach((finding, index) => {
        y = wrapPdfText(doc, `${index + 1}. ${finding}`, 14, y, 180);
      });
    }

    const assessment = structured.assessment || '';
    if (assessment) {
      if (y > 260) {
        doc.addPage();
        y = 16;
      }
      y += 6;
      doc.setFontSize(12);
      doc.text('Assessment', 14, y);
      y += 6;
      doc.setFontSize(10);
      y = wrapPdfText(doc, assessment, 14, y, 180);
    }

    const actions = Array.isArray(structured.plan)
      ? structured.plan
      : (Array.isArray(summary.suggestedFollowUpActions) ? summary.suggestedFollowUpActions : []);
    if (actions.length > 0) {
      if (y > 250) {
        doc.addPage();
        y = 16;
      }
      y += 6;
      doc.setFontSize(12);
      doc.text('Plan', 14, y);
      y += 6;
      doc.setFontSize(10);
      actions.slice(0, 8).forEach((action, index) => {
        y = wrapPdfText(doc, `${index + 1}. ${action}`, 14, y, 180);
      });
    }

    return doc.output('blob');
  },

  downloadClinicalSummaryPdf: (summaryPayload = {}, filename = `ai-clinical-summary-${Date.now()}.pdf`) => {
    const blob = patientService.createClinicalSummaryPdfBlob(summaryPayload);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  saveClinicalSummaryLocal: (summaryRecord = {}) => {
    const summaries = readLocalSummaries();
    const normalized = {
      ...summaryRecord,
      id: summaryRecord.id || `summary-${Date.now()}`,
      createdAt: summaryRecord.createdAt || new Date().toISOString()
    };

    const merged = [
      normalized,
      ...summaries.filter((item) => item.id !== normalized.id)
    ].slice(0, 50);

    writeLocalSummaries(merged);
    return normalized;
  },

  getClinicalSummariesLocal: (patientId = null) => {
    const summaries = readLocalSummaries();
    if (!patientId) return summaries;
    return summaries.filter((item) => item.patientId === patientId);
  },

  uploadClinicalSummaryToRecords: async (summaryPayload = {}, recordData = {}) => {
    const blob = patientService.createClinicalSummaryPdfBlob(summaryPayload);
    const fileName = `AI-Clinical-Summary-${new Date().toISOString().split('T')[0]}.pdf`;
    const summaryFile = new File([blob], fileName, { type: 'application/pdf' });

    const tags = recordData.tags
      ? `${recordData.tags},ai_clinical_summary`
      : 'ai_clinical_summary';

    return patientService.uploadMedicalRecord(summaryFile, {
      documentType: 'consultation_note',
      documentDate: recordData.documentDate || new Date().toISOString().split('T')[0],
      notes: summaryPayload?.summary?.shortSummary || summaryPayload?.shortSummary || 'AI-generated clinical summary from uploaded reports.',
      tags,
      doctorName: recordData.doctorName || 'AI Clinical Notes Engine',
      hospitalName: recordData.hospitalName || 'ClinixSol AI Service'
    });
  },

  getSummaryRecords: (records = []) => {
    const items = Array.isArray(records) ? records : [];
    return items.filter((record) => isSummaryRecord(record));
  },

  collectReportFilesForMasterSummary: async ({ records = [], newFiles = [] } = {}) => {
    const collected = [];
    const seen = new Set();

    const appendFile = (file) => {
      if (!isSupportedReportFile(file)) return;
      const key = `${file.name}|${file.size}|${file.type}`;
      if (seen.has(key)) return;
      seen.add(key);
      collected.push(file);
    };

    (Array.isArray(newFiles) ? newFiles : []).forEach(appendFile);

    const sourceRecords = (Array.isArray(records) ? records : []).filter(isReportRecord);
    for (const record of sourceRecords) {
      try {
        const download = await patientService.downloadMedicalRecord(record._id);
        const url = download?.data?.url;
        if (!url) continue;

        const response = await axios.get(url, { responseType: 'blob', timeout: 30000 });
        const blob = response.data;
        const mimeType = blob?.type || record.mimeType || 'application/octet-stream';
        const extensionFromMime = mimeType === 'application/pdf'
          ? 'pdf'
          : mimeType === 'image/png'
            ? 'png'
            : mimeType === 'image/webp'
              ? 'webp'
              : 'jpg';
        const filename = record.fileName || `report-${record._id}.${extensionFromMime}`;
        appendFile(new File([blob], filename, { type: mimeType }));
      } catch (error) {
        // Skip inaccessible files but continue building the best available combined summary.
        // eslint-disable-next-line no-console
        console.warn('Failed to include report in master AI summary:', record?._id, error);
      }
    }

    return collected;
  },

  updateMedicalRecord: async (id, data) => {
    try {
      const response = await api.put(`${API_BASE}/records/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update medical record' };
    }
  },

  deleteMedicalRecord: async (id) => {
    try {
      const response = await api.delete(`${API_BASE}/records/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete medical record' };
    }
  },

  shareMedicalRecord: async (id, doctorId) => {
    try {
      const response = await api.post(`${API_BASE}/records/${id}/share`, { doctorId });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to share medical record' };
    }
  },

  downloadMedicalRecord: async (id) => {
    try {
      const response = await api.get(`${API_BASE}/records/${id}/download`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to download medical record' };
    }
  },

  getMedicalRecordsByType: async (type) => {
    try {
      const response = await api.get(`${API_BASE}/records/type/${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get medical records by type' };
    }
  },

  getRecentMedicalRecords: async (limit = 10) => {
    try {
      const response = await api.get(`${API_BASE}/records/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get recent medical records' };
    }
  },

  // Medical history operations
  getMedicalHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await api.get(`${API_BASE}/medical-history?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get medical history' };
    }
  },

  addMedicalHistory: async (data) => {
    try {
      const response = await api.post(`${API_BASE}/medical-history`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add medical history' };
    }
  },

  updateMedicalHistory: async (id, data) => {
    try {
      const response = await api.put(`${API_BASE}/medical-history/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update medical history' };
    }
  },

  deleteMedicalHistory: async (id) => {
    try {
      const response = await api.delete(`${API_BASE}/medical-history/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete medical history' };
    }
  },

  // Chronic conditions operations
  addChronicCondition: async (data) => {
    try {
      const response = await api.post(`${API_BASE}/chronic-conditions`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add chronic condition' };
    }
  },

  // Allergies operations
  addAllergy: async (data) => {
    try {
      const response = await api.post(`${API_BASE}/allergies`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add allergy' };
    }
  },

  // Surgeries operations
  addSurgery: async (data) => {
    try {
      const response = await api.post(`${API_BASE}/surgeries`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add surgery' };
    }
  },

  // Vaccinations operations
  addVaccination: async (data) => {
    try {
      const response = await api.post(`${API_BASE}/vaccinations`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to add vaccination' };
    }
  },

  // Prescriptions operations
  getPrescriptions: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.doctorId) params.append('doctorId', filters.doctorId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await api.get(`${API_BASE}/prescriptions?${params.toString()}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to get prescriptions' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status === 404) {
        // Return empty array if endpoint doesn't exist yet
        return { success: true, data: [] };
      }
      throw errorData;
    }
  },

  getPrescriptionById: async (id) => {
    try {
      const response = await api.get(`${API_BASE}/prescriptions/${id}`);
      return response.data;
    } catch (error) {
      const errorData = error.response?.data || { message: 'Failed to get prescription' };
      if (error.response?.status === 429) {
        errorData.message = 'Too many requests. Please wait a moment and try again.';
      }
      throw errorData;
    }
  },

  // Medicine Orders operations
  createMedicineOrder: async (orderData) => {
    try {
      const response = await api.post(`${API_BASE}/medicine-orders`, orderData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to create medicine order' };
    }
  },

  getMedicineOrders: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await api.get(`${API_BASE}/medicine-orders?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get medicine orders' };
    }
  },

  getMedicineOrderById: async (orderId) => {
    try {
      const response = await api.get(`${API_BASE}/medicine-orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get medicine order' };
    }
  },

  cancelMedicineOrder: async (orderId, reason) => {
    try {
      const response = await api.patch(`${API_BASE}/medicine-orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to cancel medicine order' };
    }
  }
};

export default patientService;