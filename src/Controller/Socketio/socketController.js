let io;
const connectedUsers = new Map(); 

// Set up the Socket.IO instance and handle user connections
exports.setSocketIO = (socketIO) => {
  io = socketIO;

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Track user connection
    socket.on("registerUser", (userId) => {
      connectedUsers.set(userId, socket.id);
      console.log(`User ${userId} connected with socket ID ${socket.id}`);

      // Notify other clients about the user's online status
      socket.broadcast.emit("userConnected", { userId, status: "online" });
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      const userId = [...connectedUsers.entries()].find(
        ([, socketId]) => socketId === socket.id
      )?.[0];

      if (userId) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);

        // Notify other clients about the user's offline status
        io.emit("userDisconnected", { userId, status: "offline" });
      }
    });
  });
};

// Check if a user is connected
exports.isUserConnected = (userId) => {
  return connectedUsers.has(userId);
};

// Send message to a specific user by userId
exports.sendMessageToUser = (userId, message) => {
  const socketId = connectedUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit("receiveMessage", message);
  }
};
