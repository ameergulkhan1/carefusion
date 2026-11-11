
const mongoose = require('mongoose');

// ---------------------------------------------
// Doctor License Number Index Compatibility
// ---------------------------------------------
const ensureDoctorLicenseIndex = async () => {
  const doctorsCollection = mongoose.connection.collection('doctors');

  // Remove legacy null/empty values.
  await doctorsCollection.updateMany(
    {
      $or: [
        { licenseNumber: null },
        { licenseNumber: '' }
      ]
    },
    { $unset: { licenseNumber: 1 } }
  );

  const indexes = await doctorsCollection.indexes();
  const licenseIndex = indexes.find(
    (idx) => idx.name === 'licenseNumber_1'
  );

  const hasCompatibleIndex =
    licenseIndex &&
    licenseIndex.unique === true &&
    licenseIndex.sparse === true;

  if (!hasCompatibleIndex && licenseIndex) {
    await doctorsCollection.dropIndex('licenseNumber_1');
  }

  if (!hasCompatibleIndex) {
    await doctorsCollection.createIndex(
      { licenseNumber: 1 },
      {
        name: 'licenseNumber_1',
        unique: true,
        sparse: true
      }
    );
  }
};

// ---------------------------------------------
// Lab User ID Index Compatibility
// ---------------------------------------------
const ensureLabUserIndexCompatibility = async () => {
  const labsCollection = mongoose.connection.collection('labs');

  // Backfill legacy userId from user.
  const labsMissingUserId = await labsCollection
    .find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ],
      user: { $exists: true, $ne: null }
    })
    .project({ _id: 1, user: 1 })
    .toArray();

  if (labsMissingUserId.length > 0) {
    await labsCollection.bulkWrite(
      labsMissingUserId.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: { userId: doc.user }
          }
        }
      }))
    );
  }

  const indexes = await labsCollection.indexes();
  const userIdIndex = indexes.find(
    (idx) => idx.name === 'userId_1'
  );

  const hasCompatibleUserIdIndex =
    userIdIndex &&
    userIdIndex.unique === true &&
    userIdIndex.sparse === true;

  if (!hasCompatibleUserIdIndex && userIdIndex) {
    await labsCollection.dropIndex('userId_1');
  }

  if (!hasCompatibleUserIdIndex) {
    await labsCollection.createIndex(
      { userId: 1 },
      {
        name: 'userId_1',
        unique: true,
        sparse: true
      }
    );
  }
};

// ---------------------------------------------
// Lab License Number Index Compatibility
// ---------------------------------------------
const ensureLabLicenseIndexCompatibility = async () => {
  const labsCollection = mongoose.connection.collection('labs');

  // Remove legacy null/empty values.
  await labsCollection.updateMany(
    {
      $or: [
        { licenseNumber: null },
        { licenseNumber: '' }
      ]
    },
    { $unset: { licenseNumber: 1 } }
  );

  const indexes = await labsCollection.indexes();
  const licenseIndex = indexes.find(
    (idx) => idx.name === 'licenseNumber_1'
  );

  const hasCompatibleLicenseIndex =
    licenseIndex &&
    licenseIndex.unique === true &&
    licenseIndex.sparse === true;

  if (!hasCompatibleLicenseIndex && licenseIndex) {
    await labsCollection.dropIndex('licenseNumber_1');
  }

  if (!hasCompatibleLicenseIndex) {
    await labsCollection.createIndex(
      { licenseNumber: 1 },
      {
        name: 'licenseNumber_1',
        unique: true,
        sparse: true
      }
    );
  }
};

// ---------------------------------------------
// MongoDB Connection
// ---------------------------------------------
const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  // Validate environment variable before connecting.
  if (!mongoUri || typeof mongoUri !== 'string') {
    throw new Error(
      'MONGODB_URI environment variable is missing or invalid.'
    );
  }

  try {
    const conn = await mongoose.connect(mongoUri);

    console.log(
      `✅ MongoDB Connected: ${conn.connection.host}`
    );

    // Verify and maintain database index compatibility.
    await ensureDoctorLicenseIndex();
    console.log('✅ Doctor licenseNumber index verified');

    await ensureLabUserIndexCompatibility();
    console.log('✅ Lab userId index compatibility verified');

    await ensureLabLicenseIndexCompatibility();
    console.log('✅ Lab licenseNumber index verified');

    // Connection event handlers.
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    return conn;

  } catch (error) {
    console.error(
      '❌ MongoDB connection or initialization failed:',
      error.message
    );

    // Let the application entry point handle the error.
    throw error;
  }
};

module.exports = connectDB;
