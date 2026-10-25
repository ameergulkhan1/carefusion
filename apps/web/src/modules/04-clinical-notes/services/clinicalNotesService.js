import axios from 'axios';
import api from '../../../utils/api';

const ML_SERVICE_BASE_URL = process.env.REACT_APP_ML_SERVICE_URL || 'http://localhost:5001';

const mlApi = axios.create({
  baseURL: `${ML_SERVICE_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json'
  }
});

const unwrapData = (response) => {
  if (!response) return null;
  if (response.data && typeof response.data === 'object') {
    return response.data.data ?? response.data;
  }
  return response.data;
};

const clinicalNotesService = {
  // Get all notes for a doctor
  getNotesByDoctor: async (doctorId) => {
    const query = doctorId ? `?doctor=${doctorId}` : '';
    const response = await api.get(`/clinical-notes${query}`);
    return response.data;
  },

  // Get a specific note by ID
  getNoteById: async (noteId) => {
    const response = await api.get(`/clinical-notes/${noteId}`);
    return response.data;
  },

  // Create a new clinical note
  createNote: async (noteData) => {
    const response = await api.post('/clinical-notes', noteData);
    return response.data;
  },

  // Update an existing note
  updateNote: async (noteId, noteData) => {
    const response = await api.put(`/clinical-notes/${noteId}`, noteData);
    return response.data;
  },

  // Delete a note (soft delete)
  deleteNote: async (noteId) => {
    const response = await api.delete(`/clinical-notes/${noteId}`);
    return response.data;
  },

  // Generate AI-powered clinical note
  generateAINote: async (payload) => {
    try {
      const response = await api.post('/clinical-notes/generate-ai-note', payload);
      return response.data;
    } catch (mainApiError) {
      const transcript = payload?.rawTranscript || payload?.transcript || '';
      const context = {
        patientId: payload?.patient,
        pastMedicalHistory: payload?.patientHistory?.pastConditions || [],
        currentMedications: payload?.patientHistory?.currentMedications || [],
        allergies: payload?.patientHistory?.allergies || []
      };

      const fallbackResponse = await mlApi.post('/generate-clinical-note', {
        transcript,
        context
      });

      return fallbackResponse.data;
    }
  },

  // Finalize a note (makes it read-only)
  finalizeNote: async (noteId) => {
    const response = await api.post(`/clinical-notes/${noteId}/finalize`);
    return response.data;
  },

  // Get notes for a specific patient
  getPatientNotes: async (patientId) => {
    const response = await api.get(`/clinical-notes/patient/${patientId}`);
    return response.data;
  },

  // Get patient history (last 5 visits)
  getPatientHistory: async (patientId) => {
    const response = await api.get(`/clinical-notes/patient/${patientId}?limit=5`);
    return response.data;
  },

  suggestICD10: async (diagnosisText) => {
    try {
      const response = await api.post('/clinical-notes/suggest-icd10', {
        diagnosis: diagnosisText
      });

      const suggestions = unwrapData(response)?.suggestions || response?.data?.suggestions || [];
      return {
        success: true,
        data: suggestions
      };
    } catch (mainApiError) {
      const fallbackResponse = await mlApi.post('/suggest-icd10', {
        diagnosis: diagnosisText
      });

      return {
        success: true,
        data: fallbackResponse?.data?.suggestions || []
      };
    }
  },

  // Download note as PDF
  downloadPDF: async (noteId) => {
    const response = await api.get(`/clinical-notes/${noteId}/pdf`, {
      responseType: 'blob'
    });
    
    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `clinical-note-${noteId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return response.data;
  },

  // Voice to text transcription
  voiceToText: async (audioFile) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    
    const response = await api.post('/clinical-notes/voice-to-text', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get statistics for doctor dashboard
  getStatistics: async (doctorId) => {
    if (!doctorId) {
      return { success: true, data: {} };
    }
    const response = await api.get(`/clinical-notes/statistics/${doctorId}`);
    return response.data;
  },

  // Get patient data for auto-population
  getPatientData: async (patientId) => {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  },

  // Get recent appointments
  getRecentAppointments: async () => {
    const response = await api.get('/appointments/recent');
    return response.data;
  },

  // Get all patients
  getAllPatients: async () => {
    const response = await api.get('/patients');
    return response.data;
  }
};

export default clinicalNotesService;