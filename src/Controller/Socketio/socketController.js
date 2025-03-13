let io;
const connectedUsers = new Map();
const messageController = require("../Message/messageController")
const messageService = require("../../services/Message/message.service")
const userSocketMap = {};

exports.userSocketMap = userSocketMap;
exports.getReceiverSocketId =  (userId) => {
  return userSocketMap[userId];
}

// Set up the Socket.IO instance and handle user connections
exports.setSocketIO = (socketIO) => {
  io = socketIO;

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    const userId = socket.handshake.query.userId;
    if(userId){
      console.log("userId", userId);
      userSocketMap[userId] = socket.id;
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("error", (err) => {
      console.error("Socket error:", err);
    });

    socket.on("connect_error", (err) => {
      console.log("connect error", err);
      console.error("Connection error:", err);
    });

    socket.on("messageRead", async (data) => {
      console.log("messageRead", data);
      // const { messageId, chatId, userId } = data; // data = messageId, chatId, userId
      await messageService.markMessagesAsRead(data);
  });

    // // When a user joins a chat room
    // socket.on("joinChat", (chatId) => {
    //   socket.join(chatId);
    //   const msg = `Welcome to the chat room ${chatId}!`;
    //   socket.emit("chat message", msg); 
    //   console.log(`User with socket ID ${socket.id} joined chat room ${chatId}`);
    // });

    //    // Handle chat messages
    //    socket.on('chat message', ({ room, msg }) => {
    //     console.log("room "+ room + " msg "+ msg);
    //     io.to(room).emit('chat message', msg);
    // });

  //   // Handle chat messages
  //   socket.on('chat message', async ({ room, senderId, recieverId, msg }) => {
  //     socket.join(room);
  //     // socket.emit("chat message", msg); 
  //     console.log("socket user id")
  //     const data = { room, senderId, recieverId, msg }
  //     console.log("room "+ room + " msg "+ msg + " senderId "+ senderId + " recieverId "+ recieverId);
  //     await messageService.createMessage({ chatId: room, senderId: senderId, receiverId: recieverId, content: msg });
  //     io.to(room).emit('new_message', data);
  // });

    // // Track user connection
    // socket.on("registerUser", (userId) => {
    //   connectedUsers.set(userId, socket.id);
      // console.log(`User ${userId} connected with socket ID ${socket.id}`);

      // // When a user joins a chat room
      // socket.on("joinChat", (chatId) => {
      //   socket.join(chatId);
      //   console.log(
      //     `User with socket ID ${socket.id} joined chat room ${chatId}`
      //   );
      // });

      // Notify other clients about the user's online status
    //   socket.broadcast.emit("userConnected", { userId, status: "online" });
    // });

    // Handle user disconnection
    socket.on("disconnect", () => {
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
      // const userId = [...connectedUsers.entries()].find(
      //   ([, socketId]) => socketId === socket.id
      // )?.[0];

      // if (userId) {
      //   connectedUsers.delete(userId);
      //   console.log(`User ${userId} disconnected`);

      //   // Notify other clients about the user's offline status
      //   io.emit("userDisconnected", { userId, status: "offline" });
      // }
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

