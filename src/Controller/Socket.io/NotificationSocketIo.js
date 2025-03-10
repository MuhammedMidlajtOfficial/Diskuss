
let io;
const userSockets = {}; // To map user IDs to their respective socket IDs

const setSocketIO = (socketIoInstance) => {
  io = socketIoInstance;

  io.on('connection', (socket) => {
    console.log('A user connected');
    const { userId } = socket.handshake.query; // Assuming userId is passed as a query param

    if (userId) {
      userSockets[userId] = socket.id; // Map userId to socket ID
      console.log(`User ${userId} connected with socket ID ${socket.id}`);
    } else {
      console.warn(`A socket connected without userId. Socket ID: ${socket.id}`);
     
      
    }

    // Handle disconnection
    socket.on('disconnect', () => {
      if (userId && userSockets[userId]) {
        console.log(`User ${userId} disconnected, removing from userSockets`);
        delete userSockets[userId];
      } else {
        console.warn(`Disconnected socket ID ${socket.id} was not mapped to any user.`);

      }
    });
  });
};

const emitNotification = (userId, notification) => {
  if (!io) {
    console.error('Socket.IO instance is not initialized.');
    return;
  }

  const socketId = userSockets[userId];
  if (socketId) {
    io.to(socketId).emit('notification', notification);
    console.log(`Notification sent to user ${userId}:`, notification);
  } else {
    console.warn(`User ${userId} is not connected. Cannot send notification.`);
    console.log(notification);
  }
};

module.exports = {
  setSocketIO,
  emitNotification,
};
