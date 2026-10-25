const medicalRecordService = require('../services/medicalRecord.service');
const fileService = require('../services/file.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class MedicalRecordController {
  /**
   * Get all medical records
   */
  async getMedicalRecords(req, res) {
    try {
      const userId = req.user.userId;
      const filters = {
        documentType: req.query.type,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        tags: req.query.tags ? req.query.tags.split(',') : undefined,
        search: req.query.search
      };
      
      const result = await medicalRecordService.getMedicalRecords(userId, filters);
      
      return successResponse(res, 'Medical records retrieved successfully', result);
    } catch (error) {
      console.error('Get medical records error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get a specific medical record
   */
  async getMedicalRecordById(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const record = await medicalRecordService.getMedicalRecordById(userId, id);
      
      return successResponse(res, 'Medical record retrieved successfully', record);
    } catch (error) {
      console.error('Get medical record error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Upload medical record
   */
  async uploadMedicalRecord(req, res) {
    try {
      const userId = req.user.userId;
      
      if (!req.file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      // Upload file to storage
      const fileData = await fileService.uploadToCloud(req.file, {
        directory: 'medical-records'
      });

      // Save record metadata
      const recordData = {
        documentType: req.body.documentType,
        documentDate: req.body.documentDate,
        notes: req.body.notes,
        tags: req.body.tags,
        doctorName: req.body.doctorName,
        hospitalName: req.body.hospitalName,
        relatedAppointment: req.body.relatedAppointment,
        relatedPrescription: req.body.relatedPrescription
      };

      const record = await medicalRecordService.uploadMedicalRecord(userId, fileData, recordData);
      
      return successResponse(res, 'Medical record uploaded successfully', record, 201);
    } catch (error) {
      console.error('Upload medical record error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Update medical record
   */
  async updateMedicalRecord(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const updateData = req.body;
      
      const record = await medicalRecordService.updateMedicalRecord(userId, id, updateData);
      
      return successResponse(res, 'Medical record updated successfully', record);
    } catch (error) {
      console.error('Update medical record error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Delete medical record
   */
  async deleteMedicalRecord(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const result = await medicalRecordService.deleteMedicalRecord(userId, id);
      
      return successResponse(res, result.message);
    } catch (error) {
      console.error('Delete medical record error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Share medical record
   */
  async shareMedicalRecord(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { doctorId } = req.body;
      
      if (!doctorId) {
        return errorResponse(res, 'Doctor ID is required', 400);
      }

      const result = await medicalRecordService.shareMedicalRecord(userId, id, doctorId);
      
      return successResponse(res, result.message, result.record);
    } catch (error) {
      console.error('Share medical record error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get medical records by type
   */
  async getMedicalRecordsByType(req, res) {
    try {
      const userId = req.user.userId;
      const { type } = req.params;
      
      const result = await medicalRecordService.getMedicalRecordsByType(userId, type);
      
      return successResponse(res, 'Medical records retrieved successfully', result);
    } catch (error) {
      console.error('Get medical records by type error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Get recent medical records
   */
  async getRecentMedicalRecords(req, res) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await medicalRecordService.getRecentMedicalRecords(userId, limit);
      
      return successResponse(res, 'Recent medical records retrieved successfully', result);
    } catch (error) {
      console.error('Get recent medical records error:', error);
      return errorResponse(res, error.message, 500);
    }
  }

  /**
   * Download medical record
   */
  async downloadMedicalRecord(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      
      const fileInfo = await medicalRecordService.downloadMedicalRecord(userId, id);
      
      // In production, redirect to cloud URL or stream file
      return successResponse(res, 'Download info retrieved successfully', fileInfo);
    } catch (error) {
      console.error('Download medical record error:', error);
      return errorResponse(res, error.message, 500);
    }
  }
}

module.exports = new MedicalRecordController();
