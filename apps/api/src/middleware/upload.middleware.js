const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_PATH || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration — saves to disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subDir = 'general';

    if (file.fieldname === 'prescription') subDir = 'prescriptions';
    else if (file.fieldname === 'labReport') subDir = 'lab-reports';
    else if (file.fieldname === 'medicalRecord') subDir = 'medical-records';
    else if (file.fieldname === 'profilePicture') subDir = 'profiles';
    else if (file.fieldname === 'document') subDir = 'documents';

    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }

    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Middleware for single file uploads — parameterized field name
const uploadSingle = (fieldName) => upload.single(fieldName);

// Specific middlewares
const uploadLabReport = upload.single('labReport');
const uploadDocument = upload.single('document');
const uploadMultiple = upload.array('documents', 5);

// Error handling middleware
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size exceeds 10MB limit' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ success: false, message: 'Too many files. Max 5 allowed' });
    }
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// Export — supports BOTH old and new usage patterns
upload.uploadSingle = uploadSingle;
upload.uploadDocument = uploadDocument;
upload.uploadLabReport = uploadLabReport;
upload.uploadMultiple = uploadMultiple;
upload.handleUploadError = handleUploadError;

module.exports = upload;