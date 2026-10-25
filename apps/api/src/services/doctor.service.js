const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient.model');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const MedicalRecord = require('../models/MedicalRecord.model');

class DoctorService {
  async getOrCreateDoctorByUserId(doctorUserId) {
    const user = await User.findById(doctorUserId).select('role');
    if (!user) {
      throw new Error('User not found');
    }

    let doctor = await Doctor.findOne({
      $or: [
        { user: doctorUserId },
        { userId: doctorUserId }
      ]
    });

    if (doctor) {
      const updatePayload = {};
      if (!doctor.user && doctor.userId) updatePayload.user = doctor.userId;
      if (!doctor.userId && doctor.user) updatePayload.userId = doctor.user;

      if (Object.keys(updatePayload).length > 0) {
        doctor = await Doctor.findByIdAndUpdate(
          doctor._id,
          { $set: updatePayload },
          { new: true }
        );
      }

      return doctor;
    }

    try {
      return await Doctor.findOneAndUpdate(
        {
          $or: [
            { user: doctorUserId },
            { userId: doctorUserId }
          ]
        },
        {
          $setOnInsert: {
            user: doctorUserId,
            userId: doctorUserId,
            specialization: 'General Practice',
            consultationFee: 0
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );
    } catch (error) {
      if (error.code === 11000) {
        const existingDoctor = await Doctor.findOne({
          $or: [
            { user: doctorUserId },
            { userId: doctorUserId }
          ]
        });

        if (existingDoctor) {
          return existingDoctor;
        }
      }

      throw error;
    }
  }

  /**
   * Get all doctors (public endpoint for patients)
   */
  async getAllDoctors(filters = {}) {
    try {
      let query = {};

      // Filter by specialization
      if (filters.specialization) {
        query.specialization = { $regex: filters.specialization, $options: 'i' };
      }

      // Filter by verified status
      if (filters.available !== undefined) {
        query.isVerified = filters.available === 'true';
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      const doctors = await Doctor.find(query)
        .populate('user', 'fullName email phone profileImage')
        .skip(skip)
        .limit(limit)
        .sort({ 'rating.average': -1, createdAt: -1 });

      // Apply search filter if provided
      let filteredDoctors = doctors;
      if (filters.search) {
        filteredDoctors = doctors.filter(doc => {
          const userName = doc.user?.fullName?.toLowerCase() || '';
          const specialization = doc.specialization?.toLowerCase() || '';
          const search = filters.search.toLowerCase();
          return userName.includes(search) || specialization.includes(search);
        });
      }

      const total = await Doctor.countDocuments(query);

      return {
        doctors: filteredDoctors.map(doc => {
          const fullName = doc.user?.fullName || 'Unknown';
          const nameParts = fullName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';

          return {
            _id: doc._id,
            id: doc._id,
            firstName,
            lastName,
            name: fullName,
            email: doc.user?.email,
            phone: doc.user?.phone,
            profileImage: doc.user?.profileImage,
            specialization: doc.specialization,
            qualification: doc.qualifications?.[0]?.degree || '',
            qualifications: doc.qualifications,
            experience: doc.experience ? `${doc.experience} years` : '0 years',
            consultationFee: doc.consultationFee,
            rating: doc.rating?.average || 0,
            reviewCount: doc.rating?.count || 0,
            isVerified: doc.isVerified,
            bio: doc.bio,
            languages: doc.languages,
            availableToday: doc.isVerified,
            hospitalName: doc.clinicAddress?.name || ''
          };
        }),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get doctors: ${error.message}`);
    }
  }

  /**
   * Get doctor by ID (public endpoint)
   */
  async getDoctorByIdPublic(doctorId) {
    try {
      const doctor = await Doctor.findById(doctorId)
        .populate('user', 'fullName email phone profileImage');

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const fullName = doctor.user?.fullName || 'Unknown';
      const nameParts = fullName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      return {
        _id: doctor._id,
        id: doctor._id,
        firstName,
        lastName,
        name: fullName,
        email: doctor.user?.email,
        phone: doctor.user?.phone,
        profileImage: doctor.user?.profileImage,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        qualification: doctor.qualifications?.[0]?.degree || '',
        qualifications: doctor.qualifications,
        experience: doctor.experience ? `${doctor.experience} years` : '0 years',
        bio: doctor.bio,
        languages: doctor.languages,
        consultationFee: doctor.consultationFee,
        availability: doctor.availability,
        rating: doctor.rating?.average || 0,
        reviewCount: doctor.rating?.count || 0,
        isVerified: doctor.isVerified,
        clinicAddress: doctor.clinicAddress,
        availableToday: doctor.isVerified,
        hospitalName: doctor.clinicAddress?.name || ''
      };
    } catch (error) {
      throw new Error(`Failed to get doctor details: ${error.message}`);
    }
  }

  /**
   * Get all specializations
   */
  async getSpecializations() {
    try {
      const specializations = await Doctor.distinct('specialization');
      return specializations.filter(Boolean).sort();
    } catch (error) {
      throw new Error(`Failed to get specializations: ${error.message}`);
    }
  }

  /**
   * Get available slots for a doctor
   */
  async getAvailableSlots(doctorId, date) {
    try {
      const doctor = await Doctor.findById(doctorId);
      
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const requestedDate = new Date(date);
      const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

      // Get doctor's availability for the requested day
      const dayAvailability = doctor.availability?.find(
        av => av.day.toLowerCase() === dayName
      );

      if (!dayAvailability) {
        return { slots: [] };
      }

      // Get existing appointments for this date
      const startOfDay = new Date(requestedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(requestedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await Appointment.find({
        doctorId: doctor._id,
        appointmentDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        status: { $nin: ['cancelled', 'no-show'] }
      }).select('appointmentTime');

      const bookedTimes = new Set(appointments.map(app => app.appointmentTime));

      // Filter available slots and return as time strings
      const availableSlots = dayAvailability.slots
        .filter(slot => slot.isAvailable && !bookedTimes.has(slot.startTime))
        .map(slot => slot.startTime);

      return availableSlots;
    } catch (error) {
      throw new Error(`Failed to get available slots: ${error.message}`);
    }
  }

  /**
   * Get doctor profile with user data
   */
  async getDoctorProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password -refreshToken');
      if (!user) {
        throw new Error('User not found');
      }

      const doctor = await this.getOrCreateDoctorByUserId(userId);

      return {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified
        },
        doctor
      };
    } catch (error) {
      throw new Error(`Failed to get doctor profile: ${error.message}`);
    }
  }

  /**
   * Update doctor profile
   */
  async updateDoctorProfile(userId, updateData) {
    try {
      const { user: userData, doctor: doctorData } = updateData;
      
      const updated = {};

      // Update User data
      if (userData) {
        const allowedUserFields = ['fullName', 'phone', 'profileImage'];
        const userUpdateData = {};
        
        allowedUserFields.forEach(field => {
          if (userData[field] !== undefined) {
            userUpdateData[field] = userData[field];
          }
        });

        if (Object.keys(userUpdateData).length > 0) {
          const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: userUpdateData },
            { new: true, runValidators: true }
          ).select('-password -refreshToken');
          
          updated.user = updatedUser;
        }
      }

      // Update Doctor data
      if (doctorData) {
        const doctor = await this.getOrCreateDoctorByUserId(userId);
        
        if (!doctor) {
          throw new Error('Doctor record not found');
        }

        // Update fields
        const allowedFields = [
          'specialization', 'licenseNumber', 'qualifications', 
          'experience', 'bio', 'languages', 'consultationFee',
          'availability', 'clinicAddress'
        ];
        
        allowedFields.forEach(field => {
          if (doctorData[field] !== undefined) {
            doctor[field] = doctorData[field];
          }
        });

        await doctor.save();
        updated.doctor = doctor;
      }

      // Return updated profile
      return await this.getDoctorProfile(userId);
    } catch (error) {
      throw new Error(`Failed to update doctor profile: ${error.message}`);
    }
  }

  /**
   * Get all patients for a doctor (patients who have appointments with this doctor)
   */
  async getPatients(doctorUserId, filters = {}) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      // Get unique patient IDs from appointments
      const appointments = await Appointment.find({ doctorId: doctor._id })
        .populate('patientId')
        .select('patientId');
      
      const patientIds = [...new Set(appointments.map(app => app.patientId?._id).filter(Boolean))];

      // Build query
      let query = { _id: { $in: patientIds } };

      // Apply search filter
      if (filters.search) {
        const users = await User.find({
          $or: [
            { fullName: { $regex: filters.search, $options: 'i' } },
            { email: { $regex: filters.search, $options: 'i' } }
          ]
        }).select('_id');
        
        const userIds = users.map(u => u._id);
        query.user = { $in: userIds };
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const skip = (page - 1) * limit;

      const patients = await Patient.find(query)
        .populate('user', '-password -refreshToken')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await Patient.countDocuments(query);

      return {
        patients,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`Failed to get patients: ${error.message}`);
    }
  }

  /**
   * Get patient by ID (for doctor viewing patient profile)
   */
  async getPatientById(doctorUserId, patientId) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      // Find patient
      const patient = await Patient.findById(patientId)
        .populate('user', '-password -refreshToken');

      if (!patient) {
        throw new Error('Patient not found');
      }

      // AUTHORIZATION: Check if doctor has any appointments with this patient
      const hasAppointment = await Appointment.findOne({
        doctorId: doctor._id,
        patientId: patient._id
      });

      if (!hasAppointment) {
        const error = new Error('Unauthorized: You can only view patients you have appointments with');
        error.statusCode = 403;
        throw error;
      }

      // Get patient's appointments with this doctor
      const appointments = await Appointment.find({
        doctorId: doctor._id,
        patientId: patient._id
      })
        .sort({ appointmentDate: -1 })
        .limit(10);

      // Get patient's prescriptions from this doctor
      const prescriptions = await Prescription.find({
        doctorId: doctor._id,
        patientId: patient._id
      })
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        patient: {
          id: patient._id,
          ...patient.toObject(),
          user: patient.user
        },
        appointments,
        prescriptions,
        stats: {
          totalAppointments: appointments.length,
          totalPrescriptions: prescriptions.length
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get patient medical history
   */
  async getPatientMedicalHistory(doctorUserId, patientId) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      const patient = await Patient.findById(patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // AUTHORIZATION: Check if doctor has any appointments with this patient
      const hasAppointment = await Appointment.findOne({
        doctorId: doctor._id,
        patientId: patient._id
      });

      if (!hasAppointment) {
        const error = new Error('Unauthorized: You can only view medical history of patients you have appointments with');
        error.statusCode = 403;
        throw error;
      }

      // Get medical records
      const records = await MedicalRecord.find({ patient: patientId })
        .populate('doctor', 'specialization')
        .populate({
          path: 'doctor',
          populate: {
            path: 'user',
            select: 'fullName profileImage'
          }
        })
        .sort({ createdAt: -1 });

      return {
        medicalHistory: patient.medicalHistory || [],
        records
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get dashboard stats for doctor
   */
  async getDashboardStats(doctorUserId) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Count today's appointments
      const todayAppointments = await Appointment.countDocuments({
        doctorId: doctor._id,
        appointmentDate: {
          $gte: today,
          $lt: tomorrow
        }
      });

      // Count pending appointments
      const pendingAppointments = await Appointment.countDocuments({
        doctorId: doctor._id,
        status: 'pending'
      });

      // Count total patients
      const allAppointments = await Appointment.find({ doctorId: doctor._id })
        .select('patientId')
        .distinct('patientId');
      const totalPatients = allAppointments.length;

      // Count this month's prescriptions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const monthlyPrescriptions = await Prescription.countDocuments({
        doctorId: doctor._id,
        createdAt: { $gte: startOfMonth }
      });

      return {
        todayAppointments,
        pendingAppointments,
        totalPatients,
        monthlyPrescriptions
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get doctor appointments with filters
   */
  async getAppointments(doctorUserId, filters = {}) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      let query = { doctorId: doctor._id };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.date) {
        const date = new Date(filters.date);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        query.appointmentDate = {
          $gte: date,
          $lt: nextDay
        };
      }

      if (filters.startDate && filters.endDate) {
        query.appointmentDate = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }

      const appointments = await Appointment.find(query)
        .populate('patientId')
        .populate({
          path: 'patientId',
          populate: {
            path: 'user',
            select: 'fullName email phone profileImage'
          }
        })
        .sort({ appointmentDate: 1, appointmentTime: 1 });

      return appointments;
    } catch (error) {
      throw new Error(`Failed to get appointments: ${error.message}`);
    }
  }

  /**
   * Get today's appointments
   */
  async getTodaysAppointments(doctorUserId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return await this.getAppointments(doctorUserId, { date: today.toISOString() });
    } catch (error) {
      throw new Error(`Failed to get today's appointments: ${error.message}`);
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(doctorUserId, appointmentId) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctorId: doctor._id
      })
        .populate('patientId')
        .populate({
          path: 'patientId',
          populate: {
            path: 'user',
            select: 'fullName email phone profileImage'
          }
        });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      return appointment;
    } catch (error) {
      throw new Error(`Failed to get appointment: ${error.message}`);
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(doctorUserId, appointmentId, status) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctorId: doctor._id
      });

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      appointment.status = status;
      await appointment.save();

      return appointment;
    } catch (error) {
      throw new Error(`Failed to update appointment status: ${error.message}`);
    }
  }

  /**
   * Add consultation notes to appointment
   */
  async addConsultationNotes(doctorUserId, appointmentId, notesData) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      // AUTHORIZATION: Find appointment and verify it belongs to this doctor
      const appointment = await Appointment.findOne({
        _id: appointmentId,
        doctorId: doctor._id
      }).populate('patientId');

      if (!appointment) {
        const error = new Error('Appointment not found or unauthorized');
        error.statusCode = 404;
        throw error;
      }

      // Add consultation notes
      if (notesData.notes) {
        appointment.consultation = appointment.consultation || {};
        appointment.consultation.notes = notesData.notes;
      }

      if (notesData.diagnosis) {
        appointment.consultation = appointment.consultation || {};
        appointment.consultation.diagnosis = notesData.diagnosis;
      }

      if (notesData.symptoms) {
        appointment.consultation = appointment.consultation || {};
        appointment.consultation.symptoms = notesData.symptoms;
      }

      if (notesData.vitalSigns) {
        appointment.consultation = appointment.consultation || {};
        appointment.consultation.vitalSigns = notesData.vitalSigns;
      }

      // Update appointment status to completed if notes are being added
      if (appointment.status === 'confirmed' || appointment.status === 'in-progress') {
        appointment.status = 'completed';
      }

      await appointment.save();

      return appointment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get recent doctor activity
   */
  async getRecentActivity(doctorUserId, limit = 10) {
    try {
      const doctor = await this.getOrCreateDoctorByUserId(doctorUserId);

      const appointments = await Appointment.find({ doctorId: doctor._id })
        .populate({
          path: 'patientId',
          populate: {
            path: 'user',
            select: 'fullName'
          }
        })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit);

      return appointments.map((appointment) => ({
        _id: appointment._id,
        activityType: 'appointment',
        action: `Appointment ${appointment.status || 'updated'}`,
        description: `Appointment ${appointment.status || 'updated'}`,
        patient: appointment.patientId?.user?.fullName || 'Patient',
        patientId: appointment.patientId,
        timestamp: appointment.updatedAt || appointment.createdAt,
        createdAt: appointment.createdAt,
        status: appointment.status
      }));
    } catch (error) {
      throw new Error(`Failed to get recent activity: ${error.message}`);
    }
  }
}

module.exports = new DoctorService();
