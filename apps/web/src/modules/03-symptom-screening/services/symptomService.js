import axios from 'axios';
import api from '../../../services/api';
import { jsPDF } from 'jspdf';

const LOCAL_SYMPTOM_RESULTS_KEY = 'clinixsol_symptom_results';



const readLocalResults = () => {
  try {
    const rawResults = localStorage.getItem(LOCAL_SYMPTOM_RESULTS_KEY);
    if (!rawResults) return [];
    const parsedResults = JSON.parse(rawResults);
    return Array.isArray(parsedResults) ? parsedResults : [];
  } catch (error) {
    console.error('Failed to read local symptom results:', error);
    return [];
  }
};

const writeLocalResults = (results) => {
  localStorage.setItem(LOCAL_SYMPTOM_RESULTS_KEY, JSON.stringify(results));
};

const ensureLocalCheckId = (checkData = {}) => {
  return checkData.checkId || checkData._id || checkData.localCheckId || `local-${Date.now()}`;
};

const toDisplayText = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  return String(value);
};

const addWrappedText = (doc, text, x, y, maxWidth, lineHeight = 6) => {
  const lines = doc.splitTextToSize(String(text), maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
};

const normalizeSymptom = (symptom, index = 0) => {
  if (!symptom) return null;
  if (typeof symptom === 'string') {
    return { id: symptom, label: symptom.replace(/_/g, ' '), description: '', severity: 3 };
  }
  const id = symptom.id || symptom.symptom_id || symptom.symptom || symptom.name || `symptom_${index}`;
  const label = symptom.label || symptom.name || symptom.symptom || String(id).replace(/_/g, ' ');
  return { ...symptom, id, label, description: symptom.description || symptom.desc || '', severity: Number(symptom.severity) || 3 };
};

const normalizeCategoryResponse = (payload) => {
  const source = payload?.data ?? payload;
  const categories = [];
  const flatSymptoms = [];

  const addCategory = (categoryName, symptomList = []) => {
    const normalizedSymptoms = (Array.isArray(symptomList) ? symptomList : [])
      .map((symptom, index) => normalizeSymptom(symptom, index))
      .filter((symptom) => symptom && symptom.id && symptom.label);

    if (normalizedSymptoms.length > 0) {
      categories.push({ name: categoryName, symptoms: normalizedSymptoms });
      flatSymptoms.push(...normalizedSymptoms);
    }
  };

  if (Array.isArray(source?.categories)) {
    source.categories.forEach((category, index) => {
      const categoryName = category?.name || category?.title || category?.category || `Category ${index + 1}`;
      addCategory(categoryName, category?.symptoms);
    });
  } else if (Array.isArray(source?.symptoms)) {
    addCategory('General Symptoms', source.symptoms);
  } else if (Array.isArray(source)) {
    if (source.length > 0 && typeof source[0] === 'object' && Array.isArray(source[0]?.symptoms)) {
      source.forEach((category, index) => {
        const categoryName = category?.name || category?.title || category?.category || `Category ${index + 1}`;
        addCategory(categoryName, category?.symptoms);
      });
    } else {
      addCategory('General Symptoms', source);
    }
  }

  return { success: true, data: { categories, symptoms: flatSymptoms, count: flatSymptoms.length }, count: flatSymptoms.length };
};

const buildPredictionFallback = (responseData, symptomData) => {
  const payload = responseData?.data ?? responseData ?? {};
  const predictions = Array.isArray(payload.predictions) ? payload.predictions : [];
  const generatedCheckId = `ml-${Date.now()}`;
  const inputSymptoms = Array.isArray(payload.input_symptoms) ? payload.input_symptoms : (Array.isArray(symptomData?.symptoms) ? symptomData.symptoms : []);
  const normalizedSymptoms = inputSymptoms.map((symptom, index) => normalizeSymptom(symptom, index)).filter(Boolean);
  const topPrediction = predictions[0] || null;
  const precautions = Array.isArray(topPrediction?.precautions) ? topPrediction.precautions.map((precaution) => ({ type: 'normal', message: precaution })) : [];

  return {
    success: true,
    data: {
      checkId: generatedCheckId,
      localCheckId: generatedCheckId,
      symptoms: normalizedSymptoms,
      predictions,
      urgencyLevel: payload.urgencyLevel || 'low',
      urgencyMessage: payload.urgencyMessage || 'Please consult a healthcare professional.',
      recommendations: precautions,
      recommendedSpecialist: topPrediction?.disease ? 'General Physician' : '',
      recommendedTests: [],
      patientInfo: symptomData?.patientInfo || { age: symptomData?.age, gender: symptomData?.gender, duration: symptomData?.duration, temperature: symptomData?.temperature, additionalNotes: symptomData?.additionalNotes },
      createdAt: payload.timestamp || new Date().toISOString(),
      source: 'ml-service'
    }
  };
};

export const symptomService = {
  getAvailableSymptoms: async () => {
    try {
      console.log('📡 Frontend: Fetching available symptoms from Node.js Backend...');
      // Only call the Node.js API
      const response = await api.get('/symptoms/available');
      const normalized = normalizeCategoryResponse(response.data);
      
      if (normalized.data.count === 0) {
        throw new Error('Backend returned 0 symptoms');
      }
      return normalized;
      
    } catch (error) {
      console.error('🚨 Frontend Error fetching symptoms from backend:', error.response?.status, error.message);
      console.error('🚨 Backend Response:', error.response?.data);
      
      throw new Error('Unable to load symptom data from any source');
    }
  },

  checkSymptoms: async (symptomData) => {
    try {
      const response = await api.post('/symptoms/check', symptomData);
      return response.data;
    } catch (backendError) {
      console.error('🚨 Error checking symptoms via backend:', backendError.message);
      throw backendError;
    }
  },

  cacheSymptomResult: (checkData) => {
    const checkId = ensureLocalCheckId(checkData);
    const existingResults = readLocalResults();
    const normalizedRecord = { ...checkData, checkId, localOnly: !checkData?.checkId && !checkData?._id, createdAt: checkData?.createdAt || new Date().toISOString() };
    const filteredResults = existingResults.filter((result) => (result.checkId || result._id || result.localCheckId) !== checkId);
    writeLocalResults([normalizedRecord, ...filteredResults].slice(0, 100));
    return normalizedRecord;
  },

  getLatestCachedResult: () => readLocalResults()[0] || null,
  
  getCachedResultById: (checkId) => {
    if (!checkId) return null;
    const results = readLocalResults();
    return results.find((result) => result?.checkId === checkId || result?._id === checkId || result?.localCheckId === checkId) || null;
  },

  getCachedResults: () => readLocalResults(),

  markCachedResultAsSaved: (checkData) => {
    return symptomService.cacheSymptomResult({ ...checkData, savedToRecords: true });
  },

  getSymptomHistory: async () => {
    const response = await api.get('/symptoms/history');
    return response.data;
  },

  getSymptomCheckById: async (checkId) => {
    const response = await api.get(`/symptoms/history/${checkId}`);
    return response.data;
  },

  saveCheckToRecords: async (checkId) => {
    const response = await api.post('/symptoms/save-check', { checkId });
    return response.data;
  },

  updateCheckStatus: async (checkId, status) => {
    const response = await api.patch(`/symptoms/check/${checkId}`, { status });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/symptoms/statistics');
    return response.data;
  },

  generatePDFReport: async (checkId) => {
    const response = await api.get(`/symptoms/pdf/${checkId}`, { responseType: 'blob' });
    return response.data;
  },

  downloadPDFReportFromData: (checkData, filename = 'symptom-check-report.pdf') => {
    const doc = new jsPDF();
    const generatedAt = checkData?.createdAt ? new Date(checkData.createdAt).toLocaleString() : new Date().toLocaleString();
    const symptoms = Array.isArray(checkData?.symptoms) ? checkData.symptoms.map((symptom) => symptom?.label || symptom?.name || symptom?.id || symptom) : [];
    const predictions = Array.isArray(checkData?.predictions) ? checkData.predictions : [];
    const recommendations = Array.isArray(checkData?.recommendations) ? checkData.recommendations.map((item) => item?.message || item) : [];
    
    let y = 16;
    doc.setFontSize(16);
    doc.text('Symptom Check Report', 14, y);

    y += 8;
    doc.setFontSize(10);
    doc.text(`Generated: ${generatedAt}`, 14, y);

    y += 8;
    doc.setFontSize(12);
    doc.text('Urgency', 14, y);

    y += 6;
    doc.setFontSize(10);
    y = addWrappedText(doc, `Level: ${toDisplayText(checkData?.urgencyLevel)}`, 14, y, 180);
    y = addWrappedText(doc, `Message: ${toDisplayText(checkData?.urgencyMessage)}`, 14, y + 1, 180);

    y += 6;
    doc.setFontSize(12);
    doc.text('Symptoms', 14, y);

    y += 6;
    doc.setFontSize(10);
    if (symptoms.length === 0) {
      y = addWrappedText(doc, 'No symptoms listed', 14, y, 180);
    } else {
      symptoms.forEach((symptom, index) => {
        y = addWrappedText(doc, `${index + 1}. ${symptom}`, 14, y, 180);
      });
    }

    y += 6;
    if (y > 265) { doc.addPage(); y = 16; }

    doc.setFontSize(12);
    doc.text('Top Predictions', 14, y);

    y += 6;
    doc.setFontSize(10);
    if (predictions.length === 0) {
      y = addWrappedText(doc, 'No predictions available', 14, y, 180);
    } else {
      predictions.slice(0, 5).forEach((prediction, index) => {
        const probability = typeof prediction?.probability === 'number' ? `${Math.round(prediction.probability * 100)}%` : 'N/A';
        const confidence = toDisplayText(prediction?.confidence);
        y = addWrappedText(doc, `${index + 1}. ${toDisplayText(prediction?.disease)} (${probability}, ${confidence} confidence)`, 14, y, 180);
      });
    }

    if (recommendations.length > 0) {
      y += 6;
      if (y > 265) { doc.addPage(); y = 16; }

      doc.setFontSize(12);
      doc.text('Recommendations', 14, y);

      y += 6;
      doc.setFontSize(10);
      recommendations.forEach((recommendation, index) => {
        y = addWrappedText(doc, `${index + 1}. ${recommendation}`, 14, y, 180);
      });
    }

    doc.save(filename);
  }
};

export default symptomService;