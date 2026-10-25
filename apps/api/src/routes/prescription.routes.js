const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const { protect } = require('../middleware/auth');
const { hasRole } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect);

router.get(
  '/pharmacies',
  hasRole('patient', 'doctor'),
  prescriptionController.getAvailablePharmacies
);

// Get all prescriptions for logged-in patient
router.get(
  '/',
  hasRole('patient', 'doctor', 'pharmacy'),
  prescriptionController.getPrescriptions
);

// Get specific prescription
router.get(
  '/:id',
  hasRole('patient', 'doctor', 'pharmacy'),
  prescriptionController.getPrescriptionById
);

// Create prescription (doctor only)
router.post(
  '/',
  hasRole('doctor'),
  prescriptionController.createPrescription
);

// Update prescription (doctor only)
router.put(
  '/:id',
  hasRole('doctor'),
  prescriptionController.updatePrescription
);

// Mark prescription as dispensed (pharmacy only)
router.patch(
  '/:id/dispense',
  hasRole('pharmacy'),
  prescriptionController.markAsDispensed
);

router.patch(
  '/:id/send-to-pharmacy',
  hasRole('patient', 'doctor'),
  prescriptionController.sendToPharmacy
);

router.patch(
  '/:id/refill',
  hasRole('patient'),
  prescriptionController.requestRefill
);

router.patch(
  '/:id/renew',
  hasRole('doctor'),
  prescriptionController.renewPrescription
);

module.exports = router;
