const mongoose = require('mongoose');

const medicalHistorySchema = new mongoose.Schema({
  eventType: {
    type: String,
    enum: ['diagnosis', 'surgery', 'allergy', 'vaccination', 'medication'],
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  diagnosedDate: {
    type: Date,
    required: true
  },
  doctor: String,
  hospital: String,
  notes: String,
  status: {
    type: String,
    enum: ['active', 'resolved', 'chronic'],
    default: 'active'
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const chronicConditionSchema = new mongoose.Schema({
  condition: {
    type: String,
    required: true
  },
  diagnosedDate: Date,
  currentMedication: String,
  notes: String
});

const allergySchema = new mongoose.Schema({
  allergen: {
    type: String,
    required: true
  },
  allergyType: {
    type: String,
    enum: ['medication', 'food', 'environmental'],
    required: true
  },
  severity: {
    type: String,
    enum: ['mild', 'moderate', 'severe'],
    default: 'mild'
  },
  reaction: String,
  diagnosedDate: Date
});

const surgerySchema = new mongoose.Schema({
  procedureName: {
    type: String,
    required: true
  },
  surgeryDate: {
    type: Date,
    required: true
  },
  hospital: String,
  surgeon: String,
  notes: String
});

const vaccinationSchema = new mongoose.Schema({
  vaccineName: {
    type: String,
    required: true
  },
  dateAdministered: {
    type: Date,
    required: true
  },
  nextDueDate: Date,
  administeredBy: String
});

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  patientId: {
    type: String,
    unique: true,
    sparse: true
  },
  dateOfBirth: {
    type: Date
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Pakistan'
    }
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    coverageDetails: String,
    expiryDate: Date
  },
  medicalHistory: [medicalHistorySchema],
  chronicConditions: [chronicConditionSchema],
  allergies: [allergySchema],
  surgeries: [surgerySchema],
  vaccinations: [vaccinationSchema],
  stats: {
    totalAppointments: {
      type: Number,
      default: 0
    },
    totalMedicalRecords: {
      type: Number,
      default: 0
    },
    totalPrescriptions: {
      type: Number,
      default: 0
    },
    totalLabReports: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Calculate age from date of birth
patientSchema.pre('save', function(next) {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    this.age = age;
  }
  next();
});

// Generate patient ID before saving
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await this.constructor.countDocuments();
    this.patientId = `PAT${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for full profile
patientSchema.virtual('fullProfile').get(function() {
  return {
    patientId: this.patientId,
    dateOfBirth: this.dateOfBirth,
    age: this.age,
    gender: this.gender,
    bloodGroup: this.bloodGroup,
    address: this.address,
    emergencyContact: this.emergencyContact,
    insurance: this.insurance,
    stats: this.stats
  };
});

// Method to update stats
patientSchema.methods.updateStats = async function() {
  try {
    // Count medical records (uses 'patient' field)
    const MedicalRecord = mongoose.model('MedicalRecord');
    const records = await MedicalRecord.countDocuments({ patient: this._id });
    const labReports = await MedicalRecord.countDocuments({ 
      patient: this._id, 
      documentType: 'lab_report' 
    });
    
    // Count appointments (uses 'patientId' field) - only if model exists
    let appointments = 0;
    try {
      const Appointment = mongoose.model('Appointment');
      appointments = await Appointment.countDocuments({ patientId: this._id });
    } catch (err) {
      // Appointment model not registered yet
      console.debug('Appointment model not available for stats');
    }
    
    // Count prescriptions (uses 'patientId' field) - only if model exists
    let prescriptions = 0;
    try {
      const Prescription = mongoose.model('Prescription');
      prescriptions = await Prescription.countDocuments({ patientId: this._id });
    } catch (err) {
      // Prescription model not registered yet
      console.debug('Prescription model not available for stats');
    }
    
    this.stats = {
      totalMedicalRecords: records,
      totalAppointments: appointments,
      totalPrescriptions: prescriptions,
      totalLabReports: labReports
    };
    
    await this.save();
  } catch (error) {
    console.error('Error updating patient stats:', error);
  }
};

patientSchema.set('toJSON', { virtuals: true });
patientSchema.set('toObject', { virtuals: true });

module.exports = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
