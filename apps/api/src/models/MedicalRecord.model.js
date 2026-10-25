const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true,
    index: true
  },
  documentType: {
    type: String,
    enum: [
      'lab_report',
      'prescription',
      'xray',
      'mri',
      'ct_scan',
      'ultrasound',
      'ecg',
      'consultation_note',
      'discharge_summary',
      'vaccination_record',
      'other'
    ],
    required: true,
    index: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  documentDate: {
    type: Date,
    required: true,
    index: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  notes: String,
  tags: [{
    type: String,
    trim: true
  }],
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  metadata: {
    relatedAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    relatedPrescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prescription'
    },
    doctorName: String,
    hospitalName: String,
    testResults: mongoose.Schema.Types.Mixed
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    documentUrl: String,
    versionNumber: Number,
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  accessLog: [{
    accessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accessedAt: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['view', 'download', 'share', 'edit']
    }
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
medicalRecordSchema.index({ patient: 1, documentType: 1 });
medicalRecordSchema.index({ patient: 1, documentDate: -1 });
medicalRecordSchema.index({ patient: 1, createdAt: -1 });
medicalRecordSchema.index({ tags: 1 });
medicalRecordSchema.index({ status: 1 });

// Virtual for formatted file size
medicalRecordSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Method to log access
medicalRecordSchema.methods.logAccess = async function(userId, action) {
  this.accessLog.push({
    accessedBy: userId,
    accessedAt: new Date(),
    action
  });
  
  // Keep only last 50 access logs
  if (this.accessLog.length > 50) {
    this.accessLog = this.accessLog.slice(-50);
  }
  
  await this.save();
};

// Method to share document
medicalRecordSchema.methods.shareWith = async function(userId) {
  if (!this.sharedWith.includes(userId)) {
    this.sharedWith.push(userId);
    this.isShared = true;
    await this.save();
  }
};

// Method to unshare document
medicalRecordSchema.methods.unshareWith = async function(userId) {
  this.sharedWith = this.sharedWith.filter(id => id.toString() !== userId.toString());
  if (this.sharedWith.length === 0) {
    this.isShared = false;
  }
  await this.save();
};

// Static method to get patient's documents by type
medicalRecordSchema.statics.getByType = function(patientId, documentType) {
  return this.find({ 
    patient: patientId, 
    documentType,
    status: 'active'
  })
  .sort({ documentDate: -1 })
  .populate('uploadedBy', 'fullName role')
  .populate('sharedWith', 'fullName role');
};

// Static method to get recent documents
medicalRecordSchema.statics.getRecent = function(patientId, limit = 10) {
  return this.find({ 
    patient: patientId,
    status: 'active'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('uploadedBy', 'fullName role')
  .populate('metadata.relatedAppointment')
  .populate('metadata.relatedPrescription');
};

// Update patient stats after save
medicalRecordSchema.post('save', async function(doc) {
  try {
    const Patient = mongoose.model('Patient');
    const patient = await Patient.findById(doc.patient);
    if (patient) {
      await patient.updateStats();
    }
  } catch (error) {
    console.error('Error updating patient stats:', error);
  }
});

// Update patient stats after delete
medicalRecordSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    try {
      const Patient = mongoose.model('Patient');
      const patient = await Patient.findById(doc.patient);
      if (patient) {
        await patient.updateStats();
      }
    } catch (error) {
      console.error('Error updating patient stats:', error);
    }
  }
});

medicalRecordSchema.set('toJSON', { virtuals: true });
medicalRecordSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.MedicalRecord || mongoose.model('MedicalRecord', medicalRecordSchema);
