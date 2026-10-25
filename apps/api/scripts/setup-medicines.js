/**
 * Setup script to populate medicines in the database and add them to pharmacies
 * Run: node scripts/setup-medicines.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Medicine = require('../src/models/Medicine');
const Pharmacy = require('../src/models/Pharmacy');
const User = require('../src/models/User');

// Sample medicines database
const SAMPLE_MEDICINES = [
  // Pain Relief & Anti-inflammatory
  {
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    manufacturer: 'GlaxoSmithKline',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '500mg',
    description: 'Pain reliever and fever reducer',
    sideEffects: 'Rare side effects when used as directed',
    precautions: 'Do not exceed recommended dose',
    prescriptionRequired: false,
    activeIngredients: [{ name: 'Paracetamol', quantity: '500mg' }],
    storageInstructions: 'Store at room temperature',
    expiryWarningDays: 90
  },
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    manufacturer: 'Pfizer',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '400mg',
    description: 'Anti-inflammatory pain reliever',
    sideEffects: 'Stomach upset, heartburn',
    precautions: 'Take with food, avoid on empty stomach',
    prescriptionRequired: false,
    activeIngredients: [{ name: 'Ibuprofen', quantity: '400mg' }],
    storageInstructions: 'Store at room temperature away from moisture',
    expiryWarningDays: 90
  },
  {
    name: 'Aspirin',
    genericName: 'Acetylsalicylic acid',
    manufacturer: 'Bayer',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '75mg',
    description: 'Blood thinner and pain reliever',
    sideEffects: 'Stomach upset, increased bleeding',
    precautions: 'Not suitable for people with bleeding disorders',
    prescriptionRequired: false,
    activeIngredients: [{ name: 'Aspirin', quantity: '75mg' }],
    storageInstructions: 'Cool, dry place',
    expiryWarningDays: 90
  },

  // Cough & Cold
  {
    name: 'Dextromethorphan Syrup',
    genericName: 'Dextromethorphan',
    manufacturer: 'Robitussin',
    category: 'Syrup',
    dosageForm: 'Liquid',
    strength: '10mg/5ml',
    description: 'Cough suppressant',
    sideEffects: 'Drowsiness, dizziness',
    precautions: 'Not for children under 4 years',
    prescriptionRequired: false,
    activeIngredients: [{ name: 'Dextromethorphan', quantity: '10mg/5ml' }],
    storageInstructions: 'Store in cool place, shake well before use',
    expiryWarningDays: 120
  },
  {
    name: 'Antihistamine Tablet',
    genericName: 'Cetirizine',
    manufacturer: 'Cipla',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '10mg',
    description: 'Allergy relief medicine',
    sideEffects: 'Drowsiness, headache',
    precautions: 'May cause drowsiness, avoid driving',
    prescriptionRequired: false,
    activeIngredients: [{ name: 'Cetirizine', quantity: '10mg' }],
    storageInstructions: 'Store at room temperature',
    expiryWarningDays: 90
  },

  // Digestive Health
  {
    name: 'Metformin',
    genericName: 'Metformin',
    manufacturer: 'Merck',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '500mg',
    description: 'Diabetes management medication',
    sideEffects: 'Nausea, diarrhea, stomach upset',
    precautions: 'Requires kidney function monitoring',
    prescriptionRequired: true,
    activeIngredients: [{ name: 'Metformin', quantity: '500mg' }],
    storageInstructions: 'Cool, dry place',
    expiryWarningDays: 90
  },
  {
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    manufacturer: 'AstraZeneca',
    category: 'Capsule',
    dosageForm: 'Capsule',
    strength: '20mg',
    description: 'Acid reflux and heartburn relief',
    sideEffects: 'Headache, diarrhea',
    precautions: 'May reduce vitamin B12 absorption',
    prescriptionRequired: false,
    activeIngredients: [{ name: 'Omeprazole', quantity: '20mg' }],
    storageInstructions: 'Store at room temperature',
    expiryWarningDays: 90
  },

  // Antibiotics
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    manufacturer: 'Augmentin',
    category: 'Capsule',
    dosageForm: 'Capsule',
    strength: '500mg',
    description: 'Broad-spectrum antibiotic',
    sideEffects: 'Nausea, diarrhea, rash',
    precautions: 'Allergic reaction risk, complete full course',
    prescriptionRequired: true,
    activeIngredients: [{ name: 'Amoxicillin', quantity: '500mg' }],
    storageInstructions: 'Refrigerate after mixing, use within 10 days',
    expiryWarningDays: 120
  },
  {
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin',
    manufacturer: 'Cipro',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '500mg',
    description: 'Fluoroquinolone antibiotic',
    sideEffects: 'Nausea, tendon pain',
    precautions: 'Avoid in children, complete full course',
    prescriptionRequired: true,
    activeIngredients: [{ name: 'Ciprofloxacin', quantity: '500mg' }],
    storageInstructions: 'Room temperature, away from light',
    expiryWarningDays: 90
  },

  // Blood Pressure & Heart
  {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    manufacturer: 'Merck',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '10mg',
    description: 'ACE inhibitor for blood pressure control',
    sideEffects: 'Dry cough, dizziness',
    precautions: 'Regular blood pressure monitoring required',
    prescriptionRequired: true,
    activeIngredients: [{ name: 'Lisinopril', quantity: '10mg' }],
    storageInstructions: 'Cool, dry place',
    expiryWarningDays: 90
  },
  {
    name: 'Amlodipine',
    genericName: 'Amlodipine',
    manufacturer: 'Pfizer',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '5mg',
    description: 'Calcium channel blocker for hypertension',
    sideEffects: 'Swelling in feet, flushing',
    precautions: 'May interact with grapefruit juice',
    prescriptionRequired: true,
    activeIngredients: [{ name: 'Amlodipine', quantity: '5mg' }],
    storageInstructions: 'Room temperature',
    expiryWarningDays: 90
  },

  // Thyroid & Hormones
  {
    name: 'Levothyroxine',
    genericName: 'Levothyroxine',
    manufacturer: 'AbbVie',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '50mcg',
    description: 'Thyroid hormone replacement',
    sideEffects: 'Increased heart rate, anxiety',
    precautions: 'Take on empty stomach, regular TSH monitoring',
    prescriptionRequired: true,
    activeIngredients: [{ name: 'Levothyroxine', quantity: '50mcg' }],
    storageInstructions: 'Room temperature, away from moisture',
    expiryWarningDays: 90
  },

  // Vitamins & Supplements
  {
    name: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    manufacturer: 'Nature Made',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '1000IU',
    description: 'Vitamin D supplement for bone health',
    sideEffects: 'None at normal doses',
    precautions: 'Do not exceed recommended dose',
    prescriptionRequired: false,
    activeIngredients: [{ name: 'Vitamin D3', quantity: '1000IU' }],
    storageInstructions: 'Cool, dry place',
    expiryWarningDays: 365
  },
  {
    name: 'Multivitamin',
    genericName: 'Multivitamin complex',
    manufacturer: 'Centrum',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: 'Complex',
    description: 'Complete multivitamin and mineral supplement',
    sideEffects: 'Nausea if taken on empty stomach',
    precautions: 'Take with food',
    prescriptionRequired: false,
    activeIngredients: [
      { name: 'Vitamin A', quantity: '750mcg' },
      { name: 'Vitamin C', quantity: '60mg' },
      { name: 'Vitamin D', quantity: '400IU' }
    ],
    storageInstructions: 'Cool, dry place',
    expiryWarningDays: 365
  },

  // Topical
  {
    name: 'Hydrocortisone Cream',
    genericName: 'Hydrocortisone',
    manufacturer: 'Various',
    category: 'Cream',
    dosageForm: 'Topical Cream',
    strength: '1%',
    description: 'Topical steroid for skin inflammation',
    sideEffects: 'Skin thinning with prolonged use',
    precautions: 'Not for long-term use, avoid sensitive areas',
    prescriptionRequired: false,
    activeIngredients: [{ name: 'Hydrocortisone', quantity: '1%' }],
    storageInstructions: 'Room temperature',
    expiryWarningDays: 90
  },

  // Mental Health
  {
    name: 'Sertraline',
    genericName: 'Sertraline',
    manufacturer: 'Pfizer',
    category: 'Tablet',
    dosageForm: 'Tablet',
    strength: '50mg',
    description: 'SSRI antidepressant',
    sideEffects: 'Nausea, weight changes, sexual dysfunction',
    precautions: 'Do not stop suddenly, regular monitoring required',
    prescriptionRequired: true,
    activeIngredients: [{ name: 'Sertraline', quantity: '50mg' }],
    storageInstructions: 'Room temperature',
    expiryWarningDays: 90
  }
];

// Connect to MongoDB and setup medicines
async function setupMedicines() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clinixsol', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing medicines (optional - comment out if you want to keep existing)
    // await Medicine.deleteMany({});
    // console.log('Cleared existing medicines');

    // Add medicines
    const createdMedicines = [];
    for (const medicineData of SAMPLE_MEDICINES) {
      const existing = await Medicine.findOne({ name: medicineData.name });
      if (!existing) {
        const medicine = await Medicine.create(medicineData);
        createdMedicines.push(medicine);
        console.log(`✅ Created: ${medicine.name}`);
      } else {
        createdMedicines.push(existing);
        console.log(`⏭️  Already exists: ${existing.name}`);
      }
    }

    console.log(`\n📊 Total medicines: ${createdMedicines.length}`);

    // Get all verified pharmacies
    const pharmacies = await Pharmacy.find({ isVerified: true });
    console.log(`\n🏥 Found ${pharmacies.length} verified pharmacies`);

    // Add medicines to pharmacy inventory
    for (const pharmacy of pharmacies) {
      for (const medicine of createdMedicines) {
        const existingItem = pharmacy.inventory.find(
          item => item.medicineId?.toString() === medicine._id.toString()
        );

        if (!existingItem) {
          pharmacy.inventory.push({
            medicineId: medicine._id,
            stock: Math.floor(Math.random() * 100) + 20, // Random stock between 20-120
            price: Math.floor(Math.random() * 200) + 50 // Random price between 50-250
          });
        }
      }
      
      await pharmacy.save();
      console.log(`✅ Updated inventory for: ${pharmacy.pharmacyName}`);
    }

    console.log('\n✅ Medicine setup completed successfully!');
    console.log(`\n📋 Summary:`);
    console.log(`   - Medicines created/updated: ${createdMedicines.length}`);
    console.log(`   - Pharmacies updated: ${pharmacies.length}`);
    console.log(`   - Total inventory items: ${pharmacies.reduce((acc, p) => acc + p.inventory.length, 0)}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error setting up medicines:', error);
    process.exit(1);
  }
}

setupMedicines();
