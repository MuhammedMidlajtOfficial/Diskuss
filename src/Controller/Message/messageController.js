let io;
const mongoose = require("mongoose");
const Message = require("../../models/messageModel");
const Contact = require("../../models/contact.model");

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
      Contact.findById(senderObjectId),
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


// Get messages or last message of each chat involving the user
exports.getMessages = async (req, res) => {
  const { chatId, userId } = req.query;

  try {
    if (chatId) {
      // Case 1: Retrieve all messages for a specific chat
      const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
      return res.status(200).json(messages);
    } else if (userId) {
      // Case 2: Retrieve the last message for each chat involving the user
      const lastMessages = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: new mongoose.Types.ObjectId(userId) },
              { receiverId: new mongoose.Types.ObjectId(userId) }
            ]
          }
        },
        {
          $sort: { timestamp: -1 } // Sort by timestamp in descending order
        },
        {
          $group: {
            _id: "$chatId",
            lastMessage: { $first: "$$ROOT" } // Get the latest message per chatId
          }
        },
        {
          $replaceRoot: { newRoot: "$lastMessage" } // Replace root with the last message document
        }
      ]);

      return res.status(200).json(lastMessages);
    } else {
      // Handle missing parameters
      return res.status(400).json({ error: "Either chatId or userId must be provided." });
    }
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages." });
  }
};

