/**
 * Clinical Notes Routes
 * RESTful API endpoints for clinical notes management
 */

const express = require('express');
const router = express.Router();
const clinicalNotesController = require('../controllers/clinicalNotes.controller');
const aiNotesController = require('../controllers/aiNotes.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validateClinicalNote, validateAIRequest } = require('../middleware/validation.middleware');
const upload = require('../middleware/upload.middleware');

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/clinical-notes
 * @desc    Create a new clinical note
 * @access  Private (Doctor only)
 */
router.post(
  '/',
  authorize(['doctor']),
  validateClinicalNote,
  clinicalNotesController.createNote
);

/**
 * @route   GET /api/v1/clinical-notes
 * @desc    Get all clinical notes (with filters)
 * @access  Private (Doctor)
 * @query   doctor, status, startDate, endDate, patient
 */
router.get(
  '/',
  authorize(['doctor']),
  clinicalNotesController.getNotes
);

/**
 * @route   GET /api/v1/clinical-notes/statistics/:doctorId
 * @desc    Get statistics for doctor dashboard
 * @access  Private (Doctor)
 */
router.get(
  '/statistics/:doctorId',
  authorize(['doctor']),
  clinicalNotesController.getStatistics
);

/**
 * @route   GET /api/v1/clinical-notes/patient/:patientId
 * @desc    Get all notes for a specific patient
 * @access  Private (Doctor, Patient)
 */
router.get(
  '/patient/:patientId',
  authorize(['doctor', 'patient']),
  clinicalNotesController.getPatientNotes
);

/**
 * @route   GET /api/v1/clinical-notes/:id
 * @desc    Get a specific clinical note by ID
 * @access  Private (Doctor, Patient)
 */
router.get(
  '/:id',
  authorize(['doctor', 'patient']),
  clinicalNotesController.getNoteById
);

/**
 * @route   PUT /api/v1/clinical-notes/:id
 * @desc    Update a clinical note
 * @access  Private (Doctor only)
 */
router.put(
  '/:id',
  authorize(['doctor']),
  validateClinicalNote,
  clinicalNotesController.updateNote
);

/**
 * @route   DELETE /api/v1/clinical-notes/:id
 * @desc    Delete a clinical note (soft delete)
 * @access  Private (Doctor only)
 */
router.delete(
  '/:id',
  authorize(['doctor']),
  clinicalNotesController.deleteNote
);

/**
 * @route   POST /api/v1/clinical-notes/generate-ai-note
 * @desc    Generate AI-powered clinical note
 * @access  Private (Doctor only)
 */
router.post(
  '/generate-ai-note',
  authorize(['doctor']),
  validateAIRequest,
  aiNotesController.generateAINote
);

/**
 * @route   POST /api/v1/clinical-notes/:id/finalize
 * @desc    Finalize a clinical note (make it read-only)
 * @access  Private (Doctor only)
 */
router.post(
  '/:id/finalize',
  authorize(['doctor']),
  clinicalNotesController.finalizeNote
);

/**
 * @route   GET /api/v1/clinical-notes/:id/pdf
 * @desc    Generate and download PDF of clinical note
 * @access  Private (Doctor, Patient)
 */
router.get(
  '/:id/pdf',
  authorize(['doctor', 'patient']),
  clinicalNotesController.generatePDF
);

/**
 * @route   POST /api/v1/clinical-notes/voice-to-text
 * @desc    Convert voice audio to text
 * @access  Private (Doctor only)
 */
router.post(
  '/voice-to-text',
  authorize(['doctor']),
  upload.single('audio'),
  clinicalNotesController.voiceToText
);

module.exports = router;
