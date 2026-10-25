const asyncHandler = require('express-async-handler');
const symptomService = require('../services/symptom.service');

/**
 * @desc    Get available symptoms (categorized)
 * @route   GET /api/symptoms/available
 * @access  Public
 */
const getAvailableSymptoms = asyncHandler(async (req, res) => {
  try {
    console.log('📡 Controller: getAvailableSymptoms called');
    
    const symptoms = await symptomService.getAvailableSymptoms();
    
    console.log('✅ Controller: Symptoms fetched successfully');
    
    res.status(200).json({
      success: true,
      data: symptoms  // This will be { categories: [...] }
    });
  } catch (error) {
    console.error('❌ Controller Error in getAvailableSymptoms:', error.message);
    console.error('❌ Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available symptoms',
      message: error.message
    });
  }
});

/**
 * @desc    Check symptoms and get AI predictions
 * @route   POST /api/symptoms/check
 * @access  Public/Private (optional auth)
 */
const checkSymptoms = asyncHandler(async (req, res) => {
  try {
    console.log('📡 Controller: checkSymptoms called');
    console.log('👤 User:', req.user?._id || 'anonymous');
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    
    const patientId = req.user?._id || null;  // Allow anonymous
    const symptomData = req.body;
    
    // Validate request body
    if (!symptomData.symptoms || !Array.isArray(symptomData.symptoms)) {
      return res.status(400).json({
        success: false,
        error: 'Symptoms array is required'
      });
    }
    
    if (symptomData.symptoms.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 symptoms are required'
      });
    }
    
    const result = await symptomService.analyzeSymptoms(patientId, symptomData);
    
    console.log('✅ Controller: Symptoms analyzed successfully');
    
    res.status(200).json(result);
  } catch (error) {
    console.error('❌ Controller Error in checkSymptoms:', error.message);
    console.error('❌ Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze symptoms',
      message: error.message
    });
  }
});

/**
 * @desc    Get symptom check history
 * @route   GET /api/symptoms/history
 * @access  Private
 */
const getSymptomHistory = asyncHandler(async (req, res) => {
  try {
    console.log('📡 Controller: getSymptomHistory called');
    console.log('👤 User:', req.user._id);
    
    const history = await symptomService.getPatientHistory(req.user._id);
    
    console.log('✅ Controller: History fetched successfully');
    
    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('❌ Controller Error in getSymptomHistory:', error.message);
    console.error('❌ Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch symptom history',
      message: error.message
    });
  }
});

/**
 * @desc    Get specific symptom check by ID
 * @route   GET /api/symptoms/history/:id
 * @access  Private
 */
const getSymptomCheckById = asyncHandler(async (req, res) => {
  try {
    console.log('📡 Controller: getSymptomCheckById called');
    console.log('🆔 Check ID:', req.params.id);
    
    // Uncomment if SymptomCheck model exists:
    // const SymptomCheck = require('../models/SymptomCheck');
    // const symptomCheck = await SymptomCheck.findById(req.params.id);
    // 
    // if (!symptomCheck) {
    //   return res.status(404).json({
    //     success: false,
    //     error: 'Symptom check not found'
    //   });
    // }
    // 
    // // Verify ownership
    // if (symptomCheck.patient && symptomCheck.patient.toString() !== req.user._id.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Not authorized to access this symptom check'
    //   });
    // }
    // 
    // res.status(200).json({
    //   success: true,
    //   data: symptomCheck
    // });
    
    // For now, return mock response
    res.status(404).json({
      success: false,
      error: 'Symptom check not found. Database model not yet implemented.'
    });
    
  } catch (error) {
    console.error('❌ Controller Error in getSymptomCheckById:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch symptom check',
      message: error.message
    });
  }
});

/**
 * @desc    Update symptom check status
 * @route   PATCH /api/symptoms/check/:id
 * @access  Private
 */
const updateCheckStatus = asyncHandler(async (req, res) => {
  try {
    console.log('📡 Controller: updateCheckStatus called');
    
    res.status(501).json({
      success: false,
      error: 'Not yet implemented'
    });
    
  } catch (error) {
    console.error('❌ Controller Error in updateCheckStatus:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to update check status',
      message: error.message
    });
  }
});

/**
 * @desc    Save symptom check to medical records
 * @route   POST /api/symptoms/save-check
 * @access  Private
 */
const saveCheckToRecords = asyncHandler(async (req, res) => {
  try {
    console.log('📡 Controller: saveCheckToRecords called');
    
    res.status(501).json({
      success: false,
      error: 'Not yet implemented'
    });
    
  } catch (error) {
    console.error('❌ Controller Error in saveCheckToRecords:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to save check to records',
      message: error.message
    });
  }
});

/**
 * @desc    Get symptom check statistics
 * @route   GET /api/symptoms/statistics
 * @access  Private
 */
const getStatistics = asyncHandler(async (req, res) => {
  try {
    console.log('📡 Controller: getStatistics called');
    
    res.status(501).json({
      success: false,
      error: 'Not yet implemented'
    });
    
  } catch (error) {
    console.error('❌ Controller Error in getStatistics:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message
    });
  }
});

/**
 * @desc    Generate PDF report
 * @route   GET /api/symptoms/pdf/:id
 * @access  Private
 */
const generatePDFReport = asyncHandler(async (req, res) => {
  try {
    console.log('📡 Controller: generatePDFReport called');
    
    res.status(501).json({
      success: false,
      error: 'Not yet implemented'
    });
    
  } catch (error) {
    console.error('❌ Controller Error in generatePDFReport:', error.message);
    
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report',
      message: error.message
    });
  }
});

module.exports = {
  getAvailableSymptoms,
  checkSymptoms,
  getSymptomHistory,
  getSymptomCheckById,
  updateCheckStatus,
  saveCheckToRecords,
  getStatistics,
  generatePDFReport
};
