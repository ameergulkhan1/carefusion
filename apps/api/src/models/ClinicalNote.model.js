/**
 * Clinical Note Model
 * MongoDB schema for clinical notes
 */

const mongoose = require('mongoose');

const vitalSignsSchema = new mongoose.Schema({
  bloodPressure: String,
  heartRate: Number,
  temperature: Number,
  respiratoryRate: Number,
  oxygenSaturation: Number,
  weight: Number,
  height: Number,
  bmi: Number
}, { _id: false });

const diagnosisSchema = new mongoose.Schema({
  code: { type: String, required: true },
  description: { type: String, required: true }
}, { _id: false });

const medicationSchema = new mongoose.Schema({
  medicationName: String,
  dosage: String,
  frequency: String,
  duration: String,
  route: String,
  instructions: String
}, { _id: false });

const referralSchema = new mongoose.Schema({
  specialist: String,
  reason: String
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'pdf', 'audio'] },
  url: String,
  description: String
}, { _id: false });

const clinicalNoteSchema = new mongoose.Schema({
  // References
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
    index: true
  },
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },

  // Visit Information
  visitDate: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  visitType: {
    type: String,
    enum: ['in_person', 'telemedicine', 'follow_up', 'emergency'],
    default: 'in_person'
  },

  // SOAP Structure
  subjective: {
    chiefComplaint: {
      type: String,
      required: true
    },
    historyPresentIllness: String,
    pastMedicalHistory: [String],
    currentMedications: [String],
    allergies: [String],
    familyHistory: String,
    socialHistory: String,
    reviewOfSystems: {
      constitutional: [String],
      cardiovascular: [String],
      respiratory: [String],
      gastrointestinal: [String],
      genitourinary: [String],
      musculoskeletal: [String],
      neurological: [String],
      psychiatric: [String],
      endocrine: [String],
      skin: [String]
    }
  },

  objective: {
    vitalSigns: vitalSignsSchema,
    generalAppearance: String,
    physicalExamination: {
      cardiovascular: String,
      respiratory: String,
      abdominal: String,
      neurological: String,
      extremities: String,
      skin: String,
      other: String
    }
  },

  assessment: {
    primaryDiagnosis: diagnosisSchema,
    secondaryDiagnoses: [diagnosisSchema],
    differentialDiagnoses: [String],
    clinicalImpression: String
  },

  plan: {
    medications: [medicationSchema],
    labTests: [String],
    imagingStudies: [String],
    procedures: [String],
    referrals: [referralSchema],
    followUp: String,
    patientEducation: String,
    restrictions: String,
    treatment: String
  },

  // Metadata
  status: {
    type: String,
    enum: ['draft', 'completed', 'reviewed', 'amended', 'deleted'],
    default: 'draft',
    index: true
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClinicalNote'
  },

  // AI-related fields
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1
  },
  aiModelUsed: String,
  rawTranscript: String,

  // Attachments
  attachments: [attachmentSchema],

  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  finalizedAt: Date,
  finalizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Access control
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  patientViewed: {
    type: Boolean,
    default: false
  },
  patientViewedAt: Date

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
clinicalNoteSchema.index({ patient: 1, visitDate: -1 });
clinicalNoteSchema.index({ doctor: 1, status: 1 });
clinicalNoteSchema.index({ 'assessment.primaryDiagnosis.code': 1 });

// Virtual for patient name (populated)
clinicalNoteSchema.virtual('patientName').get(function() {
  return this.patient?.name;
});

// Pre-save middleware
clinicalNoteSchema.pre('save', function(next) {
  // Auto-calculate BMI if height and weight are provided
  if (this.objective?.vitalSigns?.height && this.objective?.vitalSigns?.weight) {
    const heightInMeters = this.objective.vitalSigns.height / 100;
    this.objective.vitalSigns.bmi = parseFloat(
      (this.objective.vitalSigns.weight / (heightInMeters * heightInMeters)).toFixed(1)
    );
  }

  next();
});

// Static methods
clinicalNoteSchema.statics.findByPatient = function(patientId, options = {}) {
  return this.find({ patient: patientId, status: { $ne: 'deleted' } })
    .sort({ visitDate: -1 })
    .limit(options.limit || 10);
};

clinicalNoteSchema.statics.findByDoctor = function(doctorId, filters = {}) {
  return this.find({ doctor: doctorId, ...filters, status: { $ne: 'deleted' } })
    .populate('patient', 'name age gender')
    .sort({ visitDate: -1 });
};

// Instance methods
clinicalNoteSchema.methods.canEdit = function(userId) {
  return this.isEditable && this.doctor.toString() === userId.toString();
};

clinicalNoteSchema.methods.finalize = async function(userId) {
  this.status = 'completed';
  this.finalizedAt = new Date();
  this.finalizedBy = userId;
  this.isEditable = false;
  return await this.save();
};

const ClinicalNote = mongoose.model('ClinicalNote', clinicalNoteSchema);

module.exports = ClinicalNote;
