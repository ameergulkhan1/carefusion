const { body, param, query, validationResult } = require('express-validator');

class MedicalRecordValidator {
  /**
   * Validation rules for uploading medical record
   */
  uploadRecord() {
    return [
      body('documentType')
        .notEmpty()
        .withMessage('Document type is required')
        .isIn([
          'lab_report',
          'prescription',
          'xray',
          'mri',
          'ct_scan',
          'ultrasound',
          'ecg',
          'consultation_note',
          'discharge_summary',
          'vaccination_record',
          'other'
        ])
        .withMessage('Invalid document type'),
      
      body('documentDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
      
      body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters'),
      
      body('tags')
        .optional()
        .isString()
        .withMessage('Tags must be a comma-separated string'),
      
      body('doctorName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Doctor name must not exceed 100 characters'),
      
      body('hospitalName')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Hospital name must not exceed 100 characters'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for updating medical record
   */
  updateRecord() {
    return [
      body('documentDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
      
      body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters'),
      
      body('tags')
        .optional()
        .isString()
        .withMessage('Tags must be a comma-separated string'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for sharing medical record
   */
  shareRecord() {
    return [
      body('doctorId')
        .notEmpty()
        .withMessage('Doctor ID is required')
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage('Invalid doctor ID format'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for getting records by type
   */
  getByType() {
    return [
      param('type')
        .notEmpty()
        .withMessage('Document type is required')
        .isIn([
          'lab_report',
          'prescription',
          'xray',
          'mri',
          'ct_scan',
          'ultrasound',
          'ecg',
          'consultation_note',
          'discharge_summary',
          'vaccination_record',
          'other'
        ])
        .withMessage('Invalid document type'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for query filters
   */
  queryFilters() {
    return [
      query('type')
        .optional()
        .isIn([
          'lab_report',
          'prescription',
          'xray',
          'mri',
          'ct_scan',
          'ultrasound',
          'ecg',
          'consultation_note',
          'discharge_summary',
          'vaccination_record',
          'other'
        ])
        .withMessage('Invalid document type'),
      
      query('startDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid start date format'),
      
      query('endDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid end date format'),
      
      query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for MongoDB ObjectId
   */
  validateObjectId() {
    return [
      param('id')
        .matches(/^[0-9a-fA-F]{24}$/)
        .withMessage('Invalid ID format'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Handle validation errors
   */
  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    
    next();
  }
}

module.exports = new MedicalRecordValidator();
