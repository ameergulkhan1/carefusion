
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(
    new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'),
    false
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
  },
});

const uploadSingle = (fieldName) => upload.single(fieldName);

const uploadLabReport = upload.single('labReport');
const uploadDocument = upload.single('document');
const uploadMultiple = upload.array('documents', 5);

const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit',
      });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 5 allowed',
      });
    }

    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  next();
};

upload.uploadSingle = uploadSingle;
upload.uploadDocument = uploadDocument;
upload.uploadLabReport = uploadLabReport;
upload.uploadMultiple = uploadMultiple;
upload.handleUploadError = handleUploadError;

module.exports = upload;
