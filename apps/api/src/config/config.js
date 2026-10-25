module.exports = {
  app: {
    name: 'ClinixSol API',
    version: process.env.API_VERSION || 'v1',
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development'
  },
  
  database: {
    uri: process.env.MONGODB_URI,
    name: process.env.DB_NAME
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf']
  }
};
