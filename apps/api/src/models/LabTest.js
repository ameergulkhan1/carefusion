const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  testCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  testName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Hematology',
      'Biochemistry',
      'Microbiology',
      'Immunology',
      'Pathology',
      'Radiology',
      'Cardiology',
      'Hormones',
      'Vitamins',
      'Allergy',
      'Molecular',
      'Other'
    ]
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  preparationInstructions: {
    type: String,
    default: 'No special preparation required'
  },
  sampleType: {
    type: String,
    required: true,
    enum: ['Blood', 'Urine', 'Stool', 'Saliva', 'Tissue', 'Swab', 'Other']
  },
  turnaroundTime: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['hours', 'days'],
      default: 'hours'
    }
  },
  normalRange: {
    min: Number,
    max: Number,
    unit: String,
    description: String
  },
  requiresFasting: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  availableAt: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab'
  }]
}, {
  timestamps: true
});

// Indexes (testCode already indexed by unique constraint)
labTestSchema.index({ category: 1 });
labTestSchema.index({ testName: 'text', description: 'text' });

module.exports = mongoose.models.LabTest || mongoose.model('LabTest', labTestSchema);
