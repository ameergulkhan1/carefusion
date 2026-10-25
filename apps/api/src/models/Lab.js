const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Backward-compatible field for legacy deployments that still keep a `userId` index.
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  labName: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: false,
    sparse: true,
    unique: true
  },
  accreditation: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  operatingHours: {
    weekdays: {
      open: String,
      close: String
    },
    saturday: {
      open: String,
      close: String
    },
    sunday: {
      open: String,
      close: String
    }
  },
  testCatalog: [{
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest'
    },
    price: Number,
    turnaroundTime: String
  }],
  homeSampleCollection: {
    available: { type: Boolean, default: false },
    additionalCharge: Number
  },
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

labSchema.pre('validate', function(next) {
  if (!this.userId && this.user) {
    this.userId = this.user;
  }

  // Normalize optional unique field so null/empty values do not collide.
  if (this.licenseNumber === null || this.licenseNumber === '') {
    this.licenseNumber = undefined;
  }

  next();
});

// Create geospatial index for location-based queries
labSchema.index({ location: '2dsphere' });
labSchema.index({ isVerified: 1 });
labSchema.index({ 'address.city': 1, 'address.state': 1 });

module.exports = mongoose.models.Lab || mongoose.model('Lab', labSchema);
