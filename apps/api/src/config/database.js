const mongoose = require('mongoose');

const ensureDoctorLicenseIndex = async () => {
  const doctorsCollection = mongoose.connection.collection('doctors');

  // Remove legacy null/empty values so sparse+partial unique index is safe.
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
  const licenseIndex = indexes.find((idx) => idx.name === 'licenseNumber_1');

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

const ensureLabUserIndexCompatibility = async () => {
  const labsCollection = mongoose.connection.collection('labs');

  // Backfill legacy `userId` from `user` for existing documents.
  const labsMissingUserId = await labsCollection
    .find({
      $or: [{ userId: { $exists: false } }, { userId: null }],
      user: { $exists: true, $ne: null }
    })
    .project({ _id: 1, user: 1 })
    .toArray();

  if (labsMissingUserId.length > 0) {
    await labsCollection.bulkWrite(
      labsMissingUserId.map((doc) => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { userId: doc.user } }
        }
      }))
    );
  }

  const indexes = await labsCollection.indexes();
  const userIdIndex = indexes.find((idx) => idx.name === 'userId_1');
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

const ensureLabLicenseIndexCompatibility = async () => {
  const labsCollection = mongoose.connection.collection('labs');

  // Remove legacy null/empty values so sparse unique index remains safe.
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
  const licenseIndex = indexes.find((idx) => idx.name === 'licenseNumber_1');
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

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await ensureDoctorLicenseIndex();
    console.log('✅ Doctor licenseNumber index verified');
    await ensureLabUserIndexCompatibility();
    console.log('✅ Lab userId index compatibility verified');
    await ensureLabLicenseIndexCompatibility();
    console.log('✅ Lab licenseNumber index compatibility verified');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
