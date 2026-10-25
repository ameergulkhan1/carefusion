const appointmentService = require('../services/appointment.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class AppointmentController {
  /**
   * Get all appointments for a patient
   */
  async getAppointments(req, res) {
    try {
      const userId = req.user.userId;
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };
      
      const appointments = await appointmentService.getPatientAppointments(userId, filters);
      
      return successResponse(res, 'Appointments retrieved successfully', appointments);
    } catch (error) {
      console.error('Get appointments error:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Get a specific appointment
   */
  async getAppointmentById(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const appointment = await appointmentService.getAppointmentById(userId, id);
      
      return successResponse(res, 'Appointment retrieved successfully', appointment);
    } catch (error) {
      console.error('Get appointment error:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Book a new appointment
   */
  async bookAppointment(req, res) {
    try {
      const userId = req.user.userId;
      const appointmentData = req.body;
      
      const appointment = await appointmentService.bookAppointment(userId, appointmentData);
      
      return successResponse(res, 'Appointment booked successfully', appointment, 201);
    } catch (error) {
      console.error('Book appointment error:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const updateData = req.body;
      
      const appointment = await appointmentService.updateAppointment(userId, id, updateData);
      
      return successResponse(res, 'Appointment updated successfully', appointment);
    } catch (error) {
      console.error('Update appointment error:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { reason } = req.body;
      
      const appointment = await appointmentService.cancelAppointment(userId, id, reason);
      
      return successResponse(res, 'Appointment cancelled successfully', appointment);
    } catch (error) {
      console.error('Cancel appointment error:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Send message to doctor about appointment
   */
  async sendMessage(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;
      const { message } = req.body;
      
      if (!message) {
        return errorResponse(res, 'Message is required', 400);
      }
      
      const appointment = await appointmentService.sendMessage(userId, userRole, id, message);
      
      return successResponse(res, 'Message sent successfully', appointment);
    } catch (error) {
      console.error('Send message error:', error);
      const statusCode = error.statusCode || 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Get messages for appointment
   */
  async getMessages(req, res) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const { id } = req.params;
      
      const messages = await appointmentService.getMessages(userId, userRole, id);
      
      return successResponse(res, 'Messages retrieved successfully', messages);
    } catch (error) {
      console.error('Get messages error:', error);
      const statusCode = error.statusCode || 500;
      return errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new AppointmentController();
