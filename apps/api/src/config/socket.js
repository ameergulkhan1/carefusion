const socketIO = require('socket.io');
const { verifyToken } = require('./jwt');

let io;

const initializeSocket = (httpServer) => {
  io = socketIO(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join consultation room
    socket.on('join:consultation', (consultationId) => {
      socket.join(`consultation:${consultationId}`);
      console.log(`User ${socket.userId} joined consultation ${consultationId}`);
    });

    // Leave consultation room
    socket.on('leave:consultation', (consultationId) => {
      socket.leave(`consultation:${consultationId}`);
    });

    // Send message in consultation
    socket.on('message:send', (data) => {
      io.to(`consultation:${data.consultationId}`).emit('message:receive', {
        ...data,
        senderId: socket.userId,
        timestamp: new Date()
      });
    });

    // Typing indicator
    socket.on('typing:start', (consultationId) => {
      socket.to(`consultation:${consultationId}`).emit('typing:indicator', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing:stop', (consultationId) => {
      socket.to(`consultation:${consultationId}`).emit('typing:indicator', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Video call signaling
    socket.on('call:offer', (data) => {
      socket.to(`consultation:${data.consultationId}`).emit('call:offer', data);
    });

    socket.on('call:answer', (data) => {
      socket.to(`consultation:${data.consultationId}`).emit('call:answer', data);
    });

    socket.on('call:ice-candidate', (data) => {
      socket.to(`consultation:${data.consultationId}`).emit('call:ice-candidate', data);
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });
  });

  console.log('✅ Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Emit notification to user
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Emit to consultation room
const emitToConsultation = (consultationId, event, data) => {
  if (io) {
    io.to(`consultation:${consultationId}`).emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToConsultation
};
