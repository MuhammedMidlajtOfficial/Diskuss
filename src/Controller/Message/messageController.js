// const Message = require('../../models/messageModel');
// const Chat = require('../../models/ChatModel');

// // Socket.IO instance (you can also pass this to your controller through parameters)
// let io; 

// // Function to set the Socket.IO instance
// const setSocketIO = (socketIO) => {
//   io = socketIO;
// };

// const sendMessage = async (req, res) => {
//   const { chatId, senderId, content,recipientId, type, replyTo } = req.body;
//   try {
//     const message = new Message({
//       chatId,
//       senderId,
//       content,
//       recipientId,
//       type,
//       replyTo,
//     });
//     await message.save();
    
//     // Update the chat with the last message
//     await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

//     // Emit the message to the specific chat room
//     io.to(chatId).emit('message', message);
    
//     res.json(message);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to send message' });
//   }
// };

// // Mark messages as seen
// const markAsSeen = async (req, res) => {
//   const { chatId, userId } = req.body;
//   try {
//     await Message.updateMany(
//       { chatId, seenBy: { $ne: userId } },
//       { $push: { seenBy: userId } }
//     );
    
//     // Emit event to mark messages as seen
//     io.to(chatId).emit('messagesSeen', { userId });
    
//     res.json({ message: 'Messages marked as seen' });
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to mark messages as seen' });
//   }
// };

// // Get chat history
// const getChatHistory = async (req, res) => {
//   const { chatId } = req.params;
//   try {
//     const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
//     res.json(messages);
//   } catch (err) {
//     res.status(500).json({ error: 'Failed to retrieve chat history' });
//   }
// };

// module.exports = {
//   sendMessage,
//   markAsSeen,
//   getChatHistory,
//   setSocketIO // Export the function to set the Socket.IO instance
// };


let io;

const Message = require("../../models/messageModel");

exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Send message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  try {
    const message = await Message.create({
      senderId,
      receiverId,
      content,
      timestamp: Date.now()
    });

    // Emit the message to the connected clients
    io.to(receiverId).emit("receiveMessage", message);
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error.message || error); // Log more details
    res.status(500).json({ error: "Error sending message.", details: error.message });
  }
};

// Get messages
exports.getMessages = async (req, res) => {
  const { senderId, receiverId } = req.query;

  try {
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages." });
  }
};
