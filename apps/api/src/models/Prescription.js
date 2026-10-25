const mongoose = require('mongoose');
const crypto = require('crypto');

const medicationSchema = new mongoose.Schema({
  medicationName: {
    type: String,
    required: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: String,
  quantity: Number
});

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true
  },
  actorUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  actorRole: {
    type: String
  },
  details: {
    type: String
  },
  ipAddress: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  prescriptionId: {
    type: String,
    unique: true,
    index: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  prescriptionDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  medications: [medicationSchema],
  patientSnapshot: {
    fullName: String,
    email: String,
    phone: String
  },
  doctorSnapshot: {
    fullName: String,
    email: String,
    specialization: String
  },
  diagnosis: String,
  instructions: String,
  notes: String,
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'pending', 'processing', 'ready', 'dispensed'],
    default: 'active'
  },
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy'
  },
  sentToPharmacy: {
    isSent: {
      type: Boolean,
      default: false
    },
    sentAt: Date,
    sentByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  },
  refill: {
    maxRefills: {
      type: Number,
      default: 0,
      min: 0
    },
    usedRefills: {
      type: Number,
      default: 0,
      min: 0
    },
    lastRefillDate: Date
  },
  renewal: {
    renewalCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastRenewedAt: Date,
    lastRenewedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  auditLogs: [auditLogSchema],
  security: {
    checksum: String,
    lastIntegrityCheckAt: Date
  },
  dispensedDate: Date,
  validUntil: Date
}, {
  timestamps: true
});

// Generate prescription ID
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionId) {
    const count = await this.constructor.countDocuments();
    this.prescriptionId = `RX${String(count + 1).padStart(6, '0')}`;
  }

  const raw = JSON.stringify({
    patientId: this.patientId,
    doctorId: this.doctorId,
    medications: this.medications,
    diagnosis: this.diagnosis,
    prescriptionDate: this.prescriptionDate,
    validUntil: this.validUntil,
    status: this.status,
    refill: this.refill
  });

  this.security = this.security || {};
  this.security.checksum = crypto.createHash('sha256').update(raw).digest('hex');
  this.security.lastIntegrityCheckAt = new Date();

  next();
});

module.exports = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
