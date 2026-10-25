const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { protect } = require('../middleware/auth');
const { hasRole } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect);

// Public doctor endpoints (accessible by all authenticated users)
router.get(
  '/',
  doctorController.getAllDoctors
);

router.get(
  '/specializations',
  doctorController.getSpecializations
);

// Doctor-only routes
// Doctor profile routes
router.get(
  '/profile',
  hasRole('doctor'),
  doctorController.getProfile
);

router.put(
  '/profile',
  hasRole('doctor'),
  doctorController.updateProfile
);

// Dashboard stats
router.get(
  '/dashboard/stats',
  hasRole('doctor'),
  doctorController.getDashboardStats
);

router.get(
  '/activity',
  hasRole('doctor'),
  doctorController.getRecentActivity
);

// Patient routes (for doctor viewing patients)
router.get(
  '/patients',
  hasRole('doctor'),
  doctorController.getPatients
);

router.get(
  '/patients/:patientId',
  hasRole('doctor'),
  doctorController.getPatientById
);

router.get(
  '/patients/:patientId/medical-history',
  hasRole('doctor'),
  doctorController.getPatientMedicalHistory
);

// Appointment routes
router.get(
  '/appointments',
  hasRole('doctor'),
  doctorController.getAppointments
);

router.get(
  '/appointments/today',
  hasRole('doctor'),
  doctorController.getTodaysAppointments
);

router.get(
  '/appointments/:appointmentId',
  hasRole('doctor'),
  doctorController.getAppointmentById
);

router.patch(
  '/appointments/:appointmentId/status',
  hasRole('doctor'),
  doctorController.updateAppointmentStatus
);

router.post(
  '/appointments/:appointmentId/notes',
  hasRole('doctor'),
  doctorController.addConsultationNotes
);

router.get(
  '/:doctorId/available-slots',
  doctorController.getAvailableSlots
);

router.get(
  '/:doctorId',
  doctorController.getDoctorByIdPublic
);

module.exports = router;
