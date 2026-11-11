require('dotenv').config();

// ===== TEMPORARY DIAGNOSTIC — REMOVE AFTER DEBUGGING =====
console.log('[DIAG] server.js loaded', JSON.stringify({
  isMain: require.main === module,
  nodeVersion: process.version,
  vercel: !!process.env.VERCEL,
  vercelEnv: process.env.VERCEL_ENV,
  vercelRegion: process.env.VERCEL_REGION,
  cwd: process.cwd(),
}));
// ===== END DIAGNOSTIC =====

const { createServer } = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { Server } = require('socket.io');
const initializeSockets = require('./sockets');
const { logger } = require('./middleware/logger');

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
});
initializeSockets(io);
app.set('io', io);

async function start() {
  try {
    await connectDB();
    logger.info('✅ MongoDB connected');

    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_JOBS === 'true') {
      const { initializeJobs } = require('./jobs');
      initializeJobs();
      logger.info('🕒 Background jobs initialized');
    }

    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`📡 Socket.IO initialized on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) start();

const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down...`);
  httpServer.close(() => process.exit(0));
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (err) => { logger.error('Unhandled Rejection:', err); httpServer.close(() => process.exit(1)); });
process.on('uncaughtException', (err) => { logger.error('Uncaught Exception:', err); process.exit(1); });

// Export the app for Vercel's zero-config detection
module.exports = app;