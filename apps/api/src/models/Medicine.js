const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Ointment', 'Inhaler', 'Other']
  },
  dosageForm: {
    type: String,
    required: true
  },
  strength: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  sideEffects: {
    type: String
  },
  precautions: {
    type: String
  },
  prescriptionRequired: {
    type: Boolean,
    default: true
  },
  activeIngredients: [{
    name: String,
    quantity: String
  }],
  storageInstructions: {
    type: String
  },
  expiryWarningDays: {
    type: Number,
    default: 90
  },
  image: {
    type: String
  }
}, {
  timestamps: true
});

// Index for search
medicineSchema.index({ name: 'text', genericName: 'text', manufacturer: 'text' });

module.exports = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
