/**
 * Clinical Notes Controller
 * Handles all clinical notes related business logic
 */

const clinicalNotesService = require('../services/clinicalNotes.service');
const notificationService = require('../services/notificationService');

const getAuthenticatedUserId = (req) => req.user?.userId || req.user?._id;

class ClinicalNotesController {
  /**
   * Create a new clinical note
   */
  async createNote(req, res, next) {
    try {
      const doctorId = getAuthenticatedUserId(req);
      const noteData = req.body;

      const note = await clinicalNotesService.createClinicalNote(doctorId, noteData);

      return res.status(201).json({
        success: true,
        message: 'Clinical note created successfully',
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all clinical notes with filters
   */
  async getNotes(req, res, next) {
    try {
      const { doctor, status, startDate, endDate, patient, page = 1, limit = 20 } = req.query;

      const filters = {};
      if (doctor) filters.doctor = doctor;
      if (status) filters.status = status;
      if (patient) filters.patient = patient;
      if (startDate || endDate) {
        filters.visitDate = {};
        if (startDate) filters.visitDate.$gte = new Date(startDate);
        if (endDate) filters.visitDate.$lte = new Date(endDate);
      }

      const result = await clinicalNotesService.getNotes(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      return res.status(200).json({
        success: true,
        message: 'Clinical notes retrieved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a specific note by ID
   */
  async getNoteById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = getAuthenticatedUserId(req);
      const userRole = req.user.role;

      const note = await clinicalNotesService.getNoteById(id);

      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Clinical note not found'
        });
      }

      // Authorization check
      if (userRole === 'patient' && note.patient.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (userRole === 'doctor' && note.doctor.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Track patient view
      if (userRole === 'patient' && !note.patientViewed) {
        await clinicalNotesService.markAsViewed(id);
      }

      return res.status(200).json({
        success: true,
        message: 'Clinical note retrieved successfully',
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a clinical note
   */
  async updateNote(req, res, next) {
    try {
      const { id } = req.params;
      const doctorId = getAuthenticatedUserId(req);
      const updateData = req.body;

      const note = await clinicalNotesService.updateNote(id, doctorId, updateData);

      return res.status(200).json({
        success: true,
        message: 'Clinical note updated successfully',
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a clinical note (soft delete)
   */
  async deleteNote(req, res, next) {
    try {
      const { id } = req.params;
      const doctorId = getAuthenticatedUserId(req);

      await clinicalNotesService.deleteNote(id, doctorId);

      return res.status(200).json({
        success: true,
        message: 'Clinical note deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notes for a specific patient
   */
  async getPatientNotes(req, res, next) {
    try {
      const { patientId } = req.params;
      const { limit = 10 } = req.query;

      const notes = await clinicalNotesService.getPatientNotes(patientId, parseInt(limit));

      return res.status(200).json({
        success: true,
        message: 'Patient notes retrieved successfully',
        data: notes
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Finalize a clinical note
   */
  async finalizeNote(req, res, next) {
    try {
      const { id } = req.params;
      const doctorId = getAuthenticatedUserId(req);

      const note = await clinicalNotesService.finalizeNote(id, doctorId);

      // Send notification to patient
      try {
        await notificationService.sendNotification({
          userId: note.patient,
          type: 'CLINICAL_NOTE_FINALIZED',
          title: 'Clinical Note Available',
          message: `Your clinical note from Dr. ${req.user.name} is ready to view`,
          data: { noteId: note._id }
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      return res.status(200).json({
        success: true,
        message: 'Clinical note finalized successfully',
        data: note
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate PDF of clinical note
   */
  async generatePDF(req, res, next) {
    try {
      const { id } = req.params;

      const pdfBuffer = await clinicalNotesService.generatePDF(id);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=clinical-note-${id}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Convert voice to text
   */
  async voiceToText(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Audio file is required'
        });
      }

      const transcription = await clinicalNotesService.transcribeAudio(req.file);

      return res.status(200).json({
        success: true,
        message: 'Audio transcribed successfully',
        data: transcription
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics for doctor dashboard
   */
  async getStatistics(req, res, next) {
    try {
      const { doctorId } = req.params;
      const userId = getAuthenticatedUserId(req);

      // Verify doctor is accessing their own stats
      if (!userId || userId.toString() !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const stats = await clinicalNotesService.getStatistics(doctorId);

      return res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClinicalNotesController();
