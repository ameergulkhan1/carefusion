// D:\carefusion\apps\api\src\config\multer.js
const multer = require('multer');
const path = require('path');

// Memory storage -> req.file.buffer (no filesystem writes; serverless-safe)
const storage = multer.memoryStorage();

// Allowed MIME types (must match Cloudinary resource types below)
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

// Optional extension guard (defense-in-depth alongside mimetype)
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
  const extOk = ALLOWED_EXTENSIONS.includes(ext);

  if (mimeOk && extOk) {
    return cb(null, true);
  }

  cb(
    new Error(
      `Invalid file type. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}. Received: ${file.mimetype} (${ext})`
    ),
    false
  );
};

// Max size (bytes). Default 10MB. Cloudinary free tier caps images at 10MB.
const MAX_FILE_SIZE =
  Number.parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024;

// Max files per request
const MAX_FILES = Number.parseInt(process.env.MAX_FILES, 10) || 5;

// Single Multer instance – reused everywhere
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

// Multer error handler (catch MulterError + filter errors)
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File size exceeds the maximum allowed limit of ${(
          MAX_FILE_SIZE /
          (1024 * 1024)
        ).toFixed(2)} MB.`,
        code: err.code,
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: `Too many files. Maximum ${MAX_FILES} allowed.`,
        code: err.code,
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload failed.',
    });
  }

  next();
};

// Named upload helpers
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadLabReport = upload.single('labReport');
const uploadDocument = upload.single('document');
const uploadMedicalRecord = upload.single('medicalRecord');
const uploadPrescription = upload.single('prescription');
const uploadProfilePicture = upload.single('profilePicture');
const uploadMultiple = upload.array('documents', MAX_FILES);

// Attach helpers (preserves upload.single(), upload.array(), etc.)
upload.uploadSingle = uploadSingle;
upload.uploadLabReport = uploadLabReport;
upload.uploadDocument = uploadDocument;
upload.uploadMedicalRecord = uploadMedicalRecord;
upload.uploadPrescription = uploadPrescription;
upload.uploadProfilePicture = uploadProfilePicture;
upload.uploadMultiple = uploadMultiple;
upload.handleUploadError = handleUploadError;
upload.MAX_FILE_SIZE = MAX_FILE_SIZE;
upload.MAX_FILES = MAX_FILES;
upload.ALLOWED_MIME_TYPES = ALLOWED_MIME_TYPES;
upload.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;

module.exports = upload;