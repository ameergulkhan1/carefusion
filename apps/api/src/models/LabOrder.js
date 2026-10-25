const mongoose = require('mongoose');

const labOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false
  },
  tests: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest',
      required: true
    },
    testName: String,
    testCode: String,
    price: Number,
    status: {
      type: String,
      enum: ['pending', 'sample-collected', 'processing', 'completed', 'cancelled'],
      default: 'pending'
    },
    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabResult'
    }
  }],
  laboratory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab'
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  sampleCollectionType: {
    type: String,
    enum: ['walk-in', 'home-collection'],
    default: 'walk-in'
  },
  homeCollectionAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    contactNumber: String
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partially-paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'insurance']
  },
  orderStatus: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['scheduled', 'in-progress', 'completed', 'cancelled']
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  prescriptionReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription'
  },
  specialInstructions: {
    type: String
  },
  cancelReason: {
    type: String
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Generate order number before saving
labOrderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('LabOrder').countDocuments();
    this.orderNumber = `LAB${String(count + 1).padStart(6, '0')}`;
  }

  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [{
      status: this.orderStatus || 'scheduled',
      note: 'Order created',
      updatedAt: new Date()
    }];
  }

  next();
});

// Indexes (orderNumber already indexed by unique constraint)
labOrderSchema.index({ patient: 1, createdAt: -1 });
labOrderSchema.index({ orderStatus: 1 });

module.exports = mongoose.models.LabOrder || mongoose.model('LabOrder', labOrderSchema);
