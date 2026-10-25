/**
 * Setup script to populate lab tests in the database and associate them with labs
 * Run: node scripts/setup-labtests.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const LabTest = require('../src/models/LabTest');
const Lab = require('../src/models/Lab');

// Comprehensive sample lab tests with PKR pricing
const SAMPLE_LAB_TESTS = [
  // Hematology Tests
  {
    testCode: 'CBP',
    testName: 'Complete Blood Picture (CBC)',
    category: 'Hematology',
    description: 'Complete blood count including RBC, WBC, platelets, hemoglobin',
    price: 1500, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No fasting required. Can eat and drink as normal.',
    normalRange: {
      min: 4.5,
      max: 11.0,
      unit: '10^9/L',
      description: 'Normal WBC range'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'PT',
    testName: 'Prothrombin Time (PT/INR)',
    category: 'Hematology',
    description: 'Blood clotting test - measures how long it takes blood to clot',
    price: 2000, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No special preparation required',
    normalRange: {
      min: 11,
      max: 13.5,
      unit: 'seconds',
      description: 'Normal PT range'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'ESR',
    testName: 'Erythrocyte Sedimentation Rate (ESR)',
    category: 'Hematology',
    description: 'Measures inflammation and infection in the body',
    price: 1200, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No special preparation required',
    normalRange: {
      min: 0,
      max: 20,
      unit: 'mm/hr',
      description: 'Normal ESR range'
    },
    requiresFasting: false,
    isActive: true
  },

  // Biochemistry Tests
  {
    testCode: 'LFT',
    testName: 'Liver Function Test',
    category: 'Biochemistry',
    description: 'Measures liver health including bilirubin, albumin, enzymes',
    price: 2500, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'Fasting for 8-12 hours recommended. Empty stomach for best results.',
    normalRange: {
      min: 0.3,
      max: 1.2,
      unit: 'mg/dL',
      description: 'Normal Bilirubin range'
    },
    requiresFasting: true,
    isActive: true
  },
  {
    testCode: 'RFT',
    testName: 'Renal Function Test (Kidney Function)',
    category: 'Biochemistry',
    description: 'Measures kidney function - creatinine, BUN, electrolytes',
    price: 2200, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'Fasting for 8-12 hours is recommended',
    normalRange: {
      min: 0.7,
      max: 1.3,
      unit: 'mg/dL',
      description: 'Normal Creatinine range'
    },
    requiresFasting: true,
    isActive: true
  },
  {
    testCode: 'FBS',
    testName: 'Fasting Blood Sugar',
    category: 'Biochemistry',
    description: 'Measures blood glucose levels during fasting',
    price: 800, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'Fasting for 8-12 hours REQUIRED. No food or drink except water.',
    normalRange: {
      min: 70,
      max: 100,
      unit: 'mg/dL',
      description: 'Normal fasting blood sugar'
    },
    requiresFasting: true,
    isActive: true
  },
  {
    testCode: 'PPBS',
    testName: 'Post-Prandial Blood Sugar (2-Hour)',
    category: 'Biochemistry',
    description: 'Blood glucose measured 2 hours after eating',
    price: 900, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'Eat a normal meal and return after 2 hours for blood draw',
    normalRange: {
      min: 70,
      max: 140,
      unit: 'mg/dL',
      description: 'Normal post-meal blood sugar'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'HbA1c',
    testName: 'Glycated Hemoglobin (HbA1c)',
    category: 'Biochemistry',
    description: 'Average blood sugar over 2-3 months - diabetes screening',
    price: 1800, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No fasting required',
    normalRange: {
      min: 4,
      max: 6,
      unit: '%',
      description: 'Normal HbA1c range'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'LP',
    testName: 'Lipid Profile (Cholesterol)',
    category: 'Biochemistry',
    description: 'Measures total cholesterol, HDL, LDL, triglycerides',
    price: 2400, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'Fasting for 10-12 hours required. No food for accurate results.',
    normalRange: {
      min: 0,
      max: 200,
      unit: 'mg/dL',
      description: 'Desirable total cholesterol'
    },
    requiresFasting: true,
    isActive: true
  },

  // Microbiology Tests
  {
    testCode: 'UC',
    testName: 'Urine Culture & Sensitivity',
    category: 'Microbiology',
    description: 'Identifies bacteria and determines antibiotic sensitivity',
    price: 2100, // PKR
    sampleType: 'Urine',
    turnaroundTime: { value: 2, unit: 'days' },
    preparationInstructions: 'Collect mid-stream urine in sterile container. Bring sample within 2 hours.',
    normalRange: {
      unit: 'CFU/mL',
      description: 'Normal: <100,000 CFU/mL'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'ST',
    testName: 'Stool Test',
    category: 'Microbiology',
    description: 'Detects parasites, bacteria, and other pathogens in stool',
    price: 1600, // PKR
    sampleType: 'Stool',
    turnaroundTime: { value: 2, unit: 'days' },
    preparationInstructions: 'Collect fresh stool sample in sterile container. Avoid contamination.',
    normalRange: {
      description: 'No parasites or pathogenic organisms detected'
    },
    requiresFasting: false,
    isActive: true
  },

  // Immunology Tests
  {
    testCode: 'HBsAg',
    testName: 'Hepatitis B Surface Antigen (HBsAg)',
    category: 'Immunology',
    description: 'Screening for Hepatitis B infection',
    price: 1800, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No special preparation required',
    normalRange: {
      unit: '',
      description: 'Negative/Non-reactive (Positive indicates HBV infection)'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'HCV-AB',
    testName: 'Hepatitis C Antibody',
    category: 'Immunology',
    description: 'Screening for Hepatitis C infection',
    price: 2000, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No special preparation required',
    normalRange: {
      unit: '',
      description: 'Negative/Non-reactive'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'HIV',
    testName: 'HIV Test (4th Generation)',
    category: 'Immunology',
    description: 'Screening test for HIV antibodies and antigen',
    price: 2500, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No special preparation required. Confidential testing available.',
    normalRange: {
      unit: '',
      description: 'Non-reactive (indicates no HIV infection)'
    },
    requiresFasting: false,
    isActive: true
  },

  // Hormones
  {
    testCode: 'TSH',
    testName: 'Thyroid Stimulating Hormone (TSH)',
    category: 'Hormones',
    description: 'Checks thyroid function',
    price: 1500, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No special preparation required',
    normalRange: {
      min: 0.4,
      max: 4.0,
      unit: 'mIU/L',
      description: 'Normal TSH range'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'T3-T4',
    testName: 'Free T3 and Free T4',
    category: 'Hormones',
    description: 'Measures thyroid hormone levels',
    price: 2200, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No special preparation required',
    normalRange: {
      unit: 'pg/mL and ng/dL',
      description: 'See lab reference ranges'
    },
    requiresFasting: false,
    isActive: true
  },

  // Vitamins
  {
    testCode: 'VB12',
    testName: 'Vitamin B12 Level',
    category: 'Vitamins',
    description: 'Measures B12 levels for anemia screening',
    price: 1700, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No special preparation required',
    normalRange: {
      min: 200,
      max: 900,
      unit: 'pg/mL',
      description: 'Normal B12 range'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'VD',
    testName: 'Vitamin D 25-OH Level',
    category: 'Vitamins',
    description: 'Measures Vitamin D levels for bone health',
    price: 2300, // PKR
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    preparationInstructions: 'No fasting required',
    normalRange: {
      min: 30,
      max: 100,
      unit: 'ng/mL',
      description: 'Sufficient level'
    },
    requiresFasting: false,
    isActive: true
  },

  // Radiology Interpretation
  {
    testCode: 'XRAY',
    testName: 'X-Ray Interpretation',
    category: 'Radiology',
    description: 'Radiologist interpretation of X-ray images',
    price: 800, // PKR
    sampleType: 'Other',
    turnaroundTime: { value: 48, unit: 'hours' },
    preparationInstructions: 'Bring your X-ray images. Report will be provided by radiologist.',
    normalRange: {
      description: 'No abnormal findings'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'USG',
    testName: 'Ultrasound (Abdominal)',
    category: 'Radiology',
    description: 'Ultrasound imaging of abdomen - liver, kidney, pancreas',
    price: 2000, // PKR
    sampleType: 'Other',
    turnaroundTime: { value: 1, unit: 'hours' },
    preparationInstructions: 'Fasting for 6 hours recommended. Wear loose clothing.',
    normalRange: {
      description: 'No abnormalities detected'
    },
    requiresFasting: true,
    isActive: true
  },

  // Cardiology
  {
    testCode: 'ECG',
    testName: 'Electrocardiogram (ECG/EKG)',
    category: 'Cardiology',
    description: 'Records electrical activity of the heart',
    price: 1200, // PKR
    sampleType: 'Other',
    turnaroundTime: { value: 1, unit: 'hours' },
    preparationInstructions: 'Lie down for 10 minutes before test. Wear loose clothing.',
    normalRange: {
      description: 'Normal heart rhythm and rate'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'ECHO',
    testName: 'Echocardiogram',
    category: 'Cardiology',
    description: 'Ultrasound of the heart to assess structure and function',
    price: 3500, // PKR
    sampleType: 'Other',
    turnaroundTime: { value: 2, unit: 'hours' },
    preparationInstructions: 'Light meal is acceptable. Allow 30 minutes for procedure.',
    normalRange: {
      description: 'Normal cardiac structure and function'
    },
    requiresFasting: false,
    isActive: true
  }
];

async function setupLabTests() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clinixsol');
    console.log('✅ Connected to MongoDB');

    // Clear existing lab tests (optional - comment out to keep existing tests)
    // await LabTest.deleteMany({});
    // console.log('Cleared existing lab tests');

    // Create or update lab tests
    const createdTests = [];
    for (const testData of SAMPLE_LAB_TESTS) {
      const existingTest = await LabTest.findOne({ testCode: testData.testCode });
      
      if (existingTest) {
        // Update existing test
        await LabTest.updateOne({ testCode: testData.testCode }, testData);
        console.log(`✏️ Updated: ${testData.testName} (${testData.testCode})`);
      } else {
        // Create new test
        const newTest = await LabTest.create(testData);
        createdTests.push(newTest);
        console.log(`✅ Created: ${testData.testName} (${testData.testCode}) - PKR ${testData.price}`);
      }
    }

    // Get all labs and associate tests with them
    const labs = await Lab.find();
    console.log(`\n📋 Found ${labs.length} labs. Associating tests with labs...`);

    for (const lab of labs) {
      // Get all lab tests
      const allTests = await LabTest.find();
      
      // Randomly select 70-80% of tests for each lab (to simulate variation)
      const selectedTests = allTests.sort(() => Math.random() - 0.5).slice(0, Math.floor(allTests.length * (0.7 + Math.random() * 0.1)));
      
      // Update lab with available tests
      await Lab.updateOne(
        { _id: lab._id },
        { availableTests: selectedTests.map(t => t._id) }
      );
      
      console.log(`  ✅ Associated ${selectedTests.length} tests with lab: ${lab.labName}`);
    }

    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('LAB TEST SETUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total Lab Tests Created/Updated: ${SAMPLE_LAB_TESTS.length}`);
    console.log(`✅ Total Labs Configured: ${labs.length}`);
    console.log(`\n📊 Test Categories:`);
    
    const categories = {};
    SAMPLE_LAB_TESTS.forEach(test => {
      categories[test.category] = (categories[test.category] || 0) + 1;
    });
    
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   • ${category}: ${count} tests`);
    });

    console.log(`\n💰 Price Range (PKR):`);
    const prices = SAMPLE_LAB_TESTS.map(t => t.price).sort((a, b) => a - b);
    console.log(`   • Minimum: Rs. ${prices[0]}`);
    console.log(`   • Maximum: Rs. ${prices[prices.length - 1]}`);
    console.log(`   • Average: Rs. ${Math.round(prices.reduce((a, b) => a + b) / prices.length)}`);

    console.log(`\n✨ All lab tests are setup and ready for patients to book!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up lab tests:', error);
    process.exit(1);
  }
}

// Run setup
setupLabTests();
