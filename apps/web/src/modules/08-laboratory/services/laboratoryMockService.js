const STORAGE_KEYS = {
  labs: 'lab_mock_labs',
  tests: 'lab_mock_tests',
  orders: 'lab_mock_orders',
  results: 'lab_mock_results'
};

const DEFAULT_LABS = [
  {
    _id: 'lab-1',
    labName: 'City Diagnostics Center',
    location: 'Downtown',
    isVerified: true
  },
  {
    _id: 'lab-2',
    labName: 'HealthFirst Laboratory',
    location: 'West Side',
    isVerified: true
  },
  {
    _id: 'lab-3',
    labName: 'CarePath Lab',
    location: 'East End',
    isVerified: false
  }
];

const DEFAULT_TESTS = [
  {
    _id: 'test-cbc',
    testName: 'Complete Blood Count',
    testCode: 'CBC',
    description: 'Evaluates overall blood health including red and white blood cells.',
    category: 'Hematology',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: false,
    price: 450
  },
  {
    _id: 'test-lipid',
    testName: 'Lipid Profile',
    testCode: 'LIPID',
    description: 'Measures cholesterol and triglycerides to assess cardiovascular risk.',
    category: 'Biochemistry',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: true,
    price: 750
  },
  {
    _id: 'test-lft',
    testName: 'Liver Function Test',
    testCode: 'LFT',
    description: 'Assesses liver enzymes and bilirubin levels.',
    category: 'Biochemistry',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: false,
    price: 900
  },
  {
    _id: 'test-kft',
    testName: 'Kidney Function Test',
    testCode: 'KFT',
    description: 'Measures kidney performance through creatinine and urea values.',
    category: 'Biochemistry',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: false,
    price: 850
  },
  {
    _id: 'test-thyroid',
    testName: 'Thyroid Profile',
    testCode: 'THY',
    description: 'Checks T3, T4 and TSH levels for thyroid function.',
    category: 'Hormones',
    sampleType: 'Blood',
    turnaroundTime: { value: 48, unit: 'hours' },
    requiresFasting: false,
    price: 1200
  }
];

const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const getCurrentUser = () => parseJson(localStorage.getItem('user'), null) || {};

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

const getPatientId = () => {
  const user = getCurrentUser();
  return user?._id || user?.id || user?.email || 'guest-patient';
};

const getUserName = () => {
  const user = getCurrentUser();
  return user?.name || user?.fullName || user?.email || 'Patient';
};

const persist = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const read = (key, fallback) => parseJson(localStorage.getItem(key), fallback);

const ensureSeedData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.labs)) {
    persist(STORAGE_KEYS.labs, DEFAULT_LABS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.tests)) {
    persist(STORAGE_KEYS.tests, DEFAULT_TESTS);
  }

  if (!localStorage.getItem(STORAGE_KEYS.orders)) {
    persist(STORAGE_KEYS.orders, []);
  }

  if (!localStorage.getItem(STORAGE_KEYS.results)) {
    persist(STORAGE_KEYS.results, []);
  }
};

const readLabs = () => read(STORAGE_KEYS.labs, DEFAULT_LABS);
const readTests = () => read(STORAGE_KEYS.tests, DEFAULT_TESTS);
const readOrders = () => read(STORAGE_KEYS.orders, []);
const readResults = () => read(STORAGE_KEYS.results, []);

const writeOrders = (orders) => persist(STORAGE_KEYS.orders, orders);
const writeResults = (results) => persist(STORAGE_KEYS.results, results);

const getLabForOrder = (laboratoryId) => {
  const labs = readLabs();
  return labs.find((lab) => lab._id === laboratoryId) || labs[0] || null;
};

const nowIso = () => new Date().toISOString();

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const buildOrderNumber = () => `LAB-${Date.now().toString().slice(-8)}`;

const toResponse = (data, message = '') => ({ success: true, data, message });

const toNotFound = (message) => ({ success: false, data: null, message });

const laboratoryMockService = {
  getAvailableLabs: async () => {
    ensureSeedData();
    return toResponse(clone(readLabs()));
  },

  getAllTests: async (params = {}) => {
    ensureSeedData();
    const tests = readTests();

    if (!params?.laboratoryId) {
      return toResponse(clone(tests));
    }

    return toResponse(clone(tests));
  },

  getTestCategories: async () => {
    ensureSeedData();
    const categories = Array.from(new Set(readTests().map((test) => test.category).filter(Boolean)));
    return toResponse(categories);
  },

  getTestById: async (testId) => {
    ensureSeedData();
    const test = readTests().find((item) => item._id === testId);
    if (!test) {
      return toNotFound('Test not found');
    }

    return toResponse(clone(test));
  },

  createOrder: async (orderData = {}) => {
    ensureSeedData();
    const patientId = getPatientId();
    const patientName = getUserName();
    const labs = readLabs();
    const testsCatalog = readTests();
    const selectedTests = Array.isArray(orderData.tests) ? orderData.tests : [];

    const selected = selectedTests
      .map((testId) => testsCatalog.find((test) => test._id === testId))
      .filter(Boolean)
      .map((test) => ({
        testId: test._id,
        testName: test.testName,
        testCode: test.testCode,
        status: 'scheduled',
        price: test.price
      }));

    if (selected.length === 0) {
      return { success: false, data: null, message: 'No valid tests selected' };
    }

    const selectedLab = labs.find((lab) => lab._id === orderData.laboratoryId) || labs[0];

    const newOrder = {
      _id: generateId('order'),
      orderNumber: buildOrderNumber(),
      patientId,
      patientName,
      laboratory: selectedLab
        ? {
            _id: selectedLab._id,
            labName: selectedLab.labName,
            location: selectedLab.location
          }
        : null,
      tests: selected,
      appointmentDate: orderData.appointmentDate || nowIso(),
      sampleCollectionType: orderData.sampleCollectionType || 'walk-in',
      homeCollectionAddress: orderData.homeCollectionAddress || null,
      specialInstructions: orderData.specialInstructions || '',
      orderStatus: 'scheduled',
      statusHistory: [
        {
          status: 'scheduled',
          note: 'Order created',
          updatedAt: nowIso()
        }
      ],
      totalAmount: selected.reduce((sum, test) => sum + Number(test.price || 0), 0),
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    const orders = readOrders();
    orders.unshift(newOrder);
    writeOrders(orders);

    return toResponse(clone(newOrder), 'Lab order created successfully');
  },

  getPatientOrders: async () => {
    ensureSeedData();
    const patientId = getPatientId();
    const orders = readOrders().filter((order) => order.patientId === patientId);
    return toResponse(clone(orders));
  },

  getLabOrders: async () => {
    ensureSeedData();
    const user = getCurrentUser();
    const role = normalizeRole(user?.role);
    const userLabId = user?.laboratoryId || user?.labId || null;

    let orders = readOrders();

    if (role === 'lab' || role === 'laboratory') {
      if (userLabId) {
        orders = orders.filter((order) => order.laboratory?._id === userLabId);
      }
      return toResponse(clone(orders));
    }

    return toResponse(clone(orders));
  },

  updateOrderStatus: async (orderId, payload = {}) => {
    ensureSeedData();
    const orders = readOrders();
    const orderIndex = orders.findIndex((order) => order._id === orderId);

    if (orderIndex === -1) {
      return toNotFound('Order not found');
    }

    const status = payload.status || orders[orderIndex].orderStatus;
    orders[orderIndex].orderStatus = status;
    orders[orderIndex].updatedAt = nowIso();
    orders[orderIndex].statusHistory = [
      ...(orders[orderIndex].statusHistory || []),
      {
        status,
        note: payload.note || `Status updated to ${status}`,
        updatedAt: nowIso()
      }
    ];

    writeOrders(orders);
    return toResponse(clone(orders[orderIndex]), 'Order status updated');
  },

  publishResult: async (orderId, testId, payload = {}) => {
    ensureSeedData();
    const orders = readOrders();
    const orderIndex = orders.findIndex((order) => order._id === orderId);

    if (orderIndex === -1) {
      return toNotFound('Order not found');
    }

    const order = orders[orderIndex];
    const testIndex = (order.tests || []).findIndex((test) => String(test.testId) === String(testId));

    if (testIndex === -1) {
      return toNotFound('Test not found in order');
    }

    order.tests[testIndex].status = 'completed';
    order.updatedAt = nowIso();

    const allTestsCompleted = (order.tests || []).every((test) => test.status === 'completed');
    if (allTestsCompleted) {
      order.orderStatus = 'completed';
      order.statusHistory = [
        ...(order.statusHistory || []),
        {
          status: 'completed',
          note: 'All test results reported',
          updatedAt: nowIso()
        }
      ];
    }

    orders[orderIndex] = order;
    writeOrders(orders);

    const results = readResults();
    const existingResultIndex = results.findIndex(
      (item) => item.orderId === order._id && String(item.testId) === String(testId)
    );

    const nextResult = {
      _id: existingResultIndex >= 0 ? results[existingResultIndex]._id : generateId('result'),
      orderId: order._id,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber
      },
      patientId: order.patientId,
      testId,
      testName: order.tests[testIndex].testName,
      testCode: order.tests[testIndex].testCode,
      overallResult: payload.overallResult || 'normal',
      interpretation: payload.interpretation || '',
      remarks: payload.remarks || '',
      parameters: Array.isArray(payload.parameters) ? payload.parameters : [],
      sampleCollectedAt: payload.sampleCollectedAt || order.appointmentDate || nowIso(),
      processedAt: payload.processedAt || nowIso(),
      reportedAt: nowIso(),
      createdAt: existingResultIndex >= 0 ? results[existingResultIndex].createdAt : nowIso(),
      updatedAt: nowIso()
    };

    if (existingResultIndex >= 0) {
      results[existingResultIndex] = nextResult;
    } else {
      results.unshift(nextResult);
    }

    writeResults(results);

    return toResponse(clone(nextResult), 'Result published successfully');
  },

  getOrderById: async (orderId) => {
    ensureSeedData();
    const order = readOrders().find((item) => item._id === orderId);
    if (!order) {
      return toNotFound('Order not found');
    }

    return toResponse(clone(order));
  },

  cancelOrder: async (orderId, cancelReason = 'Cancelled by user') => {
    ensureSeedData();
    const orders = readOrders();
    const orderIndex = orders.findIndex((order) => order._id === orderId);

    if (orderIndex === -1) {
      return toNotFound('Order not found');
    }

    orders[orderIndex].orderStatus = 'cancelled';
    orders[orderIndex].updatedAt = nowIso();
    orders[orderIndex].statusHistory = [
      ...(orders[orderIndex].statusHistory || []),
      {
        status: 'cancelled',
        note: cancelReason,
        updatedAt: nowIso()
      }
    ];

    writeOrders(orders);
    return toResponse(clone(orders[orderIndex]), 'Order cancelled successfully');
  },

  getPatientResults: async () => {
    ensureSeedData();
    const patientId = getPatientId();
    const results = readResults().filter((result) => result.patientId === patientId);
    return toResponse(clone(results));
  },

  getResultById: async (resultId) => {
    ensureSeedData();
    const result = readResults().find((item) => item._id === resultId);
    if (!result) {
      return toNotFound('Result not found');
    }

    return toResponse(clone(result));
  },

  downloadReport: async (resultId) => {
    ensureSeedData();
    const result = readResults().find((item) => item._id === resultId);

    if (!result) {
      return toNotFound('Result not found');
    }

    const reportText = [
      `Lab Report: ${result.testName || 'Test'}`,
      `Report ID: ${result._id}`,
      `Order Number: ${result.order?.orderNumber || 'N/A'}`,
      `Overall Result: ${result.overallResult || 'normal'}`,
      `Interpretation: ${result.interpretation || 'N/A'}`,
      `Reported At: ${result.reportedAt || 'N/A'}`
    ].join('\n');

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    return toResponse({ url }, 'Report generated');
  },

  getLaboratoryMetrics: async () => {
    ensureSeedData();
    const orders = readOrders();
    const results = readResults();

    const data = {
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => ['scheduled', 'in-progress'].includes(order.orderStatus)).length,
      completedOrders: orders.filter((order) => order.orderStatus === 'completed').length,
      reportsAvailable: results.length
    };

    return toResponse(data);
  }
};

export default laboratoryMockService;
