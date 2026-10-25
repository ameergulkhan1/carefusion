const { logger } = require('../middleware/logger');

// Real-time notifications socket handler
module.exports = (io) => {
  const notificationNamespace = io.of('/notifications');

  notificationNamespace.on('connection', (socket) => {
    logger.info(`Notification client connected: ${socket.id}`);

    // Join user's notification room
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined notification room`);
      
      // Send acknowledgment
      socket.emit('joined', {
        userId,
        timestamp: new Date()
      });
    });

    // Mark notification as read
    socket.on('notification:read', (data) => {
      const { notificationId, userId } = data;
      
      // TODO: Update notification status in database
      
      socket.emit('notification:read:confirmed', {
        notificationId,
        readAt: new Date()
      });
      
      logger.info(`Notification ${notificationId} marked as read by user ${userId}`);
    });

    // Mark all notifications as read
    socket.on('notifications:read:all', (userId) => {
      // TODO: Update all notifications for user in database
      
      socket.emit('notifications:read:all:confirmed', {
        userId,
        readAt: new Date()
      });
      
      logger.info(`All notifications marked as read for user ${userId}`);
    });

    // Request notification count
    socket.on('notifications:count', async (userId) => {
      // TODO: Get unread notification count from database
      const unreadCount = 0; // Placeholder
      
      socket.emit('notifications:count:update', {
        userId,
        unreadCount
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Notification client disconnected: ${socket.id}`);
    });
  });

  // Helper function to send notification (called from backend services)
  notificationNamespace.sendNotification = (userId, notification) => {
    notificationNamespace.to(`user:${userId}`).emit('notification:new', {
      ...notification,
      timestamp: new Date()
    });
  };

  return notificationNamespace;
};
