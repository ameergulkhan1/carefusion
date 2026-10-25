const mongoose = require('mongoose');

const SymptomDetailSchema = new mongoose.Schema({
  symptomId: {
    type: String,
    required: true
  },
  symptomName: {
    type: String,
    required: true
  },
  severity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  }
}, { _id: false });

const PredictionSchema = new mongoose.Schema({
  disease: {
    type: String,
    required: true
  },
  probability: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  matchingSymptoms: [{
    type: String
  }],
  description: {
    type: String
  },
  specialist: {
    type: String
  },
  urgencyLevel: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'low'
  },
  suggestedTests: [{
    type: String
  }],
  precautions: [{
    type: String
  }]
}, { _id: false });

const SymptomCheckSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: false,  // Allow anonymous symptom checking
    index: true
  },
  symptoms: [{
    type: String,
    required: true
  }],
  symptomDetails: [SymptomDetailSchema],
  symptomOnset: {
    type: Date
  },
  overallSeverity: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  recentTravel: {
    type: Boolean,
    default: false
  },
  travelDestination: {
    type: String
  },
  existingConditions: [{
    type: String
  }],
  currentMedications: {
    type: String
  },
  predictions: [PredictionSchema],
  topDisease: {
    type: String
  },
  topProbability: {
    type: Number
  },
  urgencyLevel: {
    type: String,
    enum: ['high', 'medium', 'low', 'critical'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['pending', 'consulted', 'resolved', 'follow-up-required'],
    default: 'pending'
  },
  followUpAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  followUpNotes: {
    type: String
  },
  doctorNotes: {
    type: String
  },
  actualDiagnosis: {
    type: String
  },
  savedToRecords: {
    type: Boolean,
    default: false
  },
  pdfReportUrl: {
    type: String
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  temperature: {
    type: Number
  },
  heartRate: {
    type: Number
  },
  // Pakistan-specific fields
  locationContext: {
    city: String,
    province: String,
    seasonalFactor: String  // summer, winter, monsoon, spring
  },
  environmentalFactors: {
    airQuality: String,
    waterSource: String,
    livingConditions: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
SymptomCheckSchema.index({ createdAt: -1 });
SymptomCheckSchema.index({ topDisease: 1 });
SymptomCheckSchema.index({ urgencyLevel: 1 });
SymptomCheckSchema.index({ status: 1 });
SymptomCheckSchema.index({ 'predictions.disease': 1 });

// Virtual for days since symptom onset
SymptomCheckSchema.virtual('daysSinceOnset').get(function() {
  if (!this.symptomOnset) return null;
  const diffTime = Math.abs(new Date() - this.symptomOnset);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to check if urgent attention is needed
SymptomCheckSchema.methods.needsUrgentAttention = function() {
  return this.urgencyLevel === 'high' || this.urgencyLevel === 'critical' || 
         this.topProbability > 70 || 
         (this.overallSeverity >= 8);
};

// Method to generate summary
SymptomCheckSchema.methods.generateSummary = function() {
  return {
    checkId: this._id,
    date: this.createdAt,
    symptomsCount: (this.symptoms && Array.isArray(this.symptoms)) ? this.symptoms.length : 0,
    topDisease: this.topDisease,
    probability: this.topProbability,
    urgency: this.urgencyLevel,
    status: this.status,
    needsAttention: this.needsUrgentAttention()
  };
};

// Static method to get patient's history
SymptomCheckSchema.statics.getPatientHistory = function(patientId, options = {}) {
  const query = { patient: patientId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.urgencyLevel) {
    query.urgencyLevel = options.urgencyLevel;
  }
  
  if (options.startDate && options.endDate) {
    query.createdAt = {
      $gte: new Date(options.startDate),
      $lte: new Date(options.endDate)
    };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 10)
    .populate('patient', 'firstName lastName email phone')
    .populate('followUpAppointment');
};

// Static method to get statistics
SymptomCheckSchema.statics.getStatistics = async function(patientId) {
  const checks = await this.find({ patient: patientId });
  
  if (checks.length === 0) {
    return {
      totalChecks: 0,
      pendingChecks: 0,
      consultedChecks: 0,
      mostCommonSymptoms: [],
      mostCommonDiseases: [],
      averageSeverity: 0
    };
  }
  
  // Count symptoms
  const symptomCounts = {};
  const diseaseCounts = {};
  let totalSeverity = 0;
  
  checks.forEach(check => {
    // Safety check for symptoms array
    if (check.symptoms && Array.isArray(check.symptoms)) {
      check.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
    }
    
    if (check.topDisease) {
      diseaseCounts[check.topDisease] = (diseaseCounts[check.topDisease] || 0) + 1;
    }
    
    totalSeverity += (check.overallSeverity || 0);
  });
  
  const mostCommonSymptoms = Object.entries(symptomCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([symptom, count]) => ({ symptom, count }));
  
  const mostCommonDiseases = Object.entries(diseaseCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([disease, count]) => ({ disease, count }));
  
  return {
    totalChecks: checks.length,
    pendingChecks: checks.filter(c => c.status === 'pending').length,
    consultedChecks: checks.filter(c => c.status === 'consulted').length,
    mostCommonSymptoms,
    mostCommonDiseases,
    averageSeverity: (totalSeverity / checks.length).toFixed(2)
  };
};

// Pre-save middleware
SymptomCheckSchema.pre('save', function(next) {
  // Set top disease and probability from predictions
  if (this.predictions && this.predictions.length > 0) {
    const topPrediction = this.predictions[0];
    this.topDisease = topPrediction.disease;
    this.topProbability = topPrediction.probability;
    this.urgencyLevel = topPrediction.urgencyLevel;
  }
  
  // Auto-save to records if status is consulted
  if (this.status === 'consulted' || this.status === 'resolved') {
    this.savedToRecords = true;
  }
  
  next();
});

module.exports = mongoose.model('SymptomCheck', SymptomCheckSchema);
