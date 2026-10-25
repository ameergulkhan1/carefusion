const prescriptionService = require('../services/prescription.service');
const { successResponse, errorResponse } = require('../utils/response.util');
const Pharmacy = require('../models/Pharmacy');

class PrescriptionController {
  async getAvailablePharmacies(req, res) {
    try {
      const pharmacies = await prescriptionService.getAvailablePharmacies();
      return successResponse(res, 'Pharmacies retrieved successfully', pharmacies);
    } catch (error) {
      console.error('Get pharmacies error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get all prescriptions for a patient
   */
  async getPrescriptions(req, res) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const filters = {
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        patientId: req.query.patientId
      };

      let prescriptions;
      if (role === 'patient') {
        prescriptions = await prescriptionService.getPatientPrescriptions(userId, filters);
      } else if (role === 'doctor') {
        prescriptions = await prescriptionService.getDoctorPrescriptions(userId, filters);
      } else if (role === 'pharmacy') {
        prescriptions = await prescriptionService.getPharmacyPrescriptions(userId, filters);
      } else {
        return errorResponse(res, 'Access denied for this role', 403);
      }
      
      return successResponse(res, 'Prescriptions retrieved successfully', prescriptions);
    } catch (error) {
      console.error('Get prescriptions error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get a specific prescription
   */
  async getPrescriptionById(req, res) {
    try {
      const userId = req.user.userId;
      const role = req.user.role;
      const { id } = req.params;
      
      const prescription = await prescriptionService.getPrescriptionById(userId, id, role);
      
      return successResponse(res, 'Prescription retrieved successfully', prescription);
    } catch (error) {
      console.error('Get prescription error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Create prescription (doctor route)
   */
  async createPrescription(req, res) {
    try {
      const doctorUserId = req.user.userId;
      const prescriptionData = req.body;
      
      const prescription = await prescriptionService.createPrescription(doctorUserId, prescriptionData);
      
      return successResponse(res, 'Prescription created successfully', prescription, 201);
    } catch (error) {
      console.error('Create prescription error:', error);
      const statusCode = error.statusCode || 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Update prescription (doctor route)
   */
  async updatePrescription(req, res) {
    try {
      const doctorUserId = req.user.userId;
      const { id } = req.params;
      const updateData = req.body;
      
      const prescription = await prescriptionService.updatePrescription(doctorUserId, id, updateData);
      
      return successResponse(res, 'Prescription updated successfully', prescription);
    } catch (error) {
      console.error('Update prescription error:', error);
      const statusCode = error.statusCode || 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  /**
   * Mark prescription as dispensed (pharmacy route)
   */
  async markAsDispensed(req, res) {
    try {
      const { id } = req.params;
      const pharmacy = await Pharmacy.findOne({ user: req.user.userId });
      if (!pharmacy) {
        return errorResponse(res, 'Pharmacy profile not found', 404);
      }
      
      const prescription = await prescriptionService.markAsDispensed(id, pharmacy._id, {
        userId: req.user.userId,
        role: req.user.role,
        ipAddress: req.ip
      });
      
      return successResponse(res, 'Prescription marked as dispensed', prescription);
    } catch (error) {
      console.error('Mark prescription as dispensed error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  async sendToPharmacy(req, res) {
    try {
      const { id } = req.params;
      const prescription = await prescriptionService.sendToPharmacy(
        req.user.userId,
        req.user.role,
        id,
        req.body,
        {
          userId: req.user.userId,
          role: req.user.role,
          ipAddress: req.ip
        }
      );

      return successResponse(res, 'Prescription sent to pharmacy successfully', prescription);
    } catch (error) {
      console.error('Send prescription error:', error);
      const statusCode = error.statusCode || 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async requestRefill(req, res) {
    try {
      const { id } = req.params;
      const prescription = await prescriptionService.requestRefill(req.user.userId, id, req.body, {
        userId: req.user.userId,
        role: req.user.role,
        ipAddress: req.ip
      });

      return successResponse(res, 'Refill requested successfully', prescription);
    } catch (error) {
      console.error('Refill request error:', error);
      const statusCode = error.statusCode || 500;
      return errorResponse(res, error.message, statusCode);
    }
  }

  async renewPrescription(req, res) {
    try {
      const { id } = req.params;
      const prescription = await prescriptionService.renewPrescription(req.user.userId, id, req.body, {
        userId: req.user.userId,
        role: req.user.role,
        ipAddress: req.ip
      });

      return successResponse(res, 'Prescription renewed successfully', prescription);
    } catch (error) {
      console.error('Renew prescription error:', error);
      const statusCode = error.statusCode || 500;
      return errorResponse(res, error.message, statusCode);
    }
  }
}

module.exports = new PrescriptionController();
