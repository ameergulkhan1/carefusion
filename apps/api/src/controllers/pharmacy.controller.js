const Pharmacy = require('../models/Pharmacy');
const Medicine = require('../models/Medicine');
const MedicineOrder = require('../models/MedicineOrder');
const Prescription = require('../models/Prescription');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

// Helper function to ensure pharmacy profile exists
const ensurePharmacyProfile = async (userId) => {
  let pharmacy = await Pharmacy.findOne({ user: userId });
  
  if (!pharmacy) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');
    
    pharmacy = await Pharmacy.create({
      user: userId,
      pharmacyName: user.fullName || 'Pharmacy',
      inventory: [],
      isVerified: false
    });
  }
  
  return pharmacy;
};

// @desc    Get verified pharmacy directory
// @route   GET /api/pharmacy/directory
// @access  Private
exports.getPharmacyDirectory = asyncHandler(async (req, res) => {
  const pharmacies = await Pharmacy.find({ isVerified: true })
    .select('pharmacyName address deliveryAvailable deliveryRadius deliveryCharge minOrderValue rating')
    .sort({ pharmacyName: 1 })
    .lean();

  res.json({ success: true, data: pharmacies });
});

// @desc    Get medicine catalog for patients
// @route   GET /api/pharmacy/catalog
// @access  Private
exports.getMedicineCatalog = asyncHandler(async (req, res) => {
  const { search, category, pharmacyId, lowStock, limit = 200 } = req.query;

  const pharmacyQuery = { isVerified: true };
  if (pharmacyId) pharmacyQuery._id = pharmacyId;

  const pharmacies = await Pharmacy.find(pharmacyQuery)
    .populate('inventory.medicineId')
    .select('pharmacyName address deliveryAvailable deliveryRadius deliveryCharge minOrderValue inventory')
    .lean();

  const results = [];

  pharmacies.forEach((pharmacy) => {
    (pharmacy.inventory || []).forEach((item) => {
      const medicine = item.medicineId;
      if (!medicine) return;

      if (lowStock === 'false' && item.stock <= 0) return;

      const matchesSearch = !search ||
        medicine.name?.toLowerCase().includes(String(search).toLowerCase()) ||
        medicine.genericName?.toLowerCase().includes(String(search).toLowerCase()) ||
        medicine.manufacturer?.toLowerCase().includes(String(search).toLowerCase());

      const matchesCategory = !category || String(category).toLowerCase() === 'all' ||
        String(medicine.category || '').toLowerCase() === String(category).toLowerCase();

      if (!matchesSearch || !matchesCategory) return;

      results.push({
        _id: `${pharmacy._id}_${item._id || medicine._id}`,
        medicineId: medicine._id,
        pharmacyId: pharmacy._id,
        pharmacyName: pharmacy.pharmacyName,
        deliveryAvailable: pharmacy.deliveryAvailable,
        deliveryCharge: pharmacy.deliveryCharge,
        minOrderValue: pharmacy.minOrderValue,
        name: medicine.name,
        genericName: medicine.genericName,
        manufacturer: medicine.manufacturer,
        category: medicine.category,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        description: medicine.description,
        prescriptionRequired: medicine.prescriptionRequired,
        stock: item.stock || 0,
        price: item.price || 0
      });
    });
  });

  results.sort((a, b) => {
    if (a.name === b.name) return a.price - b.price;
    return a.name.localeCompare(b.name);
  });

  res.json({ success: true, data: results.slice(0, Number(limit) || 200) });
});

// @desc    Get pharmacy dashboard statistics
// @route   GET /api/pharmacy/dashboard/stats
// @access  Private (Pharmacy)
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);

  const totalOrders = await MedicineOrder.countDocuments({ pharmacy: pharmacy._id });
  const pendingOrders = await MedicineOrder.countDocuments({ pharmacy: pharmacy._id, status: 'pending' });
  const completedOrders = await MedicineOrder.countDocuments({ pharmacy: pharmacy._id, status: 'delivered' });

  const totalPrescriptions = await Prescription.countDocuments({ pharmacyId: pharmacy._id });
  const pendingPrescriptions = await Prescription.countDocuments({ 
    pharmacyId: pharmacy._id,
    status: { $in: ['active', 'pending', 'processing', 'ready'] }
  });

  const totalItems = pharmacy.inventory.length;
  const lowStockItems = pharmacy.inventory.filter(item => item.stock < 10).length;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const revenueData = await MedicineOrder.aggregate([
    { $match: { pharmacy: pharmacy._id, status: 'delivered', createdAt: { $gte: thirtyDaysAgo } } },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ]);

  const monthlyRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

  res.json({
    success: true,
    data: {
      orders: { total: totalOrders, pending: pendingOrders, completed: completedOrders },
      prescriptions: { total: totalPrescriptions, pending: pendingPrescriptions },
      inventory: { total: totalItems, lowStock: lowStockItems },
      revenue: { monthly: monthlyRevenue }
    }
  });
});

// @desc    Get prescriptions for pharmacy
// @route   GET /api/pharmacy/prescriptions
// @access  Private (Pharmacy)
exports.getPrescriptions = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  const { status, startDate, endDate } = req.query;
  
  const query = { pharmacyId: pharmacy._id };
  if (status) {
    const statuses = String(status).split(',').map((s) => s.trim()).filter(Boolean);
    query.status = statuses.length > 1 ? { $in: statuses } : statuses[0];
  }
  if (startDate && endDate) {
    query.prescriptionDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const prescriptions = await Prescription.find(query)
    .populate({ path: 'patientId', populate: { path: 'user', select: 'fullName email phone' } })
    .populate({ path: 'doctorId', populate: { path: 'user', select: 'fullName email phone' } })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({ success: true, data: prescriptions });
});

// @desc    Get prescription by ID
// @route   GET /api/pharmacy/prescriptions/:id
// @access  Private (Pharmacy)
exports.getPrescriptionById = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);

  const prescription = await Prescription.findOne({ _id: req.params.id, pharmacyId: pharmacy._id })
    .populate({ path: 'patientId', populate: { path: 'user', select: 'fullName email phone address' } })
    .populate({ path: 'doctorId', populate: { path: 'user', select: 'fullName email phone' } })
    .populate('pharmacyId', 'pharmacyName address phone');

  if (!prescription) {
    return res.status(404).json({ success: false, message: 'Prescription not found' });
  }

  res.json({ success: true, data: prescription });
});

// @desc    Update prescription status
// @route   PATCH /api/pharmacy/prescriptions/:id/status
// @access  Private (Pharmacy)
exports.updatePrescriptionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const pharmacy = await ensurePharmacyProfile(req.user.userId);

  const prescription = await Prescription.findOne({ _id: req.params.id, pharmacyId: pharmacy._id });
  if (!prescription) {
    return res.status(404).json({ success: false, message: 'Prescription not found' });
  }

  prescription.status = status;
  await prescription.save();

  res.json({ success: true, message: 'Prescription status updated', data: prescription });
});

// @desc    Get inventory
// @route   GET /api/pharmacy/inventory
// @access  Private (Pharmacy)
exports.getInventory = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  await pharmacy.populate('inventory.medicineId'); // ✅ FIXED: Populate medicine names

  const { lowStock } = req.query;
  let inventory = pharmacy.inventory;

  if (lowStock === 'true') {
    inventory = inventory.filter(item => item.stock < 10);
  }

  res.json({ success: true, data: inventory });
});

// @desc    Get inventory item by ID
// @route   GET /api/pharmacy/inventory/:id
// @access  Private (Pharmacy)
exports.getInventoryItem = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  await pharmacy.populate('inventory.medicineId');

  const item = pharmacy.inventory.id(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  res.json({ success: true, data: item });
});

// @desc    Add inventory item
// @route   POST /api/pharmacy/inventory
// @access  Private (Pharmacy)
exports.addInventoryItem = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  const { name, genericName, manufacturer, category, dosageForm, strength, stock, price, description } = req.body;

  let medicine = await Medicine.findOne({ name, manufacturer, strength });
  if (!medicine) {
    medicine = await Medicine.create({
      name, genericName, manufacturer, category, dosageForm, strength, description, prescriptionRequired: true
    });
  }

  pharmacy.inventory.push({ medicineId: medicine._id, stock: stock || 0, price: price || 0 });
  await pharmacy.save();
  await pharmacy.populate('inventory.medicineId');

  res.status(201).json({
    success: true,
    message: 'Inventory item added successfully',
    data: pharmacy.inventory[pharmacy.inventory.length - 1]
  });
});

// @desc    Update inventory item
// @route   PUT /api/pharmacy/inventory/:id
// @access  Private (Pharmacy)
exports.updateInventoryItem = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  const item = pharmacy.inventory.id(req.params.id);
  
  if (!item) {
    return res.status(404).json({ success: false, message: 'Inventory item not found' });
  }

  const { stock, price } = req.body;
  if (stock !== undefined) item.stock = stock;
  if (price !== undefined) item.price = price;

  await pharmacy.save();
  await pharmacy.populate('inventory.medicineId');

  res.json({ success: true, message: 'Inventory item updated', data: item });
});

// @desc    Delete inventory item
// @route   DELETE /api/pharmacy/inventory/:id
// @access  Private (Pharmacy)
exports.deleteInventoryItem = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  pharmacy.inventory.pull(req.params.id);
  await pharmacy.save();

  res.json({ success: true, message: 'Inventory item deleted' });
});

// @desc    Get low stock items
// @route   GET /api/pharmacy/inventory/low-stock
// @access  Private (Pharmacy)
exports.getLowStockItems = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  await pharmacy.populate('inventory.medicineId'); // ✅ FIXED

  const lowStockItems = pharmacy.inventory.filter(item => item.stock < 10);
  res.json({ success: true, data: lowStockItems });
});

// @desc    Get medicine orders
// @route   GET /api/pharmacy/orders
// @access  Private (Pharmacy)
exports.getOrders = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  const { status, startDate, endDate, page = 1, limit = 20 } = req.query;
  
  const query = { pharmacy: pharmacy._id };
  if (status) query.status = status;
  if (startDate && endDate) {
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const orders = await MedicineOrder.find(query)
    .populate({ path: 'patient', populate: { path: 'user', select: 'fullName email phone' } })
    .populate('items.medicine', 'name manufacturer strength')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();

  // ✅ SAFE FALLBACKS
  const safeOrders = orders.map((order) => {
    if (!order.patient || !order.patient.user) {
      order.patient = {
        _id: null,
        user: { fullName: 'Deleted User', email: 'N/A', phone: order.contactPhone || 'N/A' }
      };
    }
    order.items = (order.items || []).map((item) => ({
      ...item,
      medicine: item.medicine || { _id: null, name: item.name || 'Deleted Medicine', manufacturer: 'N/A', strength: 'N/A' }
    }));
    return order;
  });

  const total = await MedicineOrder.countDocuments(query);

  res.json({
    success: true,
    data: safeOrders,
    pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
  });
});

// @desc    Get order by ID
// @route   GET /api/pharmacy/orders/:id
// @access  Private (Pharmacy)
exports.getOrderById = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);

  const order = await MedicineOrder.findOne({ _id: req.params.id, pharmacy: pharmacy._id })
    .populate({ path: 'patient', populate: { path: 'user', select: 'fullName email phone' } })
    .populate('pharmacy', 'pharmacyName address phone')
    .populate('items.medicine', 'name manufacturer strength dosageForm');

  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found or does not belong to your pharmacy' });
  }

  // ✅ SAFE FALLBACKS
  const orderData = order.toObject();
  if (!orderData.patient || !orderData.patient.user) {
    orderData.patient = {
      _id: null,
      user: { fullName: 'Deleted User', email: 'N/A', phone: orderData.contactPhone || 'N/A' }
    };
  }
  orderData.items = (orderData.items || []).map((item) => ({
    ...item,
    medicine: item.medicine || { _id: null, name: item.name || 'Deleted Medicine', manufacturer: 'N/A', strength: 'N/A', dosageForm: 'N/A' }
  }));

  res.json({ success: true, data: orderData });
});

// @desc    Update order status
// @route   PATCH /api/pharmacy/orders/:id/status
// @access  Private (Pharmacy)
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, trackingNumber, estimatedDelivery, note } = req.body;
  const pharmacy = await ensurePharmacyProfile(req.user.userId);

  const order = await MedicineOrder.findOne({ _id: req.params.id, pharmacy: pharmacy._id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (estimatedDelivery) order.estimatedDelivery = estimatedDelivery;
  if (status === 'delivered') order.actualDelivery = new Date();

  if (status === 'cancelled' && !order.cancelReason && note) {
    order.cancelReason = note;
    const pharmacyDoc = await Pharmacy.findById(order.pharmacy);
    if (pharmacyDoc) {
      (order.items || []).forEach((orderItem) => {
        const inventoryItem = pharmacyDoc.inventory.find((inv) => String(inv.medicineId) === String(orderItem.medicine));
        if (inventoryItem) inventoryItem.stock = (inventoryItem.stock || 0) + (orderItem.quantity || 0);
      });
      await pharmacyDoc.save();
    }
  }

  order.statusHistory.push({ status, note, updatedBy: req.user.userId, timestamp: new Date() });
  await order.save();

  res.json({ success: true, message: 'Order status updated', data: order });
});

// @desc    Search medicines
// @route   GET /api/pharmacy/medicines/search
// @access  Private
exports.searchMedicines = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ success: false, message: 'Search query required' });

  const medicines = await Medicine.find({
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { genericName: { $regex: q, $options: 'i' } },
      { manufacturer: { $regex: q, $options: 'i' } }
    ]
  }).limit(20);

  res.json({ success: true, data: medicines });
});

// @desc    Get medicine by ID
// @route   GET /api/pharmacy/medicines/:id
// @access  Private
exports.getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await Medicine.findById(req.params.id);
  if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
  res.json({ success: true, data: medicine });
});

// @desc    Get sales report
// @route   GET /api/pharmacy/analytics/sales
// @access  Private (Pharmacy)
exports.getSalesReport = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);
  const { startDate, endDate } = req.query;

  const report = await MedicineOrder.aggregate([
    { $match: { pharmacy: pharmacy._id, status: 'delivered', createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, totalSales: { $sum: '$total' }, orderCount: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]);

  res.json({ success: true, data: report });
});

// @desc    Get inventory report
// @route   GET /api/pharmacy/analytics/inventory
// @access  Private (Pharmacy)
exports.getInventoryReport = asyncHandler(async (req, res) => {
  const pharmacy = await ensurePharmacyProfile(req.user.userId);

  const report = {
    totalItems: pharmacy.inventory.length,
    totalValue: pharmacy.inventory.reduce((sum, item) => sum + (item.stock * item.price), 0),
    lowStockItems: pharmacy.inventory.filter(item => item.stock < 10).length,
    outOfStock: pharmacy.inventory.filter(item => item.stock === 0).length,
    byCategory: {}
  };

  res.json({ success: true, data: report });
});