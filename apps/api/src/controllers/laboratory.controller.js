const Lab = require('../models/Lab');
const LabTest = require('../models/LabTest');
const LabOrder = require('../models/LabOrder');
const LabResult = require('../models/LabResult');
const Patient = require('../models/Patient.model');
const MedicalRecord = require('../models/MedicalRecord.model');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

const getAuthenticatedUserId = (req) => req.user?.userId || req.user?.id;

const getLabForUser = async (userId) => {
  let lab = await Lab.findOne({ $or: [{ user: userId }, { userId }] });

  if (!lab) {
    const user = await User.findById(userId).select('fullName role');
    if (user && (user.role === 'lab' || user.role === 'laboratory')) {
      lab = await Lab.create({
        user: user._id,
        userId: user._id,
        labName: user.fullName || 'Laboratory',
        testCatalog: [],
        isVerified: false
      });
    }
  }

  return lab;
};

const buildTestFilter = async (query = {}) => {
  const { category, search, isActive = true, laboratoryId } = query;
  const filter = { isActive: String(isActive) !== 'false' };

  if (category && category !== 'all') filter.category = category;
  if (search) filter.$text = { $search: search };

  if (laboratoryId) {
    const lab = await Lab.findById(laboratoryId).select('testCatalog');
    if (!lab) return { error: 'Selected laboratory not found' };

    const ids = (lab.testCatalog || []).map((entry) => entry.testId).filter(Boolean);
    if (ids.length > 0) filter._id = { $in: ids };
    else filter.availableAt = laboratoryId;
  }

  return { filter };
};

const applyLabPricing = (tests, lab) => {
  if (!lab) return tests;
  const priceMap = new Map(
    (lab.testCatalog || []).filter((entry) => entry.testId).map((entry) => [String(entry.testId), { price: entry.price, turnaroundTime: entry.turnaroundTime }])
  );
  return tests.map((test) => {
    const override = priceMap.get(String(test._id));
    if (!override) return test;
    return { ...test, price: override.price ?? test.price, turnaroundTime: override.turnaroundTime || test.turnaroundTime };
  });
};

const pushStatusHistory = (order, status, updatedBy, note = '') => {
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ status, updatedBy, note, updatedAt: new Date() });
};

const updateEmbeddedTestStatuses = (order, orderStatus) => {
  const statusMap = { scheduled: 'pending', 'in-progress': 'processing', completed: 'completed', cancelled: 'cancelled' };
  const testStatus = statusMap[orderStatus] || 'pending';
  order.tests.forEach((test) => {
    if (test.status !== 'completed' || testStatus === 'cancelled') test.status = testStatus;
  });
};

const buildLabLocation = (lab) => {
  const address = lab?.address || {};
  return [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ');
};

exports.getAllTests = async (req, res) => {
  try {
    const { filter, error } = await buildTestFilter(req.query);
    if (error) return res.status(404).json({ success: false, message: error });
    let tests = await LabTest.find(filter).sort({ category: 1, testName: 1 }).lean();
    if (req.query.laboratoryId) {
      const lab = await Lab.findById(req.query.laboratoryId).select('testCatalog');
      tests = applyLabPricing(tests, lab);
    }
    res.json({ success: true, data: tests, count: tests.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch lab tests', error: error.message });
  }
};

exports.getAvailableLabs = async (req, res) => {
  try {
    const { city, state } = req.query;
    const query = {};
    if (city) query['address.city'] = new RegExp(`^${city}$`, 'i');
    if (state) query['address.state'] = new RegExp(`^${state}$`, 'i');

    const labs = await Lab.find(query).populate('user', 'fullName email phone').select('labName address homeSampleCollection rating isVerified user').sort({ isVerified: -1, labName: 1 }).lean();
    res.json({ success: true, data: labs.map((lab) => ({ _id: lab._id, labName: lab.labName || lab.user?.fullName || 'Unnamed Laboratory', isVerified: Boolean(lab.isVerified), address: lab.address, location: buildLabLocation(lab), homeSampleCollection: lab.homeSampleCollection, rating: lab.rating, contactName: lab.user?.fullName, email: lab.user?.email, phone: lab.user?.phone })) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch laboratories', error: error.message });
  }
};

exports.getTestCategories = async (req, res) => {
  try {
    const categories = await LabTest.distinct('category', { isActive: true });
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
  }
};

exports.getTestById = async (req, res) => {
  try {
    const test = await LabTest.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    res.json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch test', error: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { tests, appointmentDate, sampleCollectionType, homeCollectionAddress, specialInstructions, laboratoryId, paymentMethod } = req.body;
    let patient = await Patient.findOne({ user: userId });

    if (!patient) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      patient = await Patient.create({ user: userId, patientId: `PAT-${Date.now()}`, firstName: user.firstName || user.fullName?.split(' ')[0] || '', lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '', phone: user.phone || '', email: user.email || '' });
    }

    if (!Array.isArray(tests) || tests.length === 0) return res.status(400).json({ success: false, message: 'At least one test is required' });
    if (!laboratoryId) return res.status(400).json({ success: false, message: 'Please select a laboratory' });

    const laboratory = await Lab.findById(laboratoryId).select('labName homeSampleCollection testCatalog isVerified');
    if (!laboratory) return res.status(404).json({ success: false, message: 'Selected laboratory not found' });
    if (sampleCollectionType === 'home-collection' && !laboratory.homeSampleCollection?.available) return res.status(400).json({ success: false, message: 'Selected laboratory does not support home collection' });

    const testDetails = await LabTest.find({ _id: { $in: tests } }).lean();
    if (testDetails.length !== tests.length) return res.status(400).json({ success: false, message: 'Some tests were not found' });

    const catalogMap = new Map((laboratory.testCatalog || []).filter((entry) => entry.testId).map((entry) => [String(entry.testId), entry]));
    const orderTests = testDetails.map((test) => {
      const catalog = catalogMap.get(String(test._id));
      return { testId: test._id, testName: test.testName, testCode: test.testCode, price: catalog?.price ?? test.price, status: 'pending' };
    });

    const totalAmount = orderTests.reduce((sum, test) => sum + Number(test.price || 0), 0);
    const date = new Date();
    const orderNumber = `LAB-${date.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    const order = new LabOrder({ orderNumber, patient: patient._id, laboratory: laboratory._id, tests: orderTests, appointmentDate, sampleCollectionType, homeCollectionAddress, totalAmount, paymentMethod, specialInstructions, orderStatus: 'scheduled', statusHistory: [{ status: 'scheduled', note: 'Order created by patient', updatedBy: userId, updatedAt: new Date() }] });
    await order.save();

    const populatedOrder = await LabOrder.findById(order._id).populate('laboratory', 'labName address user').populate({ path: 'laboratory', populate: { path: 'user', select: 'fullName email phone' } }).lean();
    res.status(201).json({ success: true, message: 'Lab test order created successfully', data: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create lab order', error: error.message });
  }
};

exports.getPatientOrders = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    let patient = await Patient.findOne({ user: userId });

    if (!patient) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      patient = await Patient.create({ user: userId, patientId: `PAT-${Date.now()}`, firstName: user.firstName || user.fullName?.split(' ')[0] || '', lastName: user.lastName || user.fullName?.split(' ').slice(1).join(' ') || '', phone: user.phone || '', email: user.email || '' });
      return res.json({ success: true, data: [], count: 0, message: 'Patient profile created. No orders yet.' });
    }

    const { status } = req.query;
    const query = { patient: patient._id };
    if (status) query.orderStatus = status;

    const orders = await LabOrder.find(query).populate('tests.testId', 'testName testCode category').populate('doctor', 'user').populate('laboratory', 'labName address user').populate({ path: 'laboratory', populate: { path: 'user', select: 'fullName email phone' } }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: error.message });
  }
};

exports.getLabOrders = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const lab = await getLabForUser(userId);
    if (!lab) return res.status(404).json({ success: false, message: 'Laboratory profile not found' });

    const { status } = req.query;
    const query = { laboratory: lab._id };
    if (status) query.orderStatus = status;

    const orders = await LabOrder.find(query).populate({ path: 'patient', populate: { path: 'user', select: 'fullName email phone' } }).populate('tests.testId', 'testName testCode category').sort({ createdAt: -1 }).limit(300).lean();
    res.json({ success: true, data: orders, count: orders.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch lab orders', error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    
    const order = await LabOrder.findById(req.params.id)
      .populate({ path: 'patient', populate: { path: 'user', select: 'fullName email phone' } })
      .populate('doctor')
      .populate('laboratory')
      .populate('tests.testId')
      .populate('tests.result')
      .lean();

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (!patient) return res.status(403).json({ success: false, message: 'Patient profile not found' });
      if ((order.patient?._id?.toString() || String(order.patient)) !== patient._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only view your own orders' });
      }
    } else if (req.user.role === 'lab' || req.user.role === 'laboratory') {
      const lab = await getLabForUser(userId);
      if (!lab) return res.status(403).json({ success: false, message: 'Lab profile not found' });
      if ((order.laboratory?._id?.toString() || String(order.laboratory)) !== lab._id.toString()) {
        return res.status(403).json({ success: false, message: 'You can only view orders for your laboratory' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { status, note } = req.body;

    if (!['scheduled', 'in-progress', 'completed', 'cancelled'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid order status' });

    const lab = await getLabForUser(userId);
    if (!lab) return res.status(404).json({ success: false, message: 'Laboratory profile not found' });

    const order = await LabOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (String(order.laboratory) !== String(lab._id)) return res.status(403).json({ success: false, message: 'Access denied for this order' });

    order.orderStatus = status;
    if (status === 'completed') order.completedAt = new Date();

    updateEmbeddedTestStatuses(order, status);
    pushStatusHistory(order, status, userId, note || `Order marked as ${status}`);
    await order.save();

    res.json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status', error: error.message });
  }
};

exports.getPatientResults = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const patient = await Patient.findOne({ user: userId });
    if (!patient) return res.json({ success: true, data: [], count: 0, message: 'No patient profile found' });

    const results = await LabResult.find({ patient: patient._id }).populate('test', 'testName testCode category').populate('order', 'orderNumber appointmentDate orderStatus statusHistory').sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
};

exports.getResultById = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await LabResult.findById(req.params.id).populate('test').populate('order').populate('patient', 'user').lean();
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (!patient || result.patient?._id?.toString() !== patient._id.toString()) return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch result', error: error.message });
  }
};

// ✅ FIXED: This now correctly handles the File Upload via req.file
exports.publishTestResult = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { orderId, testId } = req.params;
    
    // 1. Grab text fields from FormData
    const { overallResult = 'normal', remarks, markReported = true } = req.body;

    // 2. Verify Lab
    const lab = await getLabForUser(userId);
    if (!lab) return res.status(404).json({ success: false, message: 'Laboratory profile not found' });

    // 3. Verify Order
    const order = await LabOrder.findById(orderId).populate({ path: 'patient', populate: { path: 'user', select: 'fullName email phone' } });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (String(order.laboratory) !== String(lab._id)) return res.status(403).json({ success: false, message: 'Access denied for this order' });

    // 4. Find test
    const testEntry = order.tests.find((entry) => String(entry.testId) === String(testId));
    if (!testEntry) return res.status(404).json({ success: false, message: 'Test not found in order' });

    let result = await LabResult.findOne({ order: order._id, test: testEntry.testId });
    const now = new Date();
        // ✅ 5. HANDLE THE FILE UPLOAD
    let reportDocument = result?.reportDocument; 

    if (req.file) {
      // Normalize path for Windows/Linux URLs
      const normalizedPath = req.file.path.replace(/\\/g, '/');
      const relativePath = normalizedPath.includes('/uploads/') 
        ? normalizedPath.substring(normalizedPath.indexOf('/uploads/')) 
        : `/uploads/lab-reports/${req.file.filename}`;
      
      reportDocument = {
        url: relativePath,
        filename: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      };
    } else {
      // No file uploaded - return clear error
      return res.status(400).json({ 
        success: false, 
        message: 'No report file received. Please select a file to upload.' 
      });
    }
    // 6. Prepare Payload
    const resultPayload = {
      order: order._id,
      patient: order.patient._id,
      test: testEntry.testId,
      testName: testEntry.testName,
      testCode: testEntry.testCode,
      sampleCollectedAt: result?.sampleCollectedAt || now,
      processedAt: now,
      reportedAt: markReported ? now : result?.reportedAt,
      parameters: [], 
      overallResult,
      remarks,
      reportDocument, // ✅ Save the uploaded file info
      isVerified: true,
      notificationSent: false
    };

    if (result) {
      Object.assign(result, resultPayload);
      await result.save();
    } else {
      result = await LabResult.create(resultPayload);
    }

    // 7. Update Order
    testEntry.result = result._id;
    testEntry.status = markReported ? 'completed' : 'processing';

    const allCompleted = order.tests.every((entry) => entry.status === 'completed');
    if (allCompleted) {
      order.orderStatus = 'completed';
      order.completedAt = now;
      pushStatusHistory(order, 'completed', userId, 'All test results published');
    } else if (order.orderStatus === 'scheduled') {
      order.orderStatus = 'in-progress';
      pushStatusHistory(order, 'in-progress', userId, 'Result processing started');
    }
    await order.save();

    // 8. Medical Record Sync
    const reportUrl = result.reportDocument?.url || `/api/laboratory/results/${result._id}`;
    await MedicalRecord.findOneAndUpdate(
      { patient: order.patient._id, documentType: 'lab_report', 'metadata.testResults.resultId': result._id },
      {
        patient: order.patient._id,
        documentType: 'lab_report',
        documentUrl: reportUrl,
        documentDate: result.reportedAt || now,
        uploadedBy: userId,
        fileName: result.reportDocument?.filename || `${testEntry.testCode}-report.pdf`,
        fileSize: result.reportDocument?.size || 1024,
        mimeType: result.reportDocument?.mimeType || 'application/pdf',
        notes: remarks || `Lab report for ${testEntry.testName}`,
        tags: ['lab', testEntry.testCode, testEntry.testName],
        metadata: {
          hospitalName: lab.labName,
          testResults: { resultId: result._id, orderId: order._id, overallResult, testName: testEntry.testName, testCode: testEntry.testCode }
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 9. Notifications
    const io = req.app.get('io');
    const notificationService = new NotificationService(io);
    const patientUserId = order.patient?.user?._id || order.patient?.user;

    if (patientUserId) {
      await notificationService.notifyLabResult(String(patientUserId), { resultId: result._id, orderId: order._id, testName: testEntry.testName, overallResult, reportedAt: result.reportedAt });
    }

    const patientUser = await User.findById(patientUserId).select('fullName email');
    if (patientUser?.email) {
      await emailService.sendLabResultsReady({ fullName: patientUser.fullName, email: patientUser.email }, testEntry.testName);
    }

    result.notificationSent = true;
    await result.save();

    res.status(201).json({ success: true, message: 'Lab result published successfully', data: result });
  } catch (error) {
    console.error('Publish test result error:', error);
    res.status(500).json({ success: false, message: 'Failed to publish test result', error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { cancelReason } = req.body;
    const order = await LabOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (!patient || order.patient.toString() !== patient._id.toString()) return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (order.orderStatus === 'completed' || order.orderStatus === 'cancelled') return res.status(400).json({ success: false, message: 'Cannot cancel this order' });

    order.orderStatus = 'cancelled';
    order.cancelReason = cancelReason;
    order.tests.forEach((test) => { if (test.status !== 'completed') test.status = 'cancelled'; });
    pushStatusHistory(order, 'cancelled', userId, cancelReason || 'Order cancelled');
    await order.save();

    res.json({ success: true, message: 'Order cancelled successfully', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel order', error: error.message });
  }
};

exports.downloadReport = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const result = await LabResult.findById(req.params.id);
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    if (!result.reportDocument || !result.reportDocument.url) return res.status(404).json({ success: false, message: 'Report document not available' });

    if (req.user.role === 'patient') {
      const patient = await Patient.findOne({ user: userId });
      if (!patient || result.patient.toString() !== patient._id.toString()) return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: { url: result.reportDocument.url, filename: result.reportDocument.filename } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to download report', error: error.message });
  }
};

exports.searchLabsByTest = async (req, res) => {
  try {
    const { testName, latitude, longitude, maxDistance = 50000 } = req.query;
    if (!testName) return res.status(400).json({ success: false, message: 'Test name is required' });

    const testFilter = { isActive: true, $text: { $search: testName } };
    const matchingTests = await LabTest.find(testFilter).select('_id testName testCode category').lean();
    if (!matchingTests || matchingTests.length === 0) return res.json({ success: true, data: [], count: 0, message: 'No tests found matching your search' });

    const testIds = matchingTests.map(t => t._id);
    const labQuery = { isVerified: true, testCatalog: { $elemMatch: { testId: { $in: testIds } } } };

    if (latitude && longitude) {
      labQuery.location = { $near: { $geometry: { type: 'Point', coordinates: [parseFloat(longitude), parseFloat(latitude)] }, $maxDistance: parseInt(maxDistance) || 50000 } };
    }

    const labs = await Lab.find(labQuery).populate('user', 'fullName email phone').select('labName address location homeSampleCollection rating testCatalog isVerified user').lean();
    const enrichedLabs = labs.map(lab => {
      const availableTests = [];
      const testMap = new Map(matchingTests.map(t => [t._id.toString(), t]));
      (lab.testCatalog || []).forEach(catalogEntry => {
        const testId = catalogEntry.testId.toString();
        if (testMap.has(testId)) availableTests.push({ ...testMap.get(testId), labPrice: catalogEntry.price, turnaroundTime: catalogEntry.turnaroundTime });
      });
      return { _id: lab._id, labName: lab.labName, isVerified: Boolean(lab.isVerified), address: lab.address, location: buildLabLocation(lab), coordinates: lab.location?.coordinates, homeSampleCollection: lab.homeSampleCollection, rating: lab.rating, contactName: lab.user?.fullName, email: lab.user?.email, phone: lab.user?.phone, availableTests, totalAvailableTests: availableTests.length };
    });

    if (latitude && longitude) {
      const userLng = parseFloat(longitude);
      const userLat = parseFloat(latitude);
      enrichedLabs.sort((a, b) => getDistance(userLat, userLng, a.coordinates?.[1], a.coordinates?.[0]) - getDistance(userLat, userLng, b.coordinates?.[1], b.coordinates?.[0]));
    }

    res.json({ success: true, data: enrichedLabs, count: enrichedLabs.length, matchedTests: matchingTests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to search laboratories', error: error.message });
  }
};

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

exports.addTestToCatalog = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { testId, testCode, testName, category, price, turnaroundTime, description, sampleType, prerequisites } = req.body;
    if (!price) return res.status(400).json({ success: false, message: 'Price is required' });

    const lab = await getLabForUser(userId);
    if (!lab) return res.status(404).json({ success: false, message: 'Laboratory profile not found' });

    let finalTestId = testId;
    if (!testId) {
      if (!testCode || !testName || !category || !sampleType) return res.status(400).json({ success: false, message: 'For new tests, please provide: testCode, testName, category, and sampleType' });
      let existingTest = await LabTest.findOne({ testCode: testCode.toUpperCase() });
      if (existingTest) {
        finalTestId = existingTest._id;
      } else {
        const newTest = await LabTest.create({ testCode: testCode.toUpperCase(), testName, category, description: description || testName, sampleType, price: parseFloat(price), preparationInstructions: prerequisites || 'No special preparation required', turnaroundTime: { value: extractHours(turnaroundTime) || 24, unit: turnaroundTime?.includes('hour') ? 'hours' : 'days' }, isActive: true });
        finalTestId = newTest._id;
      }
    } else {
      const test = await LabTest.findById(testId);
      if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    }

    const existingEntry = (lab.testCatalog || []).find(entry => entry.testId?.toString() === finalTestId.toString());
    if (existingEntry) return res.status(400).json({ success: false, message: 'This test is already in your catalog. Update the price if you want to modify it.' });

    lab.testCatalog.push({ testId: finalTestId, price: parseFloat(price), turnaroundTime: turnaroundTime || '24 hours' });
    await lab.save();

    const populatedLab = await Lab.findById(lab._id).populate('testCatalog.testId').lean();
    res.status(201).json({ success: true, message: 'Test added to laboratory catalog', data: populatedLab.testCatalog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add test to catalog', error: error.message });
  }
};

const extractHours = (timeStr) => {
  if (!timeStr) return 24;
  const match = timeStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 24;
};

exports.updateTestInCatalog = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { testId, price, turnaroundTime } = req.body;
    if (!testId || price === undefined) return res.status(400).json({ success: false, message: 'Test ID and price are required' });

    const lab = await getLabForUser(userId);
    if (!lab) return res.status(404).json({ success: false, message: 'Laboratory profile not found' });

    const catalogEntry = (lab.testCatalog || []).find(entry => entry.testId?.toString() === testId);
    if (!catalogEntry) return res.status(404).json({ success: false, message: 'Test not found in catalog' });

    catalogEntry.price = parseFloat(price);
    if (turnaroundTime) catalogEntry.turnaroundTime = turnaroundTime;
    await lab.save();

    res.json({ success: true, message: 'Test catalog updated', data: lab.testCatalog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update test in catalog', error: error.message });
  }
};

exports.removeTestFromCatalog = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { testId } = req.params;
    if (!testId) return res.status(400).json({ success: false, message: 'Test ID is required' });

    const lab = await getLabForUser(userId);
    if (!lab) return res.status(404).json({ success: false, message: 'Laboratory profile not found' });

    const initialLength = lab.testCatalog?.length || 0;
    lab.testCatalog = (lab.testCatalog || []).filter(entry => entry.testId?.toString() !== testId);
    if (lab.testCatalog.length === initialLength) return res.status(404).json({ success: false, message: 'Test not found in catalog' });

    await lab.save();
    res.json({ success: true, message: 'Test removed from laboratory catalog', data: lab.testCatalog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to remove test from catalog', error: error.message });
  }
};

exports.getLabCatalog = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const lab = await getLabForUser(userId);
    if (!lab) return res.status(404).json({ success: false, message: 'Laboratory profile not found' });

    const catalog = await Lab.findById(lab._id).populate('testCatalog.testId', 'testName testCode category description sampleType').lean();
    const enrichedCatalog = (catalog.testCatalog || []).map(entry => ({ ...entry.testId, labPrice: entry.price, labTurnaroundTime: entry.turnaroundTime }));
    res.json({ success: true, data: enrichedCatalog, count: enrichedCatalog.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch laboratory catalog', error: error.message });
  }
};

exports.getPendingLabApprovals = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can view lab approvals' });
    const pendingLabs = await User.find({ role: 'lab', status: 'pending_approval' }).select('-password -refreshToken').populate({ path: 'labId', model: 'Lab', select: 'labName licenseNumber address testCatalog homeSampleCollection rating' }).sort({ createdAt: -1 }).lean();
    const enrichedLabs = await Promise.all(pendingLabs.map(async (user) => {
      const lab = await Lab.findOne({ $or: [{ user: user._id }, { userId: user._id }] }).lean();
      return { ...user, lab: lab };
    }));
    res.json({ success: true, data: enrichedLabs, count: enrichedLabs.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch pending lab approvals', error: error.message });
  }
};

exports.approveLab = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can approve laboratories' });
    const { labUserId } = req.params;
    const adminId = getAuthenticatedUserId(req);

    const user = await User.findById(labUserId);
    if (!user || user.role !== 'lab') {
      return res.status(404).json({ success: false, message: 'Laboratory user not found' });
    }

    if (user.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'This laboratory is not pending approval' });
    }

    // Update user status
    user.status = 'active';
    user.approvedBy = adminId;
    user.approvedAt = new Date();
    await user.save();

    // Update lab verification
    const lab = await Lab.findOne({ $or: [{ user: user._id }, { userId: user._id }] });
    if (lab) {
      lab.isVerified = true;
      await lab.save();
    }

    // Send approval email
    try {
      await sendEmail(user.email, 'lab_approved', { name: user.fullName, labName: lab?.labName || user.fullName });
    } catch (emailError) {
      console.error('Approval email failed:', emailError);
    }

    res.json({
      success: true,
      message: 'Laboratory approved successfully',
      data: { userId: user._id, email: user.email, status: user.status, approvedAt: user.approvedAt }
    });
  } catch (error) {
    console.error('Approve lab error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve laboratory', error: error.message });
  }
};

exports.rejectLab = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only admins can reject laboratories' });

    const { labUserId } = req.params;
    const { rejectionReason } = req.body;
    const adminId = getAuthenticatedUserId(req);

    if (!rejectionReason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const user = await User.findById(labUserId);
    if (!user || user.role !== 'lab') {
      return res.status(404).json({ success: false, message: 'Laboratory user not found' });
    }

    if (user.status !== 'pending_approval') {
      return res.status(400).json({ success: false, message: 'This laboratory is not pending approval' });
    }

    // Update user status
    user.status = 'rejected';
    user.rejectionReason = rejectionReason;
    user.approvedBy = adminId;
    user.approvedAt = new Date();
    await user.save();

    // Send rejection email
    try {
      await sendEmail(user.email, 'lab_rejected', { name: user.fullName, reason: rejectionReason });
    } catch (emailError) {
      console.error('Rejection email failed:', emailError);
    }

    res.json({
      success: true,
      message: 'Laboratory rejected successfully',
      data: { userId: user._id, email: user.email, status: user.status, rejectionReason: user.rejectionReason }
    });
  } catch (error) {
    console.error('Reject lab error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject laboratory', error: error.message });
  }
};

exports.getLabDetails = async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req);
    const { labId } = req.params;

    let lab;
    if (labId) {
      // Admin viewing a specific lab
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      lab = await Lab.findById(labId)
        .populate('user', 'fullName email phone status approvedAt')
        .populate('testCatalog.testId', 'testName testCode category')
        .lean();
    } else {
      // Lab viewing their own profile
      lab = await getLabForUser(userId);
      if (!lab) {
        return res.status(404).json({ success: false, message: 'Laboratory profile not found' });
      }
      lab = await Lab.findById(lab._id)
        .populate('user', 'fullName email phone status')
        .populate('testCatalog.testId', 'testName testCode category')
        .lean();
    }

    if (!lab) {
      return res.status(404).json({ success: false, message: 'Laboratory not found' });
    }

    res.json({ success: true, data: lab });
  } catch (error) {
    console.error('Get lab details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lab details', error: error.message });
  }
};