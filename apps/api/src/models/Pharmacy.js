const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  pharmacyName: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: false,
    sparse: true,
    index: true,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
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
  deliveryAvailable: {
    type: Boolean,
    default: true
  },
  deliveryRadius: {
    type: Number,
    default: 10 // km
  },
  deliveryCharge: {
    type: Number,
    default: 0
  },
  minOrderValue: {
    type: Number,
    default: 0
  },
  inventory: [{
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine'
    },
    stock: Number,
    price: Number
  }],
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

module.exports = mongoose.models.Pharmacy || mongoose.model('Pharmacy', pharmacySchema);
