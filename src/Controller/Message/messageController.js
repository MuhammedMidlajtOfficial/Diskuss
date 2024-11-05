let io;
const mongoose = require("mongoose");
const Message = require("../../models/messageModel");
const { individualUserCollection: User } = require("../../DBConfig");

exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Send message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  console.log("Request Body:", req.body);
  
  try {
    console.log("Checking for users...");
    // Convert senderId and receiverId to ObjectId format
    const senderObjectId =new mongoose.Types.ObjectId(senderId);
    const receiverObjectId =new mongoose.Types.ObjectId(receiverId);

    // Check if both users exist
    const [senderExists, receiverExists] = await Promise.all([
      User.findById(senderObjectId),
      User.findById(receiverObjectId),
    ]);

    console.log("Sender Exists:", senderExists);
    console.log("Receiver Exists:", receiverExists);

    // If either sender or receiver does not exist, return error
    if (!senderExists || !receiverExists) {
      return res.status(404).json({
        error: "Sender or receiver not found. Please check the user IDs and try again.",
      });
    }

    // Generate chatId for one-on-one chat (concatenate sorted IDs to ensure consistency)
    const chatId = [senderId, receiverId].sort().join("-");

    // Create a new message
    const message = await Message.create({
      chatId,
      senderId,
      receiverId,
      content,
      timestamp: Date.now(),
    });

    // Emit the message to the specified chatId
    io.to(chatId).emit("receiveMessage", message);
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error.message || error);
    res.status(500).json({ error: "Error sending message.", details: error.message });
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
