const axios = require('axios');

// ML Service URL from environment variables
const ML_SERVICE_URL = process.env.ML_SERVICE_URL_V2 || 'http://127.0.0.1:5001';

const FALLBACK_CATEGORIZED_SYMPTOMS = {
  totalSymptoms: 18,
  categories: [
    {
      id: 'general',
      title: 'General Symptoms',
      icon: 'thermometer',
      color: '#3B82F6',
      symptoms: [
        { id: 'fever', label: 'Fever' },
        { id: 'fatigue', label: 'Fatigue' },
        { id: 'chills', label: 'Chills' },
        { id: 'weight_loss', label: 'Weight Loss' }
      ]
    },
    {
      id: 'respiratory',
      title: 'Respiratory',
      icon: 'lungs',
      color: '#10B981',
      symptoms: [
        { id: 'cough', label: 'Cough' },
        { id: 'breathlessness', label: 'Shortness of Breath' },
        { id: 'chest_pain', label: 'Chest Pain' },
        { id: 'runny_nose', label: 'Runny Nose' }
      ]
    },
    {
      id: 'digestive',
      title: 'Digestive',
      icon: 'stomach',
      color: '#F59E0B',
      symptoms: [
        { id: 'nausea', label: 'Nausea' },
        { id: 'vomiting', label: 'Vomiting' },
        { id: 'abdominal_pain', label: 'Abdominal Pain' },
        { id: 'diarrhea', label: 'Diarrhea' }
      ]
    },
    {
      id: 'neurological',
      title: 'Neurological',
      icon: 'brain',
      color: '#8B5CF6',
      symptoms: [
        { id: 'headache', label: 'Headache' },
        { id: 'dizziness', label: 'Dizziness' },
        { id: 'confusion', label: 'Confusion' },
        { id: 'numbness', label: 'Numbness' },
        { id: 'weakness', label: 'Weakness' },
        { id: 'blurred_vision', label: 'Blurred Vision' }
      ]
    }
  ]
};

const getFallbackCategorizedSymptoms = () => ({
  ...FALLBACK_CATEGORIZED_SYMPTOMS,
  fallback: true,
  source: 'backend-fallback'
});

console.log(`🔧 Symptom Service initialized with ML_SERVICE_URL: ${ML_SERVICE_URL}`);

const getAvailableSymptoms = async () => {
  try {
    console.log(`📡 Calling ML Service: ${ML_SERVICE_URL}/symptoms/categorized`);
    
    const response = await axios.get(`${ML_SERVICE_URL}/symptoms/categorized`, {
      timeout: 5000 // 5 second timeout so it fails fast
    });
    
    if (response.data && response.data.success && response.data.data) {
      console.log('✅ Successfully fetched categorized symptoms from ML service');
      return sanitizeCategorizedSymptoms(response.data.data);
    } else {
      throw new Error('Invalid response format from ML service');
    }
    
  } catch (error) {
    // 🚨 THE FIX: Catch ANY error and return the fallback immediately.
    console.warn(`⚠️ ML Service failed (${error.message}). Serving fallback symptoms list.`);
    return getFallbackCategorizedSymptoms();
  }
};

const sanitizeCategorizedSymptoms = (payload) => {
  if (!payload || !Array.isArray(payload.categories)) {
    return payload;
  }

  const categories = payload.categories.map((category) => {
    const symptoms = Array.isArray(category.symptoms) ? category.symptoms : [];

    const filteredSymptoms = symptoms.filter((symptom) => {
      const id = String(symptom?.id || '').trim();
      const label = String(symptom?.label || '').trim();

      if (!id || !label) return false;
      if (/^unnamed\s*:\s*\d+$/i.test(id) || /^unnamed\s*:\s*\d+$/i.test(label)) return false;

      return true;
    });

    return {
      ...category,
      symptoms: filteredSymptoms
    };
  });

  return {
    ...payload,
    categories
  };
};

const analyzeSymptoms = async (patientId, symptomData) => {
  try {
    console.log('📊 Starting symptom analysis...');
    console.log('👤 Patient ID:', patientId || 'anonymous');
    console.log('💉 Symptoms:', symptomData.symptoms);
    
    if (!symptomData.symptoms || !Array.isArray(symptomData.symptoms)) {
      throw new Error('Symptoms array is required');
    }
    
    if (symptomData.symptoms.length < 2) {
      throw new Error('At least 2 symptoms are required');
    }
    
    if (symptomData.symptoms.length > 20) {
      throw new Error('Maximum 20 symptoms allowed');
    }
    
    const mlPayload = {
      symptoms: symptomData.symptoms,
      age: symptomData.age || null,
      gender: symptomData.gender || null,
      duration: symptomData.duration || null,
      temperature: symptomData.temperature || null
    };
    
    console.log(`📡 Calling ML Service: ${ML_SERVICE_URL}/predict`);
    
    const mlResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      mlPayload,
      { timeout: 10000 } // Reduced timeout to prevent Vercel 504 Gateway Timeout
    );
    
    if (!mlResponse.data || !mlResponse.data.success || !mlResponse.data.data) {
      console.error('❌ Invalid ML response:', mlResponse.data);
      throw new Error('Invalid prediction response from ML service');
    }
    
    const mlData = mlResponse.data.data;
    console.log('✅ ML Prediction received:', mlData.predictions?.length, 'predictions');
    
    const predictions = (mlData.predictions || []).map(pred => ({
      disease: pred.disease,
      probability: pred.probability,
      confidence: pred.confidence,
      description: pred.description,
      precautions: pred.precautions,
      specialist: getSpecialistForDisease(pred.disease),
      urgencyLevel: getUrgencyLevel(pred.disease, pred.probability),
      suggestedTests: getLabTests(pred.disease)
    }));
    
    const checkId = `check_${Date.now()}`;
    const recommendations = generateRecommendations(predictions[0]);
    
    return {
      success: true,
      data: {
        checkId: checkId,
        predictions: predictions,
        recommendations: recommendations,
        urgencyLevel: predictions[0]?.urgencyLevel || 'medium'
      }
    };
    
  } catch (error) {
    console.error('❌ Error in analyzeSymptoms:', error.message);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      throw new Error('ML Service is currently unreachable. Please try again later.');
    }
    
    throw new Error(`Failed to analyze symptoms: ${error.message}`);
  }
};

const getPatientHistory = async (patientId) => {
  try {
    return [];
  } catch (error) {
    console.error('❌ Error fetching patient history:', error.message);
    throw new Error(`Failed to fetch history: ${error.message}`);
  }
};

function getSpecialistForDisease(disease) {
  const specialistMap = {
    'dengue': 'Infectious Disease Specialist',
    'malaria': 'Infectious Disease Specialist',
    'typhoid': 'Infectious Disease Specialist',
    'tuberculosis': 'Pulmonologist / Infectious Disease',
    'hepatitis': 'Gastroenterologist',
    'pneumonia': 'Pulmonologist',
    'urinary tract infection': 'Urologist',
    'gastroenteritis': 'Gastroenterologist',
    'peptic ulcer disease': 'Gastroenterologist',
    'jaundice': 'Gastroenterologist',
    'common cold': 'General Physician',
    'bronchitis': 'Pulmonologist',
    'asthma': 'Pulmonologist',
    'heart attack': 'Cardiologist',
    'hypertension': 'Cardiologist',
    'diabetes': 'Endocrinologist',
    'hyperthyroidism': 'Endocrinologist',
    'hypothyroidism': 'Endocrinologist',
    'fungal infection': 'Dermatologist',
    'psoriasis': 'Dermatologist',
    'impetigo': 'Dermatologist',
    'migraine': 'Neurologist',
    'paralysis (brain hemorrhage)': 'Neurologist',
    'arthritis': 'Rheumatologist',
    'osteoarthritis': 'Orthopedic Surgeon',
    'allergy': 'Allergist',
    'drug reaction': 'Allergist / General Physician',
    'cervical spondylosis': 'Orthopedic Surgeon',
    'varicose veins': 'Vascular Surgeon'
  };
  const diseaseLower = (disease || '').toLowerCase();
  return specialistMap[diseaseLower] || 'General Physician';
}

function getUrgencyLevel(disease, probability) {
  const criticalDiseases = ['heart attack', 'paralysis (brain hemorrhage)', 'hepatitis'];
  const highUrgencyDiseases = ['dengue', 'typhoid', 'pneumonia', 'tuberculosis', 'jaundice', 'malaria'];
  const diseaseLower = (disease || '').toLowerCase();
  
  if (criticalDiseases.some(d => diseaseLower.includes(d))) return 'critical';
  if (highUrgencyDiseases.some(d => diseaseLower.includes(d)) || probability > 0.8) return 'high';
  if (probability > 0.5) return 'medium';
  return 'low';
}

function getLabTests(disease) {
  const testMap = {
    'dengue': ['Complete Blood Count (CBC)', 'NS1 Antigen Test', 'Dengue IgG/IgM Antibody Test'],
    'malaria': ['Blood Smear (Thick & Thin Film)', 'Rapid Diagnostic Test (RDT)', 'Complete Blood Count'],
    'typhoid': ['Widal Test', 'Blood Culture', 'Complete Blood Count', 'Typhidot Test'],
    'hepatitis': ['Liver Function Test (LFT)', 'Hepatitis Panel (A/B/C)', 'Ultrasound Abdomen'],
    'diabetes': ['Fasting Blood Sugar', 'HbA1c Test', 'Random Blood Sugar', 'Glucose Tolerance Test'],
    'tuberculosis': ['Chest X-ray', 'Sputum AFB Test', 'Mantoux Test (TB Skin Test)', 'GeneXpert'],
    'pneumonia': ['Chest X-ray', 'Complete Blood Count', 'Sputum Culture'],
    'urinary tract infection': ['Urine Analysis', 'Urine Culture', 'Complete Blood Count'],
    'hypertension': ['Blood Pressure Monitoring', 'ECG', 'Lipid Profile', 'Kidney Function Test'],
    'heart attack': ['ECG', 'Cardiac Enzymes (Troponin)', 'Echocardiogram', 'Lipid Profile'],
    'asthma': ['Pulmonary Function Test', 'Chest X-ray', 'Allergy Testing'],
    'arthritis': ['X-ray Joints', 'RA Factor', 'ESR', 'CRP', 'Anti-CCP Antibody'],
    'jaundice': ['Liver Function Test', 'Bilirubin Test', 'Hepatitis Panel', 'Ultrasound Abdomen'],
    'common cold': ['Usually no tests needed', 'Symptomatic treatment recommended'],
    'gastroenteritis': ['Stool Analysis', 'Stool Culture', 'Electrolyte Panel']
  };
  const diseaseLower = (disease || '').toLowerCase();
  return testMap[diseaseLower] || ['Complete Blood Count (CBC)', 'Basic Metabolic Panel'];
}

function generateRecommendations(topPrediction) {
  if (!topPrediction) {
    return { immediate: ['Consult a healthcare provider'], shortTerm: ['Monitor symptoms'], longTerm: ['Maintain healthy lifestyle'] };
  }
  const urgency = topPrediction.urgencyLevel;
  const recommendations = { immediate: [], shortTerm: [], longTerm: [] };
  
  if (urgency === 'critical') {
    recommendations.immediate.push('🚨 Seek emergency medical attention IMMEDIATELY');
    recommendations.immediate.push('🚑 Call emergency services or go to nearest hospital');
    recommendations.immediate.push('⚠️ Do not delay - this could be life-threatening');
  } else if (urgency === 'high') {
    recommendations.immediate.push('⚠️ Consult a doctor within 24 hours');
    recommendations.immediate.push('📞 Book an urgent appointment with ' + topPrediction.specialist);
    recommendations.immediate.push('🏥 Consider visiting a hospital if symptoms worsen');
  } else if (urgency === 'medium') {
    recommendations.immediate.push('💡 Consult a doctor within 2-3 days');
    recommendations.immediate.push('📋 Monitor symptoms closely');
    recommendations.shortTerm.push('📅 Schedule appointment with ' + topPrediction.specialist);
  } else {
    recommendations.immediate.push('💡 Monitor symptoms and track any changes');
    recommendations.shortTerm.push('📅 Consider consulting a doctor if symptoms persist beyond 3-5 days');
  }
  
  recommendations.shortTerm.push('💧 Stay well hydrated - drink 8-10 glasses of water daily');
  recommendations.shortTerm.push('🛌 Get adequate rest and sleep (7-8 hours)');
  recommendations.shortTerm.push('🍎 Maintain a balanced, nutritious diet');
  recommendations.longTerm.push('📊 Complete recommended lab tests: ' + topPrediction.suggestedTests.join(', '));
  recommendations.longTerm.push('📝 Keep a symptom diary to track changes');
  recommendations.longTerm.push('🏋️ Maintain regular physical activity (as tolerated)');
  
  return recommendations;
}

module.exports = {
  getAvailableSymptoms,
  analyzeSymptoms,
  getPatientHistory
};