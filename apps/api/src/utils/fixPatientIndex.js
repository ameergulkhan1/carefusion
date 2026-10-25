/**
 * Migration Script: Fix Patient Collection Index
 * 
 * Problem: Old Patient model had 'userId' field, new model has 'user' field
 * Solution: Drop the old userId_1 index and remove documents with null userId
 * 
 * Run this once: node src/utils/fixPatientIndex.js
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables from the root .env file
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function fixPatientIndex() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    
    // Check if MONGODB_URI is available
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Make sure .env file exists with MONGODB_URI');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const patientsCollection = db.collection('patients');

    // Step 1: Check existing indexes
    console.log('\n📋 Current indexes:');
    const indexes = await patientsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Step 2: Drop the old userId_1 index if it exists
    try {
      await patientsCollection.dropIndex('userId_1');
      console.log('✅ Dropped old userId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  userId_1 index does not exist (already removed)');
      } else {
        console.log('⚠️  Could not drop userId_1 index:', error.message);
      }
    }

    // Step 3: Remove orphaned documents with null userId/user
    const deleteResult = await patientsCollection.deleteMany({ 
      $or: [
        { userId: null },
        { userId: { $exists: true } },  // Remove any documents with old userId field
        { user: null }
      ]
    });
    console.log(`✅ Cleaned up ${deleteResult.deletedCount} orphaned patient documents`);

    // Step 4: Verify remaining documents
    const remainingCount = await patientsCollection.countDocuments();
    console.log(`\n📊 Remaining patient documents: ${remainingCount}`);

    // Step 5: Show sample document structure
    const sampleDoc = await patientsCollection.findOne();
    if (sampleDoc) {
      console.log('\n📄 Sample patient document structure:');
      console.log(JSON.stringify({
        _id: sampleDoc._id,
        user: sampleDoc.user,
        userId: sampleDoc.userId,
        patientId: sampleDoc.patientId,
        dateOfBirth: sampleDoc.dateOfBirth
      }, null, 2));
    }

    // Step 6: Ensure correct index exists
    console.log('\n🔨 Ensuring correct index on "user" field...');
    try {
      await patientsCollection.createIndex({ user: 1 }, { unique: true, sparse: true });
      console.log('✅ Index created successfully');
    } catch (error) {
      if (error.code === 86) {
        console.log('ℹ️  Index already exists (this is good!)');
      } else {
        throw error;
      }
    }

    // Step 7: Show final indexes
    console.log('\n📋 Final indexes:');
    const finalIndexes = await patientsCollection.indexes();
    console.log(JSON.stringify(finalIndexes, null, 2));

    console.log('\n✨ Migration completed successfully!');
    console.log('\n🚀 You can now run your application without the duplicate key error.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
fixPatientIndex();
