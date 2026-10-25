const express = require('express');
const router = express.Router();
const laboratoryController = require('../controllers/laboratory.controller');
const { protect } = require('../middleware/auth');
const { hasRole } = require('../middleware/roleCheck');

// Test management routes
router.get('/tests', protect, laboratoryController.getAllTests);
router.get('/tests/categories', protect, laboratoryController.getTestCategories);
router.get('/tests/:id', protect, laboratoryController.getTestById);
router.get('/labs', protect, laboratoryController.getAvailableLabs);

// Search route - must be before specific routes
router.get('/search', protect, laboratoryController.searchLabsByTest);

// Order management routes
router.post('/orders', protect, laboratoryController.createOrder);
router.get('/orders', protect, laboratoryController.getPatientOrders);
router.get('/orders/:id', protect, laboratoryController.getOrderById);
router.put('/orders/:id/cancel', protect, laboratoryController.cancelOrder);

// Laboratory (lab role) operational routes
router.get('/lab/orders', protect, hasRole('lab', 'laboratory', 'admin'), laboratoryController.getLabOrders);
router.patch('/lab/orders/:id/status', protect, hasRole('lab', 'laboratory', 'admin'), laboratoryController.updateOrderStatus);
router.post('/lab/orders/:orderId/tests/:testId/result', protect, hasRole('lab', 'laboratory', 'admin'), laboratoryController.publishTestResult);

// Lab Catalog Management routes (lab staff only)
router.get('/catalog', protect, hasRole('lab', 'laboratory'), laboratoryController.getLabCatalog);
router.post('/catalog', protect, hasRole('lab', 'laboratory'), laboratoryController.addTestToCatalog);
router.put('/catalog/:testId', protect, hasRole('lab', 'laboratory'), laboratoryController.updateTestInCatalog);
router.delete('/catalog/:testId', protect, hasRole('lab', 'laboratory'), laboratoryController.removeTestFromCatalog);

// Results routes
router.get('/results', protect, laboratoryController.getPatientResults);
router.get('/results/:id', protect, laboratoryController.getResultById);
router.get('/results/:id/download', protect, laboratoryController.downloadReport);

// Admin Lab Approval Management routes
router.get('/admin/approvals', protect, hasRole('admin'), laboratoryController.getPendingLabApprovals);
router.post('/admin/labs/:labUserId/approve', protect, hasRole('admin'), laboratoryController.approveLab);
router.post('/admin/labs/:labUserId/reject', protect, hasRole('admin'), laboratoryController.rejectLab);
router.get('/admin/labs/:labId', protect, hasRole('admin'), laboratoryController.getLabDetails);

// Lab profile route (for authenticated labs to view their own details)
router.get('/profile', protect, hasRole('lab', 'laboratory'), laboratoryController.getLabDetails);

module.exports = router;
