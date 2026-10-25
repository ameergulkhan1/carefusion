const Prescription = require('../models/Prescription');
const Patient = require('../models/Patient.model');
const Doctor = require('../models/Doctor');
const Pharmacy = require('../models/Pharmacy');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

class PrescriptionService {
  addAuditLog(prescription, action, actor = {}, details = '') {
    prescription.auditLogs = prescription.auditLogs || [];
    prescription.auditLogs.push({
      action,
      actorUserId: actor.userId,
      actorRole: actor.role,
      details,
      ipAddress: actor.ipAddress
    });
  }

  async getAvailablePharmacies() {
    const pharmacies = await Pharmacy.find({})
      .populate('user', 'fullName email phone')
      .select('pharmacyName address deliveryAvailable deliveryRadius deliveryCharge minOrderValue user isVerified')
      .sort({ isVerified: -1, pharmacyName: 1 });

    return pharmacies.map((item) => ({
      _id: item._id,
      pharmacyName: item.pharmacyName || item.user?.fullName || 'Unnamed Pharmacy',
      contactName: item.user?.fullName,
      email: item.user?.email,
      phone: item.user?.phone,
      isVerified: Boolean(item.isVerified),
      deliveryAvailable: item.deliveryAvailable,
      deliveryRadius: item.deliveryRadius,
      deliveryCharge: item.deliveryCharge,
      minOrderValue: item.minOrderValue,
      address: item.address
    }));
  }

  normalizeStatusFilter(status) {
    if (!status) return undefined;

    const raw = String(status).toLowerCase();
    const split = raw.split(',').map((s) => s.trim()).filter(Boolean);

    if (split.length === 0) return undefined;
    if (split.length === 1) return split[0];
    return { $in: split };
  }

  normalizeDateFilter(filters = {}) {
    const dateFilter = {};
    if (filters.startDate) dateFilter.$gte = new Date(filters.startDate);
    if (filters.endDate) dateFilter.$lte = new Date(filters.endDate);
    return Object.keys(dateFilter).length > 0 ? dateFilter : undefined;
  }

  async enrichDoctorForPatientResponse(prescriptions) {
    return Promise.all(
      prescriptions.map(async (presc) => {
        const data = presc.toObject ? presc.toObject() : presc;

        if (data.doctorId && data.doctorId.user) {
          const doctorUser = await User.findById(data.doctorId.user).select('fullName email phone');
          return {
            ...data,
            doctor: {
              id: data.doctorId._id,
              name: doctorUser?.fullName || 'Unknown Doctor',
              specialization: data.doctorId.specialization,
              email: doctorUser?.email,
              phone: doctorUser?.phone
            }
          };
        }

        return data;
      })
    );
  }

  /**
   * Get all prescriptions for a patient
   */
  async getPatientPrescriptions(userId, filters = {}) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const query = {
        patientId: patient._id
      };

      // Apply filters
      const statusFilter = this.normalizeStatusFilter(filters.status);
      if (statusFilter) query.status = statusFilter;

      const dateFilter = this.normalizeDateFilter(filters);
      if (dateFilter) query.prescriptionDate = dateFilter;

      const prescriptions = await Prescription.find(query)
        .populate('doctorId', 'specialization user')
        .populate('appointmentId')
        .sort({ prescriptionDate: -1 });

      return this.enrichDoctorForPatientResponse(prescriptions);
    } catch (error) {
      throw new Error(`Failed to get prescriptions: ${error.message}`);
    }
  }

  async getDoctorPrescriptions(doctorUserId, filters = {}) {
    try {
      const doctor = await Doctor.findOne({
        $or: [
          { user: doctorUserId },
          { userId: doctorUserId }
        ]
      });

      if (!doctor) {
        throw new Error('Doctor profile not found');
      }

      const query = { doctorId: doctor._id };

      const statusFilter = this.normalizeStatusFilter(filters.status);
      if (statusFilter) query.status = statusFilter;

      const dateFilter = this.normalizeDateFilter(filters);
      if (dateFilter) query.prescriptionDate = dateFilter;

      if (filters.patientId) query.patientId = filters.patientId;

      const prescriptions = await Prescription.find(query)
        .populate({ path: 'patientId', populate: { path: 'user', select: 'fullName email phone' } })
        .populate('appointmentId')
        .sort({ prescriptionDate: -1 });

      return prescriptions;
    } catch (error) {
      throw new Error(`Failed to get doctor prescriptions: ${error.message}`);
    }
  }

  async getPharmacyPrescriptions(userId, filters = {}) {
    try {
      const pharmacy = await Pharmacy.findOne({ user: userId });
      if (!pharmacy) {
        throw new Error('Pharmacy profile not found');
      }

      const query = {
        $or: [
          { pharmacyId: pharmacy._id },
          { pharmacyId: { $exists: false } },
          { pharmacyId: null }
        ]
      };

      const statusFilter = this.normalizeStatusFilter(filters.status);
      if (statusFilter) query.status = statusFilter;

      const dateFilter = this.normalizeDateFilter(filters);
      if (dateFilter) query.prescriptionDate = dateFilter;

      const prescriptions = await Prescription.find(query)
        .populate({ path: 'patientId', populate: { path: 'user', select: 'fullName email phone' } })
        .populate({ path: 'doctorId', populate: { path: 'user', select: 'fullName email phone' } })
        .sort({ prescriptionDate: -1 })
        .limit(200);

      return prescriptions;
    } catch (error) {
      throw new Error(`Failed to get pharmacy prescriptions: ${error.message}`);
    }
  }

  /**
   * Get a specific prescription
   */
  async getPrescriptionById(userId, prescriptionId, role = 'patient') {
    try {
      const baseQuery = { _id: prescriptionId };

      if (role === 'patient') {
        const patient = await Patient.findOne({ user: userId });
        if (!patient) {
          throw new Error('Patient record not found');
        }
        baseQuery.patientId = patient._id;
      }

      if (role === 'doctor') {
        const doctor = await Doctor.findOne({
          $or: [
            { user: userId },
            { userId: userId }
          ]
        });
        if (!doctor) {
          throw new Error('Doctor profile not found');
        }
        baseQuery.doctorId = doctor._id;
      }

      if (role === 'pharmacy') {
        const pharmacy = await Pharmacy.findOne({ user: userId });
        if (!pharmacy) {
          throw new Error('Pharmacy profile not found');
        }
        baseQuery.$or = [{ pharmacyId: pharmacy._id }, { pharmacyId: null }, { pharmacyId: { $exists: false } }];
      }

      const prescription = await Prescription.findOne(baseQuery)
        .populate({ path: 'doctorId', populate: { path: 'user', select: 'fullName email phone' } })
        .populate({ path: 'patientId', populate: { path: 'user', select: 'fullName email phone' } })
        .populate('appointmentId')
        .populate('pharmacyId', 'pharmacyName address phone');

      if (!prescription) {
        throw new Error('Prescription not found');
      }

      const data = prescription.toObject();
      if (data.doctorId && data.doctorId.user) {
        data.doctor = {
          id: data.doctorId._id,
          name: data.doctorId.user.fullName || 'Unknown Doctor',
          specialization: data.doctorId.specialization,
          email: data.doctorId.user.email,
          phone: data.doctorId.user.phone
        };
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to get prescription: ${error.message}`);
    }
  }

  /**
   * Create prescription (doctor only)
   */
  async createPrescription(doctorUserId, prescriptionData) {
    try {
      // Find doctor
      const doctor = await Doctor.findOne({
        $or: [
          { user: doctorUserId },
          { userId: doctorUserId }
        ]
      });
      if (!doctor) {
        const error = new Error('Doctor profile not found');
        error.statusCode = 404;
        throw error;
      }

      // Find patient
      const patient = await Patient.findById(prescriptionData.patientId);
      if (!patient) {
        const error = new Error('Patient not found');
        error.statusCode = 404;
        throw error;
      }

      // If appointmentId is provided, ensure it belongs to this doctor/patient pair.
      if (prescriptionData.appointmentId) {
        const appointment = await Appointment.findOne({
          _id: prescriptionData.appointmentId,
          doctorId: doctor._id,
          patientId: patient._id
        });

        if (!appointment) {
          const error = new Error('Invalid appointment for this doctor and patient');
          error.statusCode = 400;
          throw error;
        }
      }

      if (!Array.isArray(prescriptionData.medications) || prescriptionData.medications.length === 0) {
        const error = new Error('At least one medication is required');
        error.statusCode = 400;
        throw error;
      }

      const patientUser = await User.findById(patient.user).select('fullName email phone');
      const doctorUser = await User.findById(doctor.user).select('fullName email');

      // Create prescription
      const prescription = await Prescription.create({
        patientId: patient._id,
        doctorId: doctor._id,
        appointmentId: prescriptionData.appointmentId,
        medications: prescriptionData.medications,
        patientSnapshot: {
          fullName: patientUser?.fullName,
          email: patientUser?.email,
          phone: patientUser?.phone
        },
        doctorSnapshot: {
          fullName: doctorUser?.fullName,
          email: doctorUser?.email,
          specialization: doctor.specialization
        },
        diagnosis: prescriptionData.diagnosis,
        instructions: prescriptionData.instructions,
        notes: prescriptionData.notes,
        prescriptionDate: prescriptionData.prescriptionDate || new Date(),
        validUntil: prescriptionData.validUntil,
        refill: {
          maxRefills: Number(prescriptionData?.refill?.maxRefills || 0),
          usedRefills: 0
        },
        pharmacyId: prescriptionData.pharmacyId || undefined,
        sentToPharmacy: {
          isSent: Boolean(prescriptionData.pharmacyId),
          sentAt: prescriptionData.pharmacyId ? new Date() : undefined,
          sentByUserId: prescriptionData.pharmacyId ? doctorUserId : undefined,
          notes: prescriptionData.sendNotes
        },
        status: 'active'
      });

      this.addAuditLog(
        prescription,
        'PRESCRIPTION_CREATED',
        { userId: doctorUserId, role: 'doctor' },
        `Prescription created for patient ${patient._id}`
      );

      if (prescriptionData.pharmacyId) {
        this.addAuditLog(
          prescription,
          'SENT_TO_PHARMACY',
          { userId: doctorUserId, role: 'doctor' },
          `Sent to pharmacy ${prescriptionData.pharmacyId}`
        );
      }

      await prescription.save();

      return prescription.populate([
        { path: 'patientId', populate: { path: 'user', select: 'fullName email phone' } },
        { path: 'doctorId', populate: { path: 'user', select: 'fullName email' } }
      ]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update prescription (doctor only)
   */
  async updatePrescription(doctorUserId, prescriptionId, updateData) {
    try {
      const Doctor = require('../models/Doctor');
      
      const doctor = await Doctor.findOne({
        $or: [
          { user: doctorUserId },
          { userId: doctorUserId }
        ]
      });
      if (!doctor) {
        const error = new Error('Doctor profile not found');
        error.statusCode = 404;
        throw error;
      }

      // AUTHORIZATION: Find prescription and verify it belongs to this doctor
      const prescription = await Prescription.findOne({
        _id: prescriptionId,
        doctorId: doctor._id
      });

      if (!prescription) {
        const error = new Error('Prescription not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }

      // Only allow updates if prescription is not dispensed
      if (prescription.status === 'completed') {
        const error = new Error('Cannot update a dispensed prescription');
        error.statusCode = 400;
        throw error;
      }

      // Update allowed fields
      const allowedFields = ['medications', 'diagnosis', 'instructions', 'notes', 'validUntil', 'status'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          prescription[field] = updateData[field];
        }
      });

      this.addAuditLog(
        prescription,
        'PRESCRIPTION_UPDATED',
        { userId: doctorUserId, role: 'doctor' },
        'Prescription details updated'
      );

      await prescription.save();

      return prescription.populate([
        { path: 'patientId', populate: { path: 'user', select: 'fullName email phone' } },
        { path: 'doctorId', populate: { path: 'user', select: 'fullName email' } }
      ]);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark prescription as dispensed (for pharmacy)
   */
  async markAsDispensed(prescriptionId, pharmacyId, actor = {}) {
    try {
      const prescription = await Prescription.findById(prescriptionId);

      if (!prescription) {
        throw new Error('Prescription not found');
      }

      prescription.status = 'completed';
      prescription.pharmacyId = pharmacyId;
      prescription.dispensedDate = new Date();

      this.addAuditLog(
        prescription,
        'MARKED_DISPENSED',
        actor,
        `Prescription dispensed by pharmacy ${pharmacyId}`
      );
      
      await prescription.save();

      return prescription;
    } catch (error) {
      throw new Error(`Failed to mark prescription as dispensed: ${error.message}`);
    }
  }

  async sendToPharmacy(userId, role, prescriptionId, payload = {}, actor = {}) {
    const prescription = await this.getPrescriptionById(userId, prescriptionId, role);

    const target = await Prescription.findById(prescription._id || prescriptionId);
    if (!target) {
      throw new Error('Prescription not found');
    }

    if (!payload.pharmacyId) {
      throw new Error('pharmacyId is required to send prescription');
    }

    const pharmacy = await Pharmacy.findById(payload.pharmacyId);
    if (!pharmacy) {
      throw new Error('Selected pharmacy not found');
    }

    target.pharmacyId = pharmacy._id;
    target.sentToPharmacy = {
      isSent: true,
      sentAt: new Date(),
      sentByUserId: userId,
      notes: payload.notes
    };

    if (target.status === 'active') {
      target.status = 'pending';
    }

    this.addAuditLog(
      target,
      'SENT_TO_PHARMACY',
      actor,
      `Sent to pharmacy ${pharmacy._id}`
    );

    await target.save();
    return target;
  }

  async requestRefill(patientUserId, prescriptionId, payload = {}, actor = {}) {
    const patient = await Patient.findOne({ user: patientUserId });
    if (!patient) {
      throw new Error('Patient record not found');
    }

    const prescription = await Prescription.findOne({ _id: prescriptionId, patientId: patient._id });
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const maxRefills = Number(prescription?.refill?.maxRefills || 0);
    const usedRefills = Number(prescription?.refill?.usedRefills || 0);

    if (usedRefills >= maxRefills) {
      throw new Error('No refills remaining. Please request renewal from your doctor.');
    }

    prescription.refill.usedRefills = usedRefills + 1;
    prescription.refill.lastRefillDate = new Date();
    prescription.status = 'processing';

    this.addAuditLog(
      prescription,
      'REFILL_REQUESTED',
      actor,
      payload?.notes || 'Refill requested by patient'
    );

    await prescription.save();
    return prescription;
  }

  async renewPrescription(doctorUserId, prescriptionId, payload = {}, actor = {}) {
    const doctor = await Doctor.findOne({
      $or: [
        { user: doctorUserId },
        { userId: doctorUserId }
      ]
    });

    if (!doctor) {
      throw new Error('Doctor profile not found');
    }

    const prescription = await Prescription.findOne({ _id: prescriptionId, doctorId: doctor._id });
    if (!prescription) {
      throw new Error('Prescription not found or unauthorized');
    }

    prescription.renewal = prescription.renewal || {};
    prescription.renewal.renewalCount = Number(prescription.renewal.renewalCount || 0) + 1;
    prescription.renewal.lastRenewedAt = new Date();
    prescription.renewal.lastRenewedByUserId = doctorUserId;

    if (payload.validUntil) {
      prescription.validUntil = new Date(payload.validUntil);
    }

    if (payload.maxRefills !== undefined) {
      prescription.refill = prescription.refill || {};
      prescription.refill.maxRefills = Number(payload.maxRefills);
      prescription.refill.usedRefills = 0;
    }

    if (payload.notes) {
      prescription.notes = payload.notes;
    }

    prescription.status = 'active';

    this.addAuditLog(
      prescription,
      'PRESCRIPTION_RENEWED',
      actor,
      payload?.reason || 'Renewed by doctor'
    );

    await prescription.save();
    return prescription;
  }
}

module.exports = new PrescriptionService();
