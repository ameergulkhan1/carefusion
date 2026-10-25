const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: false,
    trim: true,
    set: (value) => {
      if (value === null || value === undefined) return undefined;
      const normalized = String(value).trim();
      return normalized.length ? normalized : undefined;
    },
    sparse: true,
    unique: true
  },
  qualifications: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    default: 0
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  languages: [String],
  consultationFee: {
    type: Number,
    required: true
  },
  availability: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    slots: [{
      startTime: String,
      endTime: String,
      isAvailable: { type: Boolean, default: true }
    }]
  }],
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  clinicAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String
  }
}, {
  timestamps: true
});

doctorSchema.pre('validate', function(next) {
  if (!this.user && this.userId) {
    this.user = this.userId;
  }

  if (!this.userId && this.user) {
    this.userId = this.user;
  }

  next();
});

module.exports = mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
