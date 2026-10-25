const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const medicalRecordController = require('../controllers/medicalRecord.controller');
const prescriptionController = require('../controllers/prescription.controller');
const patientValidator = require('../validators/patient.validator');
const medicalRecordValidator = require('../validators/medicalRecord.validator');
const { uploadSingle, handleUploadError } = require('../middleware/upload.middleware');
const { protect } = require('../middleware/auth');
const { hasRole } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect);

// Patient profile routes
router.get(
  '/profile',
  hasRole('patient'),
  patientController.getProfile
);

router.put(
  '/profile',
  hasRole('patient'),
  patientValidator.updateProfile(),
  patientController.updateProfile
);

router.get(
  '/stats',
  hasRole('patient'),
  patientController.getStats
);

// Medical history routes
router.get(
  '/medical-history',
  hasRole('patient', 'doctor', 'lab', 'laboratory', 'admin'),
  patientController.getMedicalHistory
);

router.post(
  '/medical-history',
  hasRole('patient', 'doctor'),
  patientValidator.medicalHistoryEntry(),
  patientController.addMedicalHistory
);

router.put(
  '/medical-history/:id',
  hasRole('patient', 'doctor'),
  patientValidator.validateObjectId(),
  patientValidator.medicalHistoryEntry(),
  patientController.updateMedicalHistory
);

router.delete(
  '/medical-history/:id',
  hasRole('patient', 'doctor'),
  patientValidator.validateObjectId(),
  patientController.deleteMedicalHistory
);

// Chronic conditions routes
router.post(
  '/chronic-conditions',
  hasRole('patient', 'doctor'),
  patientValidator.chronicCondition(),
  patientController.addChronicCondition
);

// Allergies routes
router.post(
  '/allergies',
  hasRole('patient', 'doctor'),
  patientValidator.allergy(),
  patientController.addAllergy
);

// Surgeries routes
router.post(
  '/surgeries',
  hasRole('patient', 'doctor'),
  patientValidator.surgery(),
  patientController.addSurgery
);

// Vaccinations routes
router.post(
  '/vaccinations',
  hasRole('patient', 'doctor'),
  patientValidator.vaccination(),
  patientController.addVaccination
);

// Prescriptions routes
router.get(
  '/prescriptions',
  hasRole('patient'),
  prescriptionController.getPrescriptions
);

router.get(
  '/prescriptions/:id',
  hasRole('patient'),
  prescriptionController.getPrescriptionById
);

// Medical records routes
router.get(
  '/records',
  hasRole('patient', 'doctor'),
  medicalRecordValidator.queryFilters(),
  medicalRecordController.getMedicalRecords
);

router.get(
  '/records/recent',
  hasRole('patient', 'doctor'),
  medicalRecordController.getRecentMedicalRecords
);

router.get(
  '/records/type/:type',
  hasRole('patient', 'doctor'),
  medicalRecordValidator.getByType(),
  medicalRecordController.getMedicalRecordsByType
);

router.get(
  '/records/:id',
  hasRole('patient', 'doctor'),
  medicalRecordValidator.validateObjectId(),
  medicalRecordController.getMedicalRecordById
);

router.post(
  '/records',
  hasRole('patient', 'doctor'),
  uploadSingle,
  handleUploadError,
  medicalRecordValidator.uploadRecord(),
  medicalRecordController.uploadMedicalRecord
);

router.put(
  '/records/:id',
  hasRole('patient', 'doctor'),
  medicalRecordValidator.validateObjectId(),
  medicalRecordValidator.updateRecord(),
  medicalRecordController.updateMedicalRecord
);

router.delete(
  '/records/:id',
  hasRole('patient'),
  medicalRecordValidator.validateObjectId(),
  medicalRecordController.deleteMedicalRecord
);

router.post(
  '/records/:id/share',
  hasRole('patient'),
  medicalRecordValidator.validateObjectId(),
  medicalRecordValidator.shareRecord(),
  medicalRecordController.shareMedicalRecord
);

router.get(
  '/records/:id/download',
  hasRole('patient', 'doctor'),
  medicalRecordValidator.validateObjectId(),
  medicalRecordController.downloadMedicalRecord
);

// Medicine orders routes
router.post(
  '/medicine-orders',
  hasRole('patient'),
  patientController.createMedicineOrder
);

router.get(
  '/medicine-orders',
  hasRole('patient'),
  patientController.getMedicineOrders
);

router.get(
  '/medicine-orders/:id',
  hasRole('patient'),
  patientController.getMedicineOrderById
);

router.patch(
  '/medicine-orders/:id/cancel',
  hasRole('patient'),
  patientController.cancelMedicineOrder
);

module.exports = router;
