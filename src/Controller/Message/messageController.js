let io;

const Message = require("../../models/messageModel");
const User = require("../../models/userModel");

exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Send message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  try {
    const senderExists = await User.findById(senderId);
    const receiverExists = await User.findById(receiverId);

    if (!senderExists || !receiverExists) {
      return res.status(404).json({
        error:
          "Sender or receiver not found. Please check the user IDs and try again.",
      });
    }

    // Generate chatId for one-on-one chat (concatenate sorted IDs to ensure consistency)
    const chatId = [senderId, receiverId].sort().join("-");

    const message = await Message.create({
      chatId,
      senderId,
      receiverId,
      content,
      timestamp: Date.now(),
    });

    io.to(chatId).emit("receiveMessage", message);
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error.message || error);
    res
      .status(500)
      .json({ error: "Error sending message.", details: error.message });
  }
};

// Get messages
exports.getMessages = async (req, res) => {
  const { chatId } = req.query;

  try {
    const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages." });
  }
};