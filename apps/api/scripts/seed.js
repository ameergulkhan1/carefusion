const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load .env from the root backend folder
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../src/models/User');
const Pharmacy = require('../src/models/Pharmacy');
const Lab = require('../src/models/Lab');
const Medicine = require('../src/models/Medicine'); 
const LabTest = require('../src/models/LabTest'); 

const seedDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
       throw new Error("MONGODB_URI is missing in your .env file!");
    }

    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected.');

    // Clear existing seed data
    console.log('Clearing old seed data...');
    await User.deleteMany({ email: /@seedtest.com$/ });
    await Pharmacy.deleteMany({});
    await Lab.deleteMany({});
    await Medicine.deleteMany({});
    await LabTest.deleteMany({});

    console.log('Seeding Master Medicines and Tests...');

    // 1. Create Master Medicines (Matching your exact Medicine Schema)
    const med1 = await Medicine.create({ 
      name: 'Paracetamol', genericName: 'Acetaminophen', manufacturer: 'GSK', 
      category: 'Tablet', dosageForm: 'Tablet', strength: '500mg', 
      description: 'Pain relief and fever reducer', prescriptionRequired: false 
    });
    const med2 = await Medicine.create({ 
      name: 'Amoxicillin', genericName: 'Amoxicillin', manufacturer: 'Pfizer', 
      category: 'Capsule', dosageForm: 'Capsule', strength: '250mg', 
      description: 'Antibiotic for bacterial infections', prescriptionRequired: true 
    });
    const med3 = await Medicine.create({ 
      name: 'Ibuprofen', genericName: 'Ibuprofen', manufacturer: 'Abbott', 
      category: 'Tablet', dosageForm: 'Tablet', strength: '400mg', 
      description: 'Anti-inflammatory pain reliever', prescriptionRequired: false 
    });
    const med4 = await Medicine.create({ 
      name: 'Cetirizine', genericName: 'Cetirizine Hydrochloride', manufacturer: 'J&J', 
      category: 'Tablet', dosageForm: 'Tablet', strength: '10mg', 
      description: 'Allergy relief antihistamine', prescriptionRequired: false 
    });
    const med5 = await Medicine.create({ 
      name: 'Omeprazole', genericName: 'Omeprazole', manufacturer: 'AstraZeneca', 
      category: 'Capsule', dosageForm: 'Capsule', strength: '20mg', 
      description: 'Acid reflux treatment', prescriptionRequired: true 
    });
    
    const masterMedicines = [med1, med2, med3, med4, med5];

    // 2. Create Master Lab Tests (Matching your exact LabTest Schema)
    const test1 = await LabTest.create({ 
      testCode: 'CBC-001', testName: 'Complete Blood Count (CBC)', category: 'Hematology', 
      description: 'General health check', price: 25, sampleType: 'Blood', 
      turnaroundTime: { value: 24, unit: 'hours' } 
    });
    const test2 = await LabTest.create({ 
      testCode: 'LIP-002', testName: 'Lipid Profile', category: 'Biochemistry', 
      description: 'Cholesterol check', price: 40, sampleType: 'Blood', 
      turnaroundTime: { value: 48, unit: 'hours' }, requiresFasting: true 
    });
    const test3 = await LabTest.create({ 
      testCode: 'THY-003', testName: 'Thyroid Function Test', category: 'Hormones', 
      description: 'Thyroid levels', price: 35, sampleType: 'Blood', 
      turnaroundTime: { value: 24, unit: 'hours' } 
    });
    const test4 = await LabTest.create({ 
      testCode: 'VIT-004', testName: 'Vitamin D Test', category: 'Vitamins', 
      description: 'Vitamin D deficiency', price: 50, sampleType: 'Blood', 
      turnaroundTime: { value: 2, unit: 'days' } 
    });

    const masterTests = [test1, test2, test3, test4];

    console.log('Seeding Pharmacies...');
    const pharmaciesData = [
      { name: 'City Care Pharmacy', email: 'pharmacy1@seedtest.com', license: 'PH-111' },
      { name: 'HealthPlus Pharmacy', email: 'pharmacy2@seedtest.com', license: 'PH-222' },
      { name: 'Green Cross Pharmacy', email: 'pharmacy3@seedtest.com', license: 'PH-333' }
    ];

    for (const data of pharmaciesData) {
      const user = await User.create({
        fullName: data.name,
        email: data.email,
        password: 'Password123!', 
        role: 'pharmacy',
        isVerified: true,
        status: 'active'
      });

      // Assign 5 medicines to this pharmacy's inventory
      const inventory = masterMedicines.map((med, index) => ({
        medicineId: med._id,
        stock: Math.floor(Math.random() * 100) + 10,
        price: (index + 1) * 5.50 
      }));

      await Pharmacy.create({
        user: user._id,
        pharmacyName: data.name,
        licenseNumber: data.license,
        address: { street: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
        isVerified: true,
        inventory: inventory,
        deliveryAvailable: true
      });
      console.log(`✅ Created Pharmacy: ${data.name} (${data.email})`);
    }

    console.log('Seeding Labs...');
    const labsData = [
      { name: 'Precision Diagnostics', email: 'lab1@seedtest.com', license: 'LAB-111' },
      { name: 'Metro Pathology Lab', email: 'lab2@seedtest.com', license: 'LAB-222' }
    ];

    for (const data of labsData) {
      const user = await User.create({
        fullName: data.name,
        email: data.email,
        password: 'Password123!',
        role: 'lab',
        isVerified: true,
        status: 'active'
      });

      // Assign all 4 tests to this lab's catalog
      const testCatalog = masterTests.map(test => ({
        testId: test._id,
        price: test.price,
        turnaroundTime: `${test.turnaroundTime.value} ${test.turnaroundTime.unit}` // Convert object to string for Lab schema
      }));

      await Lab.create({
        user: user._id,
        userId: user._id, 
        labName: data.name,
        licenseNumber: data.license,
        address: { street: '456 Health Ave', city: 'New York', state: 'NY', zipCode: '10002', country: 'USA' },
        isVerified: true,
        testCatalog: testCatalog,
        homeSampleCollection: { available: true, additionalCharge: 10 }
      });
      console.log(`✅ Created Lab: ${data.name} (${data.email})`);
    }

    console.log('\n🎉 Seeding complete!');
    console.log('Password for ALL accounts is: Password123!');
    console.log('Pharmacies: pharmacy1@seedtest.com, pharmacy2@seedtest.com, pharmacy3@seedtest.com');
    console.log('Labs: lab1@seedtest.com, lab2@seedtest.com');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    if(error.name === 'ValidationError') {
      console.error('Validation Details:', error.errors);
    }
    process.exit(1);
  }
};

seedDatabase();