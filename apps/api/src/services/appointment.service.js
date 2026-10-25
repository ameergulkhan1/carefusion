const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient.model');
const Doctor = require('../models/Doctor');
const User = require('../models/User');

class AppointmentService {
  createHttpError(message, statusCode = 500) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  }

  async getOrCreatePatientByUserId(userId) {
    let patient = await Patient.findOne({ user: userId });

    if (patient) {
      return patient;
    }

    patient = await Patient.create({
      user: userId,
      gender: 'other'
    });

    return patient;
  }

  normalizeAppointmentType(rawType) {
    if (!rawType) return 'in-person';

    const type = String(rawType).toLowerCase();
    if (['in-person', 'video', 'phone'].includes(type)) {
      return type;
    }

    // Backward-compatible mapping from legacy UI labels.
    const legacyMap = {
      consultation: 'in-person',
      'follow-up': 'in-person',
      'check-up': 'in-person',
      emergency: 'in-person'
    };

    return legacyMap[type] || 'in-person';
  }

  /**
   * Get all appointments for a patient
   */
  async getPatientAppointments(userId, filters = {}) {
    try {
      const patient = await this.getOrCreatePatientByUserId(userId);

      const query = {
        patientId: patient._id
      };

      // Apply filters
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.startDate || filters.endDate) {
        query.appointmentDate = {};
        if (filters.startDate) {
          query.appointmentDate.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.appointmentDate.$lte = new Date(filters.endDate);
        }
      }

      const appointments = await Appointment.find(query)
        .populate('doctorId', 'fullName specialization')
        .sort({ appointmentDate: -1 });

      // Populate doctor user details
      const populatedAppointments = await Promise.all(
        appointments.map(async (apt) => {
          if (apt.doctorId) {
            const doctorUser = await User.findById(apt.doctorId.user).select('fullName email phone profileImage');
            return {
              ...apt.toObject(),
              doctor: {
                id: apt.doctorId._id,
                name: doctorUser?.fullName || 'Unknown Doctor',
                specialization: apt.doctorId.specialization,
                email: doctorUser?.email,
                phone: doctorUser?.phone,
                profileImage: doctorUser?.profileImage
              }
            };
          }
          return apt.toObject();
        })
      );

      return populatedAppointments;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw this.createHttpError(`Failed to get appointments: ${error.message}`, 500);
    }
  }

  /**
   * Get a specific appointment
   */
  async getAppointmentById(userId, appointmentId) {
    try {
      const patient = await this.getOrCreatePatientByUserId(userId);

      const appointment = await Appointment.findOne({
        _id: appointmentId,
        patientId: patient._id
      }).populate('doctorId', 'fullName specialization');

      if (!appointment) {
        throw this.createHttpError('Appointment not found', 404);
      }

      // Populate doctor user details
      if (appointment.doctorId) {
        const doctorUser = await User.findById(appointment.doctorId.user).select('fullName email phone profileImage');
        return {
          ...appointment.toObject(),
          doctor: {
            id: appointment.doctorId._id,
            name: doctorUser?.fullName || 'Unknown Doctor',
            specialization: appointment.doctorId.specialization,
            email: doctorUser?.email,
            phone: doctorUser?.phone,
            profileImage: doctorUser?.profileImage
          }
        };
      }

      return appointment;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw this.createHttpError(`Failed to get appointment: ${error.message}`, 500);
    }
  }

  /**
   * Book a new appointment
   */
  async bookAppointment(userId, appointmentData) {
    try {
      const patient = await this.getOrCreatePatientByUserId(userId);

      const { doctorId, appointmentDate, appointmentTime, reason } = appointmentData;

      if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
        throw this.createHttpError('doctorId, appointmentDate, appointmentTime, and reason are required', 400);
      }

      const parsedDate = new Date(appointmentDate);
      if (Number.isNaN(parsedDate.getTime())) {
        throw this.createHttpError('Invalid appointmentDate', 400);
      }

      const now = new Date();
      if (parsedDate < now.setHours(0, 0, 0, 0)) {
        throw this.createHttpError('Appointment date cannot be in the past', 400);
      }

      // Verify doctor exists
      const doctor = await Doctor.findById(appointmentData.doctorId);
      if (!doctor) {
        throw this.createHttpError('Doctor not found', 404);
      }

      const normalizedTime = String(appointmentTime).trim();
      const existingAppointment = await Appointment.findOne({
        doctorId: appointmentData.doctorId,
        appointmentDate: parsedDate,
        appointmentTime: normalizedTime,
        status: { $nin: ['cancelled', 'no-show'] }
      });

      if (existingAppointment) {
        throw this.createHttpError('Selected slot is no longer available', 409);
      }

      const normalizedType = this.normalizeAppointmentType(appointmentData.type || appointmentData.appointmentType);

      const appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: appointmentData.doctorId,
        appointmentDate: parsedDate,
        appointmentTime: normalizedTime,
        type: normalizedType,
        reason: appointmentData.reason,
        symptoms: appointmentData.symptoms || [],
        notes: appointmentData.notes,
        status: 'scheduled'
      });

      const initialMessageParts = [
        `Appointment booked for ${parsedDate.toDateString()} at ${normalizedTime}.`,
        `Reason: ${appointmentData.reason}`
      ];

      if (appointmentData.notes) {
        initialMessageParts.push(`Notes: ${appointmentData.notes}`);
      }

      appointment.messages.push({
        sender: 'patient',
        senderUserId: userId,
        message: initialMessageParts.join(' '),
        timestamp: new Date(),
        read: false
      });

      await appointment.save();

      // Update patient stats
      await patient.updateStats();

      return await appointment.populate('doctorId', 'fullName specialization');
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw this.createHttpError(`Failed to book appointment: ${error.message}`, 500);
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(userId, appointmentId, updateData) {
    try {
      const patient = await this.getOrCreatePatientByUserId(userId);

      const appointment = await Appointment.findOne({
        _id: appointmentId,
        patientId: patient._id
      });

      if (!appointment) {
        throw this.createHttpError('Appointment not found', 404);
      }

      // Only allow certain fields to be updated by patient
      const allowedUpdates = ['appointmentDate', 'appointmentTime', 'symptoms', 'notes'];
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          appointment[key] = updateData[key];
        }
      });

      await appointment.save();

      return await appointment.populate('doctorId', 'fullName specialization');
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw this.createHttpError(`Failed to update appointment: ${error.message}`, 500);
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(userId, appointmentId, reason) {
    try {
      const patient = await this.getOrCreatePatientByUserId(userId);

      const appointment = await Appointment.findOne({
        _id: appointmentId,
        patientId: patient._id
      });

      if (!appointment) {
        throw this.createHttpError('Appointment not found', 404);
      }

      // Don't allow cancellation of past appointments
      if (new Date(appointment.appointmentDate) < new Date()) {
        throw this.createHttpError('Cannot cancel past appointments', 400);
      }

      appointment.status = 'cancelled';
      appointment.cancelledBy = userId;
      appointment.cancelledAt = new Date();
      appointment.cancellationReason = reason || 'Not specified';
      
      await appointment.save();

      // Update patient stats
      await patient.updateStats();

      return appointment;
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      throw this.createHttpError(`Failed to cancel appointment: ${error.message}`, 500);
    }
  }

  /**
   * Send message for appointment (patient or doctor)
   */
  async sendMessage(userId, userRole, appointmentId, messageText) {
    try {
      let appointment;

      if (userRole === 'patient') {
        const patient = await Patient.findOne({ user: userId });
        if (!patient) {
          const error = new Error('Patient profile not found');
          error.statusCode = 404;
          throw error;
        }

        appointment = await Appointment.findOne({
          _id: appointmentId,
          patientId: patient._id
        });

        if (!appointment) {
          const error = new Error('Appointment not found');
          error.statusCode = 404;
          throw error;
        }

        // Add message
        appointment.messages.push({
          sender: 'patient',
          senderUserId: userId,
          message: messageText,
          timestamp: new Date(),
          read: false
        });

      } else if (userRole === 'doctor') {
        const doctor = await Doctor.findOne({
          $or: [
            { user: userId },
            { userId: userId }
          ]
        });
        if (!doctor) {
          const error = new Error('Doctor profile not found');
          error.statusCode = 404;
          throw error;
        }

        appointment = await Appointment.findOne({
          _id: appointmentId,
          doctorId: doctor._id
        });

        if (!appointment) {
          const error = new Error('Appointment not found');
          error.statusCode = 404;
          throw error;
        }

        // Add message
        appointment.messages.push({
          sender: 'doctor',
          senderUserId: userId,
          message: messageText,
          timestamp: new Date(),
          read: false
        });
      } else {
        const error = new Error('Invalid user role');
        error.statusCode = 403;
        throw error;
      }

      await appointment.save();
      return appointment;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get messages for appointment (patient or doctor)
   */
  async getMessages(userId, userRole, appointmentId) {
    try {
      let appointment;

      if (userRole === 'patient') {
        const patient = await Patient.findOne({ user: userId });
        if (!patient) {
          const error = new Error('Patient profile not found');
          error.statusCode = 404;
          throw error;
        }

        appointment = await Appointment.findOne({
          _id: appointmentId,
          patientId: patient._id
        }).populate('messages.senderUserId', 'fullName profileImage');

        if (!appointment) {
          const error = new Error('Appointment not found');
          error.statusCode = 404;
          throw error;
        }

        // Mark doctor messages as read
        let updated = false;
        appointment.messages.forEach(msg => {
          if (msg.sender === 'doctor' && !msg.read) {
            msg.read = true;
            updated = true;
          }
        });

        if (updated) {
          await appointment.save();
        }

      } else if (userRole === 'doctor') {
        const doctor = await Doctor.findOne({
          $or: [
            { user: userId },
            { userId: userId }
          ]
        });
        if (!doctor) {
          const error = new Error('Doctor profile not found');
          error.statusCode = 404;
          throw error;
        }

        appointment = await Appointment.findOne({
          _id: appointmentId,
          doctorId: doctor._id
        }).populate('messages.senderUserId', 'fullName profileImage');

        if (!appointment) {
          const error = new Error('Appointment not found');
          error.statusCode = 404;
          throw error;
        }

        // Mark patient messages as read
        let updated = false;
        appointment.messages.forEach(msg => {
          if (msg.sender === 'patient' && !msg.read) {
            msg.read = true;
            updated = true;
          }
        });

        if (updated) {
          await appointment.save();
        }

      } else {
        const error = new Error('Invalid user role');
        error.statusCode = 403;
        throw error;
      }

      return appointment.messages;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AppointmentService();
