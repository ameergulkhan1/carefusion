const mongoose = require('mongoose');
const dotenv = require('dotenv');
const LabTest = require('../models/LabTest');

dotenv.config();

const labTests = [
  {
    testCode: 'CBC',
    testName: 'Complete Blood Count',
    category: 'Hematology',
    description: 'Measures different components of blood including red blood cells, white blood cells, hemoglobin, hematocrit, and platelets',
    price: 500,
    preparationInstructions: 'No special preparation required. Can be done at any time.',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    normalRange: {
      description: 'Normal ranges vary by age and gender'
    },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'LFT',
    testName: 'Liver Function Test',
    category: 'Biochemistry',
    description: 'Checks the health of liver by measuring enzymes, proteins, and bilirubin levels',
    price: 800,
    preparationInstructions: 'Fasting of 8-12 hours required before test',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: true,
    isActive: true
  },
  {
    testCode: 'KFT',
    testName: 'Kidney Function Test',
    category: 'Biochemistry',
    description: 'Evaluates kidney function by measuring creatinine, urea, and electrolytes',
    price: 750,
    preparationInstructions: 'Fasting of 8-12 hours recommended',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: true,
    isActive: true
  },
  {
    testCode: 'LIPID',
    testName: 'Lipid Profile',
    category: 'Biochemistry',
    description: 'Measures cholesterol levels including total cholesterol, LDL, HDL, and triglycerides',
    price: 700,
    preparationInstructions: 'Fasting of 9-12 hours required',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: true,
    isActive: true
  },
  {
    testCode: 'HBA1C',
    testName: 'Hemoglobin A1c',
    category: 'Biochemistry',
    description: 'Measures average blood sugar levels over the past 2-3 months',
    price: 600,
    preparationInstructions: 'No fasting required',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'THYROID',
    testName: 'Thyroid Function Test',
    category: 'Hormones',
    description: 'Measures thyroid hormones TSH, T3, and T4 levels',
    price: 900,
    preparationInstructions: 'No special preparation required',
    sampleType: 'Blood',
    turnaroundTime: { value: 48, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'VITD',
    testName: 'Vitamin D Total',
    category: 'Vitamins',
    description: 'Measures total vitamin D levels in blood',
    price: 1200,
    preparationInstructions: 'No special preparation required',
    sampleType: 'Blood',
    turnaroundTime: { value: 48, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'VITB12',
    testName: 'Vitamin B12',
    category: 'Vitamins',
    description: 'Measures vitamin B12 levels in blood',
    price: 800,
    preparationInstructions: 'No special preparation required',
    sampleType: 'Blood',
    turnaroundTime: { value: 48, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'URINE',
    testName: 'Complete Urine Analysis',
    category: 'Pathology',
    description: 'Comprehensive analysis of urine sample for various parameters',
    price: 300,
    preparationInstructions: 'Collect early morning first urine sample in sterile container',
    sampleType: 'Urine',
    turnaroundTime: { value: 12, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'XRAY',
    testName: 'X-Ray (Chest)',
    category: 'Radiology',
    description: 'Chest X-ray for lung and heart examination',
    price: 600,
    preparationInstructions: 'Remove metal objects and jewelry before test',
    sampleType: 'Other',
    turnaroundTime: { value: 2, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'ECG',
    testName: 'Electrocardiogram',
    category: 'Cardiology',
    description: 'Records electrical activity of the heart',
    price: 400,
    preparationInstructions: 'No special preparation required. Avoid heavy exercise before test.',
    sampleType: 'Other',
    turnaroundTime: { value: 1, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'CULTURE',
    testName: 'Urine Culture',
    category: 'Microbiology',
    description: 'Identifies bacteria causing urinary tract infections',
    price: 800,
    preparationInstructions: 'Collect clean catch midstream urine sample',
    sampleType: 'Urine',
    turnaroundTime: { value: 72, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'CRP',
    testName: 'C-Reactive Protein',
    category: 'Immunology',
    description: 'Measures inflammation levels in the body',
    price: 700,
    preparationInstructions: 'No special preparation required',
    sampleType: 'Blood',
    turnaroundTime: { value: 24, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'ESR',
    testName: 'Erythrocyte Sedimentation Rate',
    category: 'Hematology',
    description: 'Measures how quickly red blood cells settle at bottom of test tube',
    price: 200,
    preparationInstructions: 'No special preparation required',
    sampleType: 'Blood',
    turnaroundTime: { value: 2, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  },
  {
    testCode: 'PSA',
    testName: 'Prostate Specific Antigen',
    category: 'Hormones',
    description: 'Screening test for prostate health in men',
    price: 1000,
    preparationInstructions: 'Avoid ejaculation 24-48 hours before test',
    sampleType: 'Blood',
    turnaroundTime: { value: 48, unit: 'hours' },
    requiresFasting: false,
    isActive: true
  }
];

const seedLabTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing tests
    await LabTest.deleteMany({});
    console.log('Cleared existing lab tests');
    
    // Insert new tests
    const insertedTests = await LabTest.insertMany(labTests);
    console.log(`✅ Inserted ${insertedTests.length} lab tests`);
    
    console.log('\nSample tests:');
    insertedTests.slice(0, 3).forEach(test => {
      console.log(`  - ${test.testCode}: ${test.testName} (₹${test.price})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding lab tests:', error);
    process.exit(1);
  }
};

seedLabTests();
