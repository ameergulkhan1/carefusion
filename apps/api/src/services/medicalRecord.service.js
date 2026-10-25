const MedicalRecord = require('../models/MedicalRecord.model');
const Patient = require('../models/Patient.model');
const path = require('path');
const fs = require('fs').promises;

class MedicalRecordService {
  /**
   * Get all medical records for a patient
   */
  async getMedicalRecords(userId, filters = {}) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const query = {
        patient: patient._id,
        status: 'active'
      };

      // Apply filters
      if (filters.documentType) {
        query.documentType = filters.documentType;
      }

      if (filters.startDate || filters.endDate) {
        query.documentDate = {};
        if (filters.startDate) {
          query.documentDate.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.documentDate.$lte = new Date(filters.endDate);
        }
      }

      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }

      if (filters.search) {
        query.$or = [
          { fileName: { $regex: filters.search, $options: 'i' } },
          { notes: { $regex: filters.search, $options: 'i' } },
          { tags: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const records = await MedicalRecord.find(query)
        .sort({ documentDate: -1 })
        .populate('uploadedBy', 'fullName role')
        .populate('sharedWith', 'fullName role')
        .populate('metadata.relatedAppointment')
        .populate('metadata.relatedPrescription');

      return {
        count: records.length,
        records
      };
    } catch (error) {
      throw new Error(`Failed to get medical records: ${error.message}`);
    }
  }

  /**
   * Get a specific medical record
   */
  async getMedicalRecordById(userId, recordId) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const record = await MedicalRecord.findOne({
        _id: recordId,
        patient: patient._id
      })
        .populate('uploadedBy', 'fullName role email')
        .populate('sharedWith', 'fullName role email')
        .populate('metadata.relatedAppointment')
        .populate('metadata.relatedPrescription');

      if (!record) {
        throw new Error('Medical record not found');
      }

      // Log access
      await record.logAccess(userId, 'view');

      return record;
    } catch (error) {
      throw new Error(`Failed to get medical record: ${error.message}`);
    }
  }

  /**
   * Upload medical record
   */
  async uploadMedicalRecord(userId, fileData, recordData) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const record = await MedicalRecord.create({
        patient: patient._id,
        documentType: recordData.documentType,
        documentUrl: fileData.url,
        thumbnailUrl: fileData.thumbnailUrl,
        documentDate: recordData.documentDate || new Date(),
        uploadedBy: userId,
        fileName: fileData.originalName,
        fileSize: fileData.size,
        mimeType: fileData.mimeType,
        notes: recordData.notes,
        tags: recordData.tags ? recordData.tags.split(',').map(tag => tag.trim()) : [],
        metadata: {
          doctorName: recordData.doctorName,
          hospitalName: recordData.hospitalName,
          relatedAppointment: recordData.relatedAppointment,
          relatedPrescription: recordData.relatedPrescription
        }
      });

      // Update patient stats
      await patient.updateStats();

      return await record.populate('uploadedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Failed to upload medical record: ${error.message}`);
    }
  }

  /**
   * Delete medical record
   */
  async deleteMedicalRecord(userId, recordId) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const record = await MedicalRecord.findOne({
        _id: recordId,
        patient: patient._id
      });

      if (!record) {
        throw new Error('Medical record not found');
      }

      // Soft delete - change status to deleted
      record.status = 'deleted';
      await record.save();

      // Update patient stats
      await patient.updateStats();

      return { message: 'Medical record deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete medical record: ${error.message}`);
    }
  }

  /**
   * Share medical record with doctor
   */
  async shareMedicalRecord(userId, recordId, doctorId) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const record = await MedicalRecord.findOne({
        _id: recordId,
        patient: patient._id
      });

      if (!record) {
        throw new Error('Medical record not found');
      }

      await record.shareWith(doctorId);
      await record.logAccess(userId, 'share');

      return { 
        message: 'Medical record shared successfully',
        record: await record.populate('sharedWith', 'fullName role')
      };
    } catch (error) {
      throw new Error(`Failed to share medical record: ${error.message}`);
    }
  }

  /**
   * Update medical record
   */
  async updateMedicalRecord(userId, recordId, updateData) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const record = await MedicalRecord.findOne({
        _id: recordId,
        patient: patient._id
      });

      if (!record) {
        throw new Error('Medical record not found');
      }

      // Update allowed fields
      const allowedFields = ['documentDate', 'notes', 'tags', 'metadata'];
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'tags' && typeof updateData[field] === 'string') {
            record[field] = updateData[field].split(',').map(tag => tag.trim());
          } else if (field === 'metadata') {
            record[field] = { ...record[field], ...updateData[field] };
          } else {
            record[field] = updateData[field];
          }
        }
      });

      await record.save();

      return await record.populate('uploadedBy', 'fullName role');
    } catch (error) {
      throw new Error(`Failed to update medical record: ${error.message}`);
    }
  }

  /**
   * Get medical records by type
   */
  async getMedicalRecordsByType(userId, documentType) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const records = await MedicalRecord.getByType(patient._id, documentType);

      return {
        count: records.length,
        documentType,
        records
      };
    } catch (error) {
      throw new Error(`Failed to get medical records by type: ${error.message}`);
    }
  }

  /**
   * Get recent medical records
   */
  async getRecentMedicalRecords(userId, limit = 10) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const records = await MedicalRecord.getRecent(patient._id, limit);

      return {
        count: records.length,
        records
      };
    } catch (error) {
      throw new Error(`Failed to get recent medical records: ${error.message}`);
    }
  }

  /**
   * Download medical record
   */
  async downloadMedicalRecord(userId, recordId) {
    try {
      const patient = await Patient.findOne({ user: userId });
      
      if (!patient) {
        throw new Error('Patient record not found');
      }

      const record = await MedicalRecord.findOne({
        _id: recordId,
        patient: patient._id
      });

      if (!record) {
        throw new Error('Medical record not found');
      }

      // Log access
      await record.logAccess(userId, 'download');

      return {
        url: record.documentUrl,
        fileName: record.fileName,
        mimeType: record.mimeType
      };
    } catch (error) {
      throw new Error(`Failed to download medical record: ${error.message}`);
    }
  }
}

module.exports = new MedicalRecordService();
