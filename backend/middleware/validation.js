const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be a valid 10-digit number'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Location must be between 2 and 200 characters'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('language')
    .optional()
    .isIn(['en', 'hi', 'te', 'ta', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'as'])
    .withMessage('Invalid language code'),
  handleValidationErrors
];

// User login validation
const validateLogin = [
  body('phone')
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be a valid 10-digit number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Change password validation
const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  handleValidationErrors
];

// Crop plan generation validation
const validateCropPlan = [
  body('soilType')
    .isIn(['clay', 'sandy', 'loamy', 'silty', 'peaty', 'chalky', 'unknown'])
    .withMessage('Invalid soil type'),
  body('landSize')
    .isFloat({ min: 0.1, max: 1000 })
    .withMessage('Land size must be between 0.1 and 1000 acres'),
  body('irrigation')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Irrigation method must be between 2 and 50 characters'),
  body('season')
    .isIn(['kharif', 'rabi', 'zaid', 'spring', 'summer', 'monsoon', 'autumn', 'winter', 'year-round'])
    .withMessage('Invalid season'),
  body('preferredLanguage')
    .optional()
    .isIn(['en', 'hi', 'te', 'ta', 'bn', 'mr', 'gu', 'kn', 'ml', 'or', 'pa', 'as'])
    .withMessage('Invalid language code'),
  body('additionalNotes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Additional notes cannot exceed 1000 characters'),
  handleValidationErrors
];

// Follow-up question validation
const validateFollowUp = [
  body('planId')
    .isMongoId()
    .withMessage('Invalid plan ID'),
  body('question')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Question must be between 1 and 500 characters'),
  handleValidationErrors
];

// Diagnosis follow-up question validation
const validateDiagnosisFollowUp = [
  body('diagnosisId')
    .isMongoId()
    .withMessage('Invalid diagnosis ID'),
  body('question')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Question must be between 1 and 1000 characters'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

// ObjectId validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateChangePassword,
  validateCropPlan,
  validateFollowUp,
  validateDiagnosisFollowUp,
  validatePagination,
  validateObjectId,
  handleValidationErrors
};
