
const multer = require('multer');
const path = require('path');

// Store uploaded files in memory.
// This avoids writing files to Vercel's serverless filesystem.
const storage = multer.memoryStorage();

// Allowed file types
const allowedTypes = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
];

// File filter
const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed.'),
      false
    );
  }
};

// Maximum file size: 10 MB by default
const maxFileSize = Number.parseInt(
  process.env.MAX_FILE_SIZE,
  10
) || 10 * 1024 * 1024;

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSize,
    files: 5,
  },
});

// Upload helpers
const uploadSingle = (fieldName) => upload.single(fieldName);

const uploadLabReport = upload.single('labReport');

const uploadDocument = upload.single('document');

const uploadMedicalRecord = upload.single('medicalRecord');

const uploadPrescription = upload.single('prescription');

const uploadProfilePicture = upload.single('profilePicture');

const uploadMultiple = upload.array('documents', 5);

// Multer error handler
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the maximum allowed limit of ${
          maxFileSize / (1024 * 1024)
        } MB.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
      code: error.code,
    });
  }

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed.',
    });
  }

  next();
};

// Export helpers while preserving existing upload.single(), upload.array()
// and other Multer methods.
upload.uploadSingle = uploadSingle;
upload.uploadLabReport = uploadLabReport;
upload.uploadDocument = uploadDocument;
upload.uploadMedicalRecord = uploadMedicalRecord;
upload.uploadPrescription = uploadPrescription;
upload.uploadProfilePicture = uploadProfilePicture;
upload.uploadMultiple = uploadMultiple;
upload.handleUploadError = handleUploadError;

module.exports = upload;
