const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
const connectDB = require('./config/database');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { morganMiddleware, logger } = require('./middleware/logger');
const initializeSockets = require('./sockets');
const { initializeJobs } = require('./jobs');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const httpServer = createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Initialize socket handlers
initializeSockets(io);

// Initialize background jobs
if (process.env.NODE_ENV === 'production') {
  initializeJobs();
}

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:3000", "http://localhost:5000"],
      mediaSrc: ["'self'", "blob:"]
    }
  }
}));
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000', 
  credentials: true 
}));
app.use(compression());
app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploads) - BEFORE rate limiting and auth
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rate limiting
app.use('/api/', apiLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/laboratory', require('./routes/laboratory.routes'));
app.use('/api/pharmacy', require('./routes/pharmacy.routes'));
app.use('/api/symptoms', require('./routes/symptom.routes'));
app.use('/api/clinical-notes', require('./routes/clinicalNotes.routes'));

// Catch-all 404 handler (must be after all routes)
app.use((req, res) => {
  logger.warn(`⚠️  404 Not Found: ${req.method} ${req.originalUrl} | Headers: ${JSON.stringify(req.headers['content-type'])} | Body: ${JSON.stringify(req.body)}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`📡 Socket.IO initialized on port ${PORT}`);
  logger.info(`🔗 API Base URL: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  httpServer.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = { app, io };
