const { logger } = require('../middleware/logger');

// Socket.IO event handlers
module.exports = (io) => {
  const chatNamespace = io.of('/chat');

  chatNamespace.on('connection', (socket) => {
    logger.info(`Chat client connected: ${socket.id}`);

    // Join personal room
    socket.on('join', (userId) => {
      socket.join(`user:${userId}`);
      logger.info(`User ${userId} joined personal room`);
    });

    // Join conversation room
    socket.on('join:conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // Send message
    socket.on('message:send', (data) => {
      const { conversationId, message } = data;
      
      // Broadcast to conversation room
      chatNamespace.to(`conversation:${conversationId}`).emit('message:received', {
        conversationId,
        message,
        timestamp: new Date()
      });

      logger.info(`Message sent in conversation ${conversationId}`);
    });

    // Typing indicator
    socket.on('typing:start', (data) => {
      const { conversationId, userId, userName } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        userName,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      const { conversationId, userId } = data;
      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false
      });
    });

    // Message read receipt
    socket.on('message:read', (data) => {
      const { conversationId, messageId, userId } = data;
      socket.to(`conversation:${conversationId}`).emit('message:read:update', {
        conversationId,
        messageId,
        userId,
        readAt: new Date()
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Chat client disconnected: ${socket.id}`);
    });
  });
};
