const patientService = require('../services/patient.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class PatientController {
  /**
   * Get patient profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const profile = await patientService.getPatientProfile(userId);
      
      return successResponse(res, 'Profile retrieved successfully', profile);
    } catch (error) {
      console.error('Get profile error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Update patient profile
   */
  async updateProfile(req, res) {
    try {
      const userId = req.user.userId;
      const updateData = req.body;
      
      const profile = await patientService.updatePatientProfile(userId, updateData);
      
      return successResponse(res, 'Profile updated successfully', profile);
    } catch (error) {
      console.error('Update profile error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get medical history
   */
  async getMedicalHistory(req, res) {
    try {
      const userId = req.user.userId;
      const filters = req.query;
      
      const history = await patientService.getMedicalHistory(userId, filters);
      
      return successResponse(res, 'Medical history retrieved successfully', history);
    } catch (error) {
      console.error('Get medical history error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Add medical history entry
   */
  async addMedicalHistory(req, res) {
    try {
      const userId = req.user.userId;
      const entryData = req.body;
      
      const entry = await patientService.addMedicalHistory(userId, entryData);
      
      return successResponse(res, 'Medical history entry added successfully', entry, 201);
    } catch (error) {
      console.error('Add medical history error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Update medical history entry
   */
  async updateMedicalHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const updateData = req.body;
      
      const entry = await patientService.updateMedicalHistory(userId, id, updateData);
      
      return successResponse(res, 'Medical history entry updated successfully', entry);
    } catch (error) {
      console.error('Update medical history error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Delete medical history entry
   */
  async deleteMedicalHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const result = await patientService.deleteMedicalHistory(userId, id);
      
      return successResponse(res, result.message);
    } catch (error) {
      console.error('Delete medical history error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Add chronic condition
   */
  async addChronicCondition(req, res) {
    try {
      const userId = req.user.userId;
      const conditionData = req.body;
      
      const condition = await patientService.addChronicCondition(userId, conditionData);
      
      return successResponse(res, 'Chronic condition added successfully', condition, 201);
    } catch (error) {
      console.error('Add chronic condition error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Add allergy
   */
  async addAllergy(req, res) {
    try {
      const userId = req.user.userId;
      const allergyData = req.body;
      
      const allergy = await patientService.addAllergy(userId, allergyData);
      
      return successResponse(res, 'Allergy added successfully', allergy, 201);
    } catch (error) {
      console.error('Add allergy error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Add surgery
   */
  async addSurgery(req, res) {
    try {
      const userId = req.user.userId;
      const surgeryData = req.body;
      
      const surgery = await patientService.addSurgery(userId, surgeryData);
      
      return successResponse(res, 'Surgery record added successfully', surgery, 201);
    } catch (error) {
      console.error('Add surgery error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Add vaccination
   */
  async addVaccination(req, res) {
    try {
      const userId = req.user.userId;
      const vaccinationData = req.body;
      
      const vaccination = await patientService.addVaccination(userId, vaccinationData);
      
      return successResponse(res, 'Vaccination record added successfully', vaccination, 201);
    } catch (error) {
      console.error('Add vaccination error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get patient statistics
   */
  async getStats(req, res) {
    try {
      const userId = req.user.userId;
      
      const stats = await patientService.getPatientStats(userId);
      
      return successResponse(res, 'Statistics retrieved successfully', stats);
    } catch (error) {
      console.error('Get stats error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Create medicine order
   */
  async createMedicineOrder(req, res) {
    try {
      const userId = req.user.userId;
      const orderData = req.body;
      
      const order = await patientService.createMedicineOrder(userId, orderData);
      
      return successResponse(res, 'Medicine order created successfully', order, 201);
    } catch (error) {
      console.error('Create medicine order error:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Get medicine orders
   */
  async getMedicineOrders(req, res) {
    try {
      const userId = req.user.userId;
      const filters = req.query;
      
      const orders = await patientService.getMedicineOrders(userId, filters);
      
      return successResponse(res, 'Medicine orders retrieved successfully', orders);
    } catch (error) {
      console.error('Get medicine orders error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get medicine order by ID
   */
  async getMedicineOrderById(req, res) {
    try {
      const userId = req.user.userId;
      const orderId = req.params.id;
      
      const order = await patientService.getMedicineOrderById(userId, orderId);
      
      return successResponse(res, 'Medicine order retrieved successfully', order);
    } catch (error) {
      console.error('Get medicine order error:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }

  /**
   * Cancel medicine order
   */
  async cancelMedicineOrder(req, res) {
    try {
      const userId = req.user.userId;
      const orderId = req.params.id;
      const { reason } = req.body;
      
      const order = await patientService.cancelMedicineOrder(userId, orderId, reason);
      
      return successResponse(res, 'Medicine order cancelled successfully', order);
    } catch (error) {
      console.error('Cancel medicine order error:', error);
      return errorResponse(res, error.message, error.statusCode || 500);
    }
  }
}

module.exports = new PatientController();
