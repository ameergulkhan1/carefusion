

const multer = require('../config/multer');
const cloudinaryHelpers = require('./upload');

// Re-export everything from multer config
module.exports = multer;

// Attach Cloudinary helpers onto the exported object for convenience
module.exports.uploadToCloudinary = cloudinaryHelpers.uploadToCloudinary;
module.exports.uploadManyToCloudinary = cloudinaryHelpers.uploadManyToCloudinary;
module.exports.uploadBufferToCloudinary = cloudinaryHelpers.uploadBufferToCloudinary;
module.exports.destroyCloudinaryFile = cloudinaryHelpers.destroyCloudinaryFile;
module.exports.cloudinary = cloudinaryHelpers.cloudinary;
module.exports.FOLDER_MAP = cloudinaryHelpers.FOLDER_MAP;

// Make sure handleUploadError is present (it is, from multer, but be explicit)
module.exports.handleUploadError = multer.handleUploadError;