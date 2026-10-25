const mongoose = require('mongoose');

const labResultSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabOrder',
    required: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest',
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  testCode: {
    type: String,
    required: true
  },
  sampleCollectedAt: {
    type: Date
  },
  processedAt: {
    type: Date
  },
  reportedAt: {
    type: Date
  },
  parameters: [{
    name: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    unit: {
      type: String
    },
    normalRange: {
      min: String,
      max: String,
      description: String
    },
    status: {
      type: String,
      enum: ['normal', 'low', 'high', 'critical'],
      default: 'normal'
    },
    flag: {
      type: String,
      enum: ['', 'L', 'H', 'LL', 'HH'],
      default: ''
    }
  }],
  overallResult: {
    type: String,
    enum: ['normal', 'abnormal', 'critical'],
    default: 'normal'
  },
  interpretation: {
    type: String
  },
  remarks: {
    type: String
  },
  performedBy: {
    name: String,
    designation: String,
    signature: String
  },
  verifiedBy: {
    name: String,
    designation: String,
    signature: String,
    verifiedAt: Date
  },
  reportDocument: {
    filename: String,
    url: String,
    mimeType: String,
    size: Number
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isCritical: {
    type: Boolean,
    default: false
  },
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
labResultSchema.index({ patient: 1, createdAt: -1 });
labResultSchema.index({ order: 1 });
labResultSchema.index({ test: 1 });
labResultSchema.index({ overallResult: 1 });

module.exports = mongoose.models.LabResult || mongoose.model('LabResult', labResultSchema);
