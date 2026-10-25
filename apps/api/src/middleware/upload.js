const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { AppError } = require('./errorHandler');

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on file type or request
    if (req.body.uploadType === 'prescription' || file.fieldname === 'prescription') {
      uploadPath = 'uploads/prescriptions/';
    } else if (req.body.uploadType === 'lab-report' || file.fieldname === 'labReport') {
      uploadPath = 'uploads/lab-reports/';
    } else if (req.body.uploadType === 'document' || file.fieldname === 'document') {
      uploadPath = 'uploads/documents/';
    } else if (req.body.uploadType === 'profile' || file.fieldname === 'profileImage') {
      uploadPath = 'uploads/profile-images/';
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new AppError('Only images (JPEG, PNG) and documents (PDF, DOC) are allowed', 400));
  }
};

// Multer upload instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: fileFilter
});

module.exports = upload;
