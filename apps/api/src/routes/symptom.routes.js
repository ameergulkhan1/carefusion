const express = require('express');
const router = express.Router();

// Import middleware (adjust paths based on your backend structure)
// If these don't exist, comment them out
const { protect, optionalAuth } = require('../middleware/auth');

// Import controllers
const {
  getAvailableSymptoms,
  checkSymptoms,
  getSymptomHistory,
  getSymptomCheckById,
  updateCheckStatus,
  saveCheckToRecords,
  getStatistics,
  generatePDFReport
} = require('../controllers/symptom.controller');

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

/**
 * @route   GET /api/symptoms/available
 * @desc    Get all available symptoms (categorized)
 * @access  Public
 */
router.get('/available', getAvailableSymptoms);

// ============================================================================
// OPTIONAL AUTH ROUTES (works with or without token)
// ============================================================================

/**
 * @route   POST /api/symptoms/check
 * @desc    Analyze symptoms and get AI predictions
 * @access  Public/Private (optional auth)
 * @note    If optionalAuth middleware doesn't exist, use this instead:
 *          router.post('/check', checkSymptoms);
 */
if (typeof optionalAuth === 'function') {
  router.post('/check', optionalAuth, checkSymptoms);
} else {
  // Fallback if optionalAuth doesn't exist
  router.post('/check', checkSymptoms);
}

// ============================================================================
// PROTECTED ROUTES (require authentication)
// ============================================================================

/**
 * @route   GET /api/symptoms/history
 * @desc    Get symptom check history for logged-in patient
 * @access  Private
 */
router.get('/history', protect, getSymptomHistory);

/**
 * @route   GET /api/symptoms/history/:id
 * @desc    Get specific symptom check by ID
 * @access  Private
 */
router.get('/history/:id', protect, getSymptomCheckById);

/**
 * @route   PATCH /api/symptoms/check/:id
 * @desc    Update symptom check status
 * @access  Private
 */
router.patch('/check/:id', protect, updateCheckStatus);

/**
 * @route   POST /api/symptoms/save-check
 * @desc    Save symptom check to medical records
 * @access  Private
 */
router.post('/save-check', protect, saveCheckToRecords);

/**
 * @route   GET /api/symptoms/statistics
 * @desc    Get patient symptom check statistics
 * @access  Private
 */
router.get('/statistics', protect, getStatistics);

/**
 * @route   GET /api/symptoms/pdf/:id
 * @desc    Generate PDF report for symptom check
 * @access  Private
 */
router.get('/pdf/:id', protect, generatePDFReport);

module.exports = router;
