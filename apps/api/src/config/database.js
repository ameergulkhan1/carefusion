const mongoose = require('mongoose');

// ---------------------------------------------
// Index compatibility helpers — run ONCE per cold start
// ---------------------------------------------
const ensureDoctorLicenseIndex = async () => {
  try {
    const doctorsCollection = mongoose.connection.collection('doctors');
    await doctorsCollection.updateMany(
      { $or: [{ licenseNumber: null }, { licenseNumber: '' }] },
      { $unset: { licenseNumber: 1 } }
    );
    const indexes = await doctorsCollection.indexes();
    const licenseIndex = indexes.find((idx) => idx.name === 'licenseNumber_1');
    const hasCompatible =
      licenseIndex && licenseIndex.unique === true && licenseIndex.sparse === true;
    if (!hasCompatible && licenseIndex) {
      await doctorsCollection.dropIndex('licenseNumber_1');
    }
    if (!hasCompatible) {
      await doctorsCollection.createIndex(
        { licenseNumber: 1 },
        { name: 'licenseNumber_1', unique: true, sparse: true }
      );
    }
  } catch (err) {
    // Index ops are best-effort; don't fail the request
    console.warn('⚠️ Doctor licenseNumber index check skipped:', err.message);
  }
};

const ensureLabUserIndexCompatibility = async () => {
  try {
    const labsCollection = mongoose.connection.collection('labs');
    const labsMissingUserId = await labsCollection
      .find({
        $or: [{ userId: { $exists: false } }, { userId: null }],
        user: { $exists: true, $ne: null },
      })
      .project({ _id: 1, user: 1 })
      .toArray();

    if (labsMissingUserId.length > 0) {
      await labsCollection.bulkWrite(
        labsMissingUserId.map((doc) => ({
          updateOne: { filter: { _id: doc._id }, update: { $set: { userId: doc.user } } },
        }))
      );
    }

    const indexes = await labsCollection.indexes();
    const userIdIndex = indexes.find((idx) => idx.name === 'userId_1');
    const hasCompatible =
      userIdIndex && userIdIndex.unique === true && userIdIndex.sparse === true;
    if (!hasCompatible && userIdIndex) {
      await labsCollection.dropIndex('userId_1');
    }
    if (!hasCompatible) {
      await labsCollection.createIndex(
        { userId: 1 },
        { name: 'userId_1', unique: true, sparse: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ Lab userId index check skipped:', err.message);
  }
};

const ensureLabLicenseIndexCompatibility = async () => {
  try {
    const labsCollection = mongoose.connection.collection('labs');
    await labsCollection.updateMany(
      { $or: [{ licenseNumber: null }, { licenseNumber: '' }] },
      { $unset: { licenseNumber: 1 } }
    );
    const indexes = await labsCollection.indexes();
    const licenseIndex = indexes.find((idx) => idx.name === 'licenseNumber_1');
    const hasCompatible =
      licenseIndex && licenseIndex.unique === true && licenseIndex.sparse === true;
    if (!hasCompatible && licenseIndex) {
      await labsCollection.dropIndex('licenseNumber_1');
    }
    if (!hasCompatible) {
      await labsCollection.createIndex(
        { licenseNumber: 1 },
        { name: 'licenseNumber_1', unique: true, sparse: true }
      );
    }
  } catch (err) {
    console.warn('⚠️ Lab licenseNumber index check skipped:', err.message);
  }
};

// ---------------------------------------------
// Cached connection — serverless-safe
// ---------------------------------------------
let cached = global.__mongooseCache;
if (!cached) {
  cached = global.__mongooseCache = { conn: null, promise: null, indexesReady: false };
}

const connectDB = async () => {
  // Fast path: already connected in this warm container
  if (cached.conn) return cached.conn;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is missing.');
  }

  // Reuse an in-flight connection attempt across concurrent requests
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(mongoUri, {
        maxPoolSize: 5,                    // Lambda-friendly
        serverSelectionTimeoutMS: 5000,    // Fail fast if Atlas unreachable
        socketTimeoutMS: 45000,            // Well under Vercel's 10s per-request limit for most queries
        bufferCommands: false,             // Don't queue queries when disconnected — fail immediately
      })
      .then((m) => {
        console.log(`✅ MongoDB Connected: ${m.connection.host}`);
        return m;
      })
      .catch((err) => {
        cached.promise = null;             // Allow retry on next request
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    throw err;
  }

  // One-time index maintenance per cold container — NOT per request
  if (!cached.indexesReady) {
    cached.indexesReady = true;            // Set BEFORE await so concurrent requests don't repeat
    try {
      await ensureDoctorLicenseIndex();
      await ensureLabUserIndexCompatibility();
      await ensureLabLicenseIndexCompatibility();
      console.log('✅ Database indexes verified');
    } catch (err) {
      console.warn('⚠️ Index verification partially failed:', err.message);
    }
  }

  return cached.conn;
};

module.exports = connectDB;