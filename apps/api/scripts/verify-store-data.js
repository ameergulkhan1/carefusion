/**
 * Verification script to check medicines and lab tests in pharmacies and labs
 * Run: node scripts/verify-store-data.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Pharmacy = require('../src/models/Pharmacy');
const Lab = require('../src/models/Lab');
const Medicine = require('../src/models/Medicine');
const LabTest = require('../src/models/LabTest');

async function verifyStoreData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clinixsol', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB\n');

    // ==================== PHARMACIES ====================
    console.log('🏪 PHARMACY DATA VERIFICATION');
    console.log('='.repeat(60));

    const pharmacies = await Pharmacy.find({ isVerified: true })
      .populate('inventory.medicineId');

    for (const pharmacy of pharmacies) {
      console.log(`\n📍 Pharmacy: ${pharmacy.pharmacyName}`);
      console.log(`   Email: ${pharmacy.owner?.email}`);
      console.log(`   Location: ${pharmacy.location}`);
      console.log(`   Verified: ${pharmacy.isVerified}`);
      console.log(`   Total Inventory Items: ${pharmacy.inventory.length}`);
      
      if (pharmacy.inventory.length > 0) {
        console.log(`   \n   Medicines in Stock:`);
        pharmacy.inventory.slice(0, 5).forEach((item, idx) => {
          const medicine = item.medicineId;
          if (medicine) {
            console.log(`   ${idx + 1}. ${medicine.name} (${medicine.strength}) - Rs. ${item.price || medicine.price || 'N/A'} | Stock: ${item.stock}`);
          }
        });
        if (pharmacy.inventory.length > 5) {
          console.log(`   ... and ${pharmacy.inventory.length - 5} more medicines`);
        }
      }
    }

    // Add medicines to unlinked pharmacies if needed
    const allPharmacies = await Pharmacy.find({});
    console.log(`\n\n📊 Total Pharmacies in Database: ${allPharmacies.length}`);
    
    for (const pharmacy of allPharmacies) {
      if (pharmacy.inventory.length === 0 && pharmacy.isVerified) {
        console.log(`\n⚠️  Pharmacy "${pharmacy.pharmacyName}" has no medicines! Adding now...`);
        
        const medicines = await Medicine.find({});
        for (const medicine of medicines) {
          pharmacy.inventory.push({
            medicineId: medicine._id,
            stock: 5,
            price: medicine.price || 200
          });
        }
        await pharmacy.save();
        console.log(`✅ Added ${medicines.length} medicines to ${pharmacy.pharmacyName}`);
      }
    }

    // ==================== LABORATORIES ====================
    console.log('\n\n🔬 LABORATORY DATA VERIFICATION');
    console.log('='.repeat(60));

    const labs = await Lab.find({ isVerified: true })
      .populate('testCatalog.testId');

    for (const lab of labs) {
      console.log(`\n🏥 Lab: ${lab.labName}`);
      console.log(`   Email: ${lab.owner?.email}`);
      console.log(`   Location: ${lab.location}`);
      console.log(`   Verified: ${lab.isVerified}`);
      console.log(`   Total Tests Available: ${lab.testCatalog?.length || 0}`);
      
      if (lab.testCatalog && lab.testCatalog.length > 0) {
        console.log(`   \n   Available Tests:`);
        lab.testCatalog.slice(0, 5).forEach((catalog, idx) => {
          const test = catalog.testId;
          console.log(`   ${idx + 1}. ${test.testName} (${test.testCode}) - Rs. ${test.price} | TAT: ${test.turnaroundTime.value} ${test.turnaroundTime.unit}`);
        });
        if (lab.testCatalog.length > 5) {
          console.log(`   ... and ${lab.testCatalog.length - 5} more tests`);
        }
      }
    }

    // Add tests to unlinked labs if needed
    const allLabs = await Lab.find({});
    console.log(`\n\n📊 Total Labs in Database: ${allLabs.length}`);

    for (const lab of allLabs) {
      if ((!lab.testCatalog || lab.testCatalog.length === 0) && lab.isVerified) {
        console.log(`\n⚠️  Lab "${lab.labName}" has no tests! Adding now...`);
        
        const tests = await LabTest.find({});
        lab.testCatalog = tests.map(test => ({
          testId: test._id,
          price: test.price,
          turnaroundTime: `${test.turnaroundTime.value} ${test.turnaroundTime.unit}`
        }));
        await lab.save();
        console.log(`✅ Added ${tests.length} tests to ${lab.labName}`);
      }
    }

    // ==================== SUMMARY ====================
    console.log('\n\n📈 SUMMARY');
    console.log('='.repeat(60));

    const medicines = await Medicine.find({});
    const labTests = await LabTest.find({});
    
    console.log(`\n📦 Total Medicines in Database: ${medicines.length}`);
    medicines.slice(0, 5).forEach((med, idx) => {
      console.log(`   ${idx + 1}. ${med.name} - Rs. ${med.price || 'N/A'}`);
    });

    console.log(`\n🧪 Total Lab Tests in Database: ${labTests.length}`);
    labTests.slice(0, 5).forEach((test, idx) => {
      console.log(`   ${idx + 1}. ${test.testName} - Rs. ${test.price}`);
    });

    const totalPharmacies = await Pharmacy.countDocuments({ isVerified: true });
    const totalLabs = await Lab.countDocuments({ isVerified: true });

    console.log(`\n🏪 Verified Pharmacies: ${totalPharmacies}`);
    console.log(`🔬 Verified Labs: ${totalLabs}`);

    console.log('\n✅ Verification Complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error verifying data:', error);
    process.exit(1);
  }
}

verifyStoreData();
