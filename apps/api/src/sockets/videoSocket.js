const { logger } = require('../middleware/logger');

// Video consultation WebRTC signaling
module.exports = (io) => {
  const videoNamespace = io.of('/video');

  videoNamespace.on('connection', (socket) => {
    logger.info(`Video client connected: ${socket.id}`);

    // Join consultation room
    socket.on('join:consultation', (consultationId) => {
      socket.join(`consultation:${consultationId}`);
      logger.info(`Socket ${socket.id} joined consultation ${consultationId}`);
      
      // Notify others in the room
      socket.to(`consultation:${consultationId}`).emit('user:joined', {
        socketId: socket.id,
        timestamp: new Date()
      });
    });

    // WebRTC Offer
    socket.on('webrtc:offer', (data) => {
      const { consultationId, offer, targetSocketId } = data;
      
      if (targetSocketId) {
        videoNamespace.to(targetSocketId).emit('webrtc:offer', {
          offer,
          senderSocketId: socket.id
        });
      } else {
        socket.to(`consultation:${consultationId}`).emit('webrtc:offer', {
          offer,
          senderSocketId: socket.id
        });
      }
      
      logger.info(`WebRTC offer sent in consultation ${consultationId}`);
    });

    // WebRTC Answer
    socket.on('webrtc:answer', (data) => {
      const { answer, targetSocketId } = data;
      
      videoNamespace.to(targetSocketId).emit('webrtc:answer', {
        answer,
        senderSocketId: socket.id
      });
      
      logger.info(`WebRTC answer sent to ${targetSocketId}`);
    });

    // ICE Candidate
    socket.on('webrtc:ice-candidate', (data) => {
      const { candidate, targetSocketId } = data;
      
      videoNamespace.to(targetSocketId).emit('webrtc:ice-candidate', {
        candidate,
        senderSocketId: socket.id
      });
    });

    // Toggle video
    socket.on('video:toggle', (data) => {
      const { consultationId, enabled } = data;
      socket.to(`consultation:${consultationId}`).emit('video:toggle', {
        socketId: socket.id,
        enabled
      });
    });

    // Toggle audio
    socket.on('audio:toggle', (data) => {
      const { consultationId, enabled } = data;
      socket.to(`consultation:${consultationId}`).emit('audio:toggle', {
        socketId: socket.id,
        enabled
      });
    });

    // Screen share
    socket.on('screen:share:start', (data) => {
      const { consultationId } = data;
      socket.to(`consultation:${consultationId}`).emit('screen:share:started', {
        socketId: socket.id
      });
    });

    socket.on('screen:share:stop', (data) => {
      const { consultationId } = data;
      socket.to(`consultation:${consultationId}`).emit('screen:share:stopped', {
        socketId: socket.id
      });
    });

    // Leave consultation
    socket.on('leave:consultation', (consultationId) => {
      socket.leave(`consultation:${consultationId}`);
      socket.to(`consultation:${consultationId}`).emit('user:left', {
        socketId: socket.id,
        timestamp: new Date()
      });
      logger.info(`Socket ${socket.id} left consultation ${consultationId}`);
    });

    // Disconnect
    socket.on('disconnect', () => {
      logger.info(`Video client disconnected: ${socket.id}`);
    });
  });
};
