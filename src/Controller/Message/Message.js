const Message = require('../../models/messageModel');
const Chat = require('../../models/ChatModel');

// Socket.IO instance (you can also pass this to your controller through parameters)
let io; 

// Function to set the Socket.IO instance
const setSocketIO = (socketIO) => {
  io = socketIO;
};

const sendMessage = async (req, res) => {
  const { chatId, senderId, content,recipientId, type, replyTo } = req.body;
  try {
    const message = new Message({
      chatId,
      senderId,
      content,
      recipientId,
      type,
      replyTo,
    });
    await message.save();
    
    // Update the chat with the last message
    await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

    // Emit the message to the specific chat room
    io.to(chatId).emit('message', message);
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Mark messages as seen
const markAsSeen = async (req, res) => {
  const { chatId, userId } = req.body;
  try {
    await Message.updateMany(
      { chatId, seenBy: { $ne: userId } },
      { $push: { seenBy: userId } }
    );
    
    // Emit event to mark messages as seen
    io.to(chatId).emit('messagesSeen', { userId });
    
    res.json({ message: 'Messages marked as seen' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark messages as seen' });
  }
};

// Get chat history
const getChatHistory = async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
};

module.exports = {
  sendMessage,
  markAsSeen,
  getChatHistory,
  setSocketIO // Export the function to set the Socket.IO instance
};
