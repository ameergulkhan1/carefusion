const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth');
const pharmacyController = require('../controllers/pharmacy.controller');

// Dashboard
router.get('/dashboard/stats', protect, restrictTo('pharmacy'), pharmacyController.getDashboardStats);

// Patient-facing catalog endpoints
router.get('/catalog', protect, pharmacyController.getMedicineCatalog);
router.get('/directory', protect, pharmacyController.getPharmacyDirectory);

// Prescriptions
router.get('/prescriptions', protect, restrictTo('pharmacy'), pharmacyController.getPrescriptions);
router.get('/prescriptions/:id', protect, restrictTo('pharmacy'), pharmacyController.getPrescriptionById);
router.patch('/prescriptions/:id/status', protect, restrictTo('pharmacy'), pharmacyController.updatePrescriptionStatus);

// Inventory Management
router.get('/inventory/low-stock', protect, restrictTo('pharmacy'), pharmacyController.getLowStockItems);
router.get('/inventory', protect, restrictTo('pharmacy'), pharmacyController.getInventory);
router.get('/inventory/:id', protect, restrictTo('pharmacy'), pharmacyController.getInventoryItem);
router.post('/inventory', protect, restrictTo('pharmacy'), pharmacyController.addInventoryItem);
router.put('/inventory/:id', protect, restrictTo('pharmacy'), pharmacyController.updateInventoryItem);
router.delete('/inventory/:id', protect, restrictTo('pharmacy'), pharmacyController.deleteInventoryItem);

// Orders Management
router.get('/orders', protect, restrictTo('pharmacy'), pharmacyController.getOrders);
router.get('/orders/:id', protect, restrictTo('pharmacy'), pharmacyController.getOrderById);
router.patch('/orders/:id/status', protect, restrictTo('pharmacy'), pharmacyController.updateOrderStatus);

// Medicine Search
router.get('/medicines/search', protect, pharmacyController.searchMedicines);
router.get('/medicines/:id', protect, pharmacyController.getMedicineById);

// Analytics
router.get('/analytics/sales', protect, restrictTo('pharmacy'), pharmacyController.getSalesReport);
router.get('/analytics/inventory', protect, restrictTo('pharmacy'), pharmacyController.getInventoryReport);

module.exports = router;
