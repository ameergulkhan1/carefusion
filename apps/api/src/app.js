const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { morganMiddleware, logger } = require('./middleware/logger');

const app = express();

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

// ===== CORS — allow local dev + deployed frontend =====
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  'https://carefusion-puce.vercel.app/',   // ← replace with your real frontend URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);              // curl / mobile
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (/^https:\/\/carefusion[\w-]*\.vercel\.app$/.test(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
// ===== END CORS =====

app.use(compression());
app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production' && process.env.SERVE_LOCAL_UPLOADS === 'true') {
  const path = require('path');
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

app.use('/api/', apiLimiter);

app.get('/', (req, res) => {
  res.json({
    service: 'clinixsol-api',
    status: 'running',
    health: '/health',
    timestamp: new Date().toISOString(),
  });
});

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

app.use((req, res) => {
  logger.warn(`⚠️ 404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;