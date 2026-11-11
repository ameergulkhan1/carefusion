const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { morganMiddleware, logger } = require('./middleware/logger');

const app = express();

// ===== TEMPORARY DIAGNOSTIC — REMOVE AFTER DEBUGGING =====
app.use((req, res, next) => {
  console.log('[DIAG] Incoming request:', JSON.stringify({
    method: req.method,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
    path: req.path,
    host: req.headers.host,
    xForwardedHost: req.headers['x-forwarded-host'],
    xForwardedUri: req.headers['x-forwarded-uri'],
    isVercel: !!process.env.VERCEL,
    vercelEnv: process.env.VERCEL_ENV,
    cwd: process.cwd(),
  }));
  next();
});
// ===== END DIAGNOSTIC =====

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'http://localhost:3000', 'http://localhost:5000', 'https://res.cloudinary.com'],
      mediaSrc: ["'self'", 'blob:'],
    },
  },
}));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(compression());
app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production' && process.env.SERVE_LOCAL_UPLOADS === 'true') {
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

app.use('/api/', apiLimiter);

app.get('/health', (req, res) => res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patient.routes'));
app.use('/api/appointments', require('./routes/appointment.routes'));
app.use('/api/prescriptions', require('./routes/prescription.routes'));
app.use('/api/doctors', require('./routes/doctor.routes'));
app.use('/api/laboratory', require('./routes/laboratory.routes'));
app.use('/api/pharmacy', require('./routes/pharmacy.routes'));
app.use('/api/symptoms', require('./routes/symptom.routes'));
app.use('/api/clinical-notes', require('./routes/clinicalNotes.routes'));

// ===== TEMPORARY DIAGNOSTIC — REMOVE AFTER DEBUGGING =====
app.all('*', (req, res, next) => {
  console.log('[DIAG] Catch-all fired:', req.method, req.originalUrl);
  next();
});
// ===== END DIAGNOSTIC =====

app.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;