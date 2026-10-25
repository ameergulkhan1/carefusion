const doctorService = require('../services/doctor.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class DoctorController {
  /**
   * Get all doctors (public endpoint for patients)
   */
  async getAllDoctors(req, res) {
    try {
      const filters = req.query;
      const data = await doctorService.getAllDoctors(filters);
      
      return successResponse(res, 'Doctors retrieved successfully', data);
    } catch (error) {
      console.error('Get all doctors error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get doctor by ID (public endpoint)
   */
  async getDoctorByIdPublic(req, res) {
    try {
      const { doctorId } = req.params;
      const doctor = await doctorService.getDoctorByIdPublic(doctorId);
      
      return successResponse(res, 'Doctor retrieved successfully', doctor);
    } catch (error) {
      console.error('Get doctor by ID error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get all specializations
   */
  async getSpecializations(req, res) {
    try {
      const specializations = await doctorService.getSpecializations();
      
      return successResponse(res, 'Specializations retrieved successfully', specializations);
    } catch (error) {
      console.error('Get specializations error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get available slots
   */
  async getAvailableSlots(req, res) {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return errorResponse(res, 'Date is required', 400);
      }
      
      const slots = await doctorService.getAvailableSlots(doctorId, date);
      
      return successResponse(res, 'Available slots retrieved successfully', slots);
    } catch (error) {
      console.error('Get available slots error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get doctor profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await doctorService.getDoctorProfile(userId);
      
      return successResponse(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      console.error('Get doctor profile error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Update doctor profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updateData = req.body;
      
      const profile = await doctorService.updateDoctorProfile(userId, updateData);
      
      return successResponse(res, 'Profile updated successfully', profile);
    } catch (error) {
      console.error('Update doctor profile error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get dashboard stats
   */
  async getDashboardStats(req, res) {
    try {
      const userId = req.user.userId;
      const stats = await doctorService.getDashboardStats(userId);
      
      return successResponse(res, 'Dashboard stats retrieved successfully', stats);
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get recent activity for doctor dashboard
   */
  async getRecentActivity(req, res) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit, 10) || 10;

      const activity = await doctorService.getRecentActivity(userId, limit);

      return successResponse(res, 'Recent activity retrieved successfully', activity);
    } catch (error) {
      console.error('Get recent activity error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get all patients
   */
  async getPatients(req, res) {
    try {
      const userId = req.user.userId;
      const filters = req.query;
      
      const data = await doctorService.getPatients(userId, filters);
      
      return successResponse(res, 'Patients retrieved successfully', data);
    } catch (error) {
      console.error('Get patients error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(req, res) {
    try {
      const userId = req.user.userId;
      const { patientId } = req.params;
      
      const patient = await doctorService.getPatientById(userId, patientId);
      
      return successResponse(res, 'Patient retrieved successfully', patient);
    } catch (error) {
      console.error('Get patient by ID error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get patient medical history
   */
  async getPatientMedicalHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { patientId } = req.params;
      
      const history = await doctorService.getPatientMedicalHistory(userId, patientId);
      
      return successResponse(res, 'Medical history retrieved successfully', history);
    } catch (error) {
      console.error('Get patient medical history error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get appointments
   */
  async getAppointments(req, res) {
    try {
      const userId = req.user.userId;
      const filters = req.query;
      
      const appointments = await doctorService.getAppointments(userId, filters);
      
      return successResponse(res, 'Appointments retrieved successfully', appointments);
    } catch (error) {
      console.error('Get appointments error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get today's appointments
   */
  async getTodaysAppointments(req, res) {
    try {
      const userId = req.user.userId;
      
      const appointments = await doctorService.getTodaysAppointments(userId);
      
      return successResponse(res, 'Today\'s appointments retrieved successfully', appointments);
    } catch (error) {
      console.error('Get today\'s appointments error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointmentById(req, res) {
    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;
      
      const appointment = await doctorService.getAppointmentById(userId, appointmentId);
      
      return successResponse(res, 'Appointment retrieved successfully', appointment);
    } catch (error) {
      console.error('Get appointment by ID error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(req, res) {
    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return errorResponse(res, 'Status is required', 400);
      }
      
      const appointment = await doctorService.updateAppointmentStatus(userId, appointmentId, status);
      
      return successResponse(res, 'Appointment status updated successfully', appointment);
    } catch (error) {
      console.error('Update appointment status error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Add consultation notes to appointment
   */
  async addConsultationNotes(req, res) {
    try {
      const userId = req.user.userId;
      const { appointmentId } = req.params;
      const { notes, diagnosis, symptoms, vitalSigns } = req.body;
      
      const appointment = await doctorService.addConsultationNotes(
        userId, 
        appointmentId, 
        { notes, diagnosis, symptoms, vitalSigns }
      );
      
      return successResponse(res, 'Consultation notes added successfully', appointment);
    } catch (error) {
      console.error('Add consultation notes error:', error);
      const statusCode = error.statusCode || 500;
      return errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new DoctorController();
