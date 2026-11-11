// apps/api/src/utils/uploadToCloudinary.js
const cloudinary = require('../config/cloudinary');

const FOLDER_MAP = {
  labReport: 'carefusion/lab-reports',
  medicalRecord: 'carefusion/medical-records',
  prescription: 'carefusion/prescriptions',
  document: 'carefusion/documents',
  profilePicture: 'carefusion/profile-images',
  documents: 'carefusion/documents',
};

function resolveResourceType(mimetype = '') {
  // 'auto' lets Cloudinary pick image vs raw and gives PDFs a thumbnail.
  // Change to 'raw' if you never want thumbnails and want extension-less URLs.
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'auto';
  return 'auto'; // doc, docx, etc.
}

function sanitizeName(name = 'file') {
  return String(name)
    .replace(/\.[^/.]+$/, '') // strip extension
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

/**
 * Upload a single buffer to Cloudinary.
 * @param {{ buffer: Buffer, mimetype: string, originalname: string, fieldname?: string }} file
 * @param {string|object} folderOrOptions  folder string OR full options object
 * @returns {Promise<object>} Cloudinary result
 */
function uploadBufferToCloudinary(file, folderOrOptions = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !Buffer.isBuffer(file.buffer)) {
      return reject(new Error('uploadBufferToCloudinary: missing file.buffer'));
    }

    const overrides =
      typeof folderOrOptions === 'string'
        ? { folder: folderOrOptions }
        : folderOrOptions || {};

    const folder =
      overrides.folder ||
      FOLDER_MAP[file.fieldname] ||
      'carefusion/general';

    const options = {
      folder,
      resource_type: resolveResourceType(file.mimetype),
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizeName(
        file.originalname
      )}`,
      overwrite: false,
      unique_filename: true,
      ...overrides,
    };

    // Image-only optimizations; Cloudinary rejects these for raw/pdf
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      options.transformation = options.transformation || [
        { quality: 'auto', fetch_format: 'auto' },
      ];
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => (error ? reject(error) : resolve(result))
    );

    // ✅ Correct way to feed a Buffer into upload_stream:
    //    upload_stream returns a Writable; .end(buffer) writes it and closes.
    uploadStream.end(file.buffer);
  });
}

/**
 * Express middleware — single file.
 * Expects multer.memoryStorage() to have populated req.file.buffer.
 */
async function uploadToCloudinary(req, res, next) {
  try {
    if (!req.file) return next();
    const result = await uploadBufferToCloudinary(req.file);
    req.file.cloudinary = {
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
    };
    req.cloudinaryFile = req.file.cloudinary;
    req.uploadedFiles = [req.file.cloudinary];
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Express middleware — multiple files (req.files).
 */
async function uploadManyToCloudinary(req, res, next) {
  try {
    const files = req.files || [];
    if (!files.length) return next();
    req.uploadedFiles = await Promise.all(
      files.map((f) =>
        uploadBufferToCloudinary(f).then((r) => ({
          url: r.secure_url,
          publicId: r.public_id,
          resourceType: r.resource_type,
          format: r.format,
          bytes: r.bytes,
          originalName: f.originalname,
          mimetype: f.mimetype,
        }))
      )
    );
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a file from Cloudinary by public_id.
 * @param {string} publicId
 * @param {'image'|'raw'|'video'} resourceType
 */
async function destroyCloudinaryFile(publicId, resourceType = 'image') {
  if (!publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (err) {
    console.error('Cloudinary destroy failed:', publicId, err.message);
    return null;
  }
}

// ✅ Export an OBJECT so `require('./upload').uploadToCloudinary` works.
module.exports = {
  cloudinary,
  FOLDER_MAP,
  uploadBufferToCloudinary,
  uploadToCloudinary,
  uploadManyToCloudinary,
  destroyCloudinaryFile,
};