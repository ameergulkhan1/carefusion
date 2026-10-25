const chatSocket = require('./chatSocket');
const videoSocket = require('./videoSocket');
const notificationSocket = require('./notificationSocket');
const { logger } = require('../middleware/logger');

module.exports = (io) => {
  logger.info('Initializing Socket.IO handlers...');

  // Initialize all socket namespaces
  chatSocket(io);
  videoSocket(io);
  const notificationNamespace = notificationSocket(io);

  // Main namespace connection handler
  io.on('connection', (socket) => {
    logger.info(`Client connected to main namespace: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Client disconnected from main namespace: ${socket.id}`);
    });
  });

  logger.info('Socket.IO handlers initialized successfully');

  return {
    io,
    notificationNamespace
  };
};
