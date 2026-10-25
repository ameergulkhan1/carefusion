const { body, param, query, validationResult } = require('express-validator');

class PatientValidator {
  /**
   * Validation rules for updating profile
   */
  updateProfile() {
    return [
      body('user.fullName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
      
      body('user.phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid phone number format'),
      
      body('patient.dateOfBirth')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format')
        .custom((value) => {
          const date = new Date(value);
          const today = new Date();
          if (date > today) {
            throw new Error('Date of birth cannot be in the future');
          }
          return true;
        }),
      
      body('patient.gender')
        .optional()
        .isIn(['male', 'female', 'other'])
        .withMessage('Gender must be male, female, or other'),
      
      body('patient.bloodGroup')
        .optional()
        .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
        .withMessage('Invalid blood group'),
      
      body('patient.address.zipCode')
        .optional()
        .trim()
        .isLength({ min: 4, max: 10 })
        .withMessage('Invalid zip code'),
      
      body('patient.emergencyContact.phone')
        .optional()
        .trim()
        .matches(/^[\d\s\-\+\(\)]+$/)
        .withMessage('Invalid emergency contact phone number'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for medical history entry
   */
  medicalHistoryEntry() {
    return [
      body('eventType')
        .notEmpty()
        .withMessage('Event type is required')
        .isIn(['diagnosis', 'surgery', 'allergy', 'vaccination', 'medication'])
        .withMessage('Invalid event type'),
      
      body('condition')
        .notEmpty()
        .withMessage('Condition/procedure name is required')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Condition must be between 2 and 200 characters'),
      
      body('diagnosedDate')
        .notEmpty()
        .withMessage('Diagnosed date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
      
      body('status')
        .optional()
        .isIn(['active', 'resolved', 'chronic'])
        .withMessage('Status must be active, resolved, or chronic'),
      
      body('doctor')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Doctor name must not exceed 100 characters'),
      
      body('hospital')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Hospital name must not exceed 100 characters'),
      
      body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for chronic condition
   */
  chronicCondition() {
    return [
      body('condition')
        .notEmpty()
        .withMessage('Condition is required')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Condition must be between 2 and 200 characters'),
      
      body('diagnosedDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
      
      body('currentMedication')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Current medication must not exceed 500 characters'),
      
      body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for allergy
   */
  allergy() {
    return [
      body('allergen')
        .notEmpty()
        .withMessage('Allergen is required')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Allergen must be between 2 and 100 characters'),
      
      body('allergyType')
        .notEmpty()
        .withMessage('Allergy type is required')
        .isIn(['medication', 'food', 'environmental'])
        .withMessage('Allergy type must be medication, food, or environmental'),
      
      body('severity')
        .optional()
        .isIn(['mild', 'moderate', 'severe'])
        .withMessage('Severity must be mild, moderate, or severe'),
      
      body('reaction')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reaction description must not exceed 500 characters'),
      
      body('diagnosedDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for surgery
   */
  surgery() {
    return [
      body('procedureName')
        .notEmpty()
        .withMessage('Procedure name is required')
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage('Procedure name must be between 2 and 200 characters'),
      
      body('surgeryDate')
        .notEmpty()
        .withMessage('Surgery date is required')
        .isISO8601()
        .withMessage('Invalid date format'),
      
      body('hospital')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Hospital name must not exceed 100 characters'),
      
      body('surgeon')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Surgeon name must not exceed 100 characters'),
      
      body('notes')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must not exceed 1000 characters'),
      
      this.handleValidationErrors
    ];
  }

  /**
   * Validation rules for vaccination
   */
  vaccination() {
    return [
      body('vaccineName')
        .notEmpty()
        .withMessage('Vaccine name is required')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Vaccine name must be between 2 and 100 characters'),
      
      body('dateAdministered')
        .notEmpty()
        .withMessage('Date administered is required')
        .isISO8601()
        .withMessage('Invalid date format'),
      
      body('nextDueDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
      
      body('administeredBy')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Administered by must not exceed 100 characters'),
      
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

module.exports = new PatientValidator();
