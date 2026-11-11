// apps/api/src/middleware/upload.middleware.js
/**
 * Backward-compatible upload layer.
 *
 * Responsibilities:
 *  - Re-export the multer instance from config/multer.js
 *    (memoryStorage, file filters, size limits, handleUploadError)
 *  - Re-export the Cloudinary helpers from utils/uploadToCloudinary.js
 *
 * Existing route code that did:
 *     const upload = require('./middleware/upload.middleware');
 *     router.post('/x', upload.uploadLabReport, upload.uploadToCloudinary, handler)
 * keeps working unchanged.
 */

const multer = require('../config/multer');
const cloudinaryHelpers = require('../utils/uploadToCloudinary');

// Base export = multer instance (so upload.single(), upload.array(), etc. work)
module.exports = multer;

// Attach Cloudinary helpers
module.exports.uploadToCloudinary        = cloudinaryHelpers.uploadToCloudinary;
module.exports.uploadManyToCloudinary    = cloudinaryHelpers.uploadManyToCloudinary;
module.exports.uploadBufferToCloudinary  = cloudinaryHelpers.uploadBufferToCloudinary;
module.exports.destroyCloudinaryFile     = cloudinaryHelpers.destroyCloudinaryFile;
module.exports.cloudinary                = cloudinaryHelpers.cloudinary;
module.exports.FOLDER_MAP                = cloudinaryHelpers.FOLDER_MAP;

// Multer error handler (single source of truth is config/multer.js)
module.exports.handleUploadError = multer.handleUploadError;