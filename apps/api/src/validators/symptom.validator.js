const { body, validationResult } = require('express-validator');

const validateSymptomCheck = [
  body('symptoms')
    .isArray({ min: 2 })
    .withMessage('At least 2 symptoms are required')
    .custom((value) => {
      if (value.length > 20) {
        throw new Error('Maximum 20 symptoms allowed');
      }
      return true;
    }),
  
  body('symptoms.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Each symptom must be a valid string'),
  
  body('symptomOnset')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format for symptom onset'),
  
  body('overallSeverity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Severity must be between 1 and 10'),
  
  body('recentTravel')
    .optional()
    .isBoolean()
    .withMessage('Recent travel must be a boolean'),
  
  body('travelDestination')
    .optional()
    .isString()
    .trim(),
  
  body('existingConditions')
    .optional()
    .isArray()
    .withMessage('Existing conditions must be an array'),
  
  body('currentMedications')
    .optional()
    .isString()
    .trim(),
  
  body('temperature')
    .optional()
    .isFloat({ min: 35, max: 45 })
    .withMessage('Temperature must be between 35°C and 45°C'),
  
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Age must be between 0 and 150'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  
  body('locationContext.city')
    .optional()
    .isString()
    .trim(),
  
  body('locationContext.seasonalFactor')
    .optional()
    .isIn(['summer', 'winter', 'monsoon', 'spring'])
    .withMessage('Invalid seasonal factor'),
  
  // Validation result handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateSymptomCheck
};
