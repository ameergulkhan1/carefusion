const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointment.controller');
const { protect } = require('../middleware/auth');
const { hasRole } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect);

// Get all appointments for logged-in patient
router.get(
  '/',
  hasRole('patient'),
  appointmentController.getAppointments
);

// Get specific appointment
router.get(
  '/:id',
  hasRole('patient', 'doctor'),
  appointmentController.getAppointmentById
);

// Book new appointment
router.post(
  '/',
  hasRole('patient'),
  appointmentController.bookAppointment
);

// Update appointment
router.put(
  '/:id',
  hasRole('patient'),
  appointmentController.updateAppointment
);

// Cancel appointment
router.patch(
  '/:id/cancel',
  hasRole('patient'),
  appointmentController.cancelAppointment
);

// Send message to doctor about appointment
router.post(
  '/:id/messages',
  hasRole('patient', 'doctor'),
  appointmentController.sendMessage
);

// Get appointment messages
router.get(
  '/:id/messages',
  hasRole('patient', 'doctor'),
  appointmentController.getMessages
);

module.exports = router;
