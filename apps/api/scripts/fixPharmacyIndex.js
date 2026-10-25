const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Pharmacy = require('../src/models/Pharmacy');

async function fixPharmacyIndex() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/clinixsol');
    console.log('✅ Connected to MongoDB');

    // Get the Pharmacy collection
    const collection = mongoose.connection.collection('pharmacies');

    // Step 1: Drop the problematic unique index on licenseNumber
    console.log('Dropping existing indexes on licenseNumber...');
    try {
      await collection.dropIndex('licenseNumber_1');
      console.log('✅ Dropped licenseNumber_1 index');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('⚠️ Index licenseNumber_1 not found (already dropped)');
      } else {
        console.error('❌ Error dropping index:', err.message);
      }
    }

    // Step 2: Remove duplicate null entries - Keep only the first one per user
    console.log('Cleaning up duplicate null licenseNumbers...');
    const duplicates = await collection.aggregate([
      {
        $match: { licenseNumber: null }
      },
      {
        $group: {
          _id: null,
          ids: { $push: '$_id' },
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    if (duplicates.length > 0 && duplicates[0].count > 1) {
      const idsToDelete = duplicates[0].ids.slice(1); // Keep the first one, delete the rest
      const result = await collection.deleteMany({
        _id: { $in: idsToDelete }
      });
      console.log(`✅ Deleted ${result.deletedCount} duplicate null entries`);
    } else {
      console.log('✅ No duplicate null entries found');
    }

    // Step 3: Create a new sparse (non-unique) index on licenseNumber
    console.log('Creating new sparse index on licenseNumber...');
    await collection.createIndex({ licenseNumber: 1 }, { sparse: true });
    console.log('✅ Created sparse index on licenseNumber');

    // Step 4: Verify the fix
    console.log('\nVerifying fix...');
    const pharmacies = await Pharmacy.find({ licenseNumber: null }).countDocuments();
    console.log(`📊 Pharmacies with null licenseNumber: ${pharmacies}`);

    const allPharmacies = await Pharmacy.countDocuments();
    console.log(`📊 Total pharmacies: ${allPharmacies}`);

    console.log('\n✅ Database cleanup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
  }
}

fixPharmacyIndex();
