const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passwordController = require('../controllers/passwordController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  validate
} = require('../middleware/validation');

// Public routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/google/firebase', authController.googleFirebaseAuth);
router.post('/refresh-token', authController.refreshToken);
router.get('/verify-email/:token', authController.verifyEmail);

// Password management routes (public)
router.post('/forgot-password', forgotPasswordValidation, validate, passwordController.forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, validate, passwordController.resetPassword);

// Protected routes - require authentication
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.post('/change-password', changePasswordValidation, validate, passwordController.changePassword);

module.exports = router;
