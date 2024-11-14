let io;
const mongoose = require("mongoose");
const Message = require("../../models/messageModel");
const { individualUserCollection: User } = require("../../DBConfig");
const Contact = require("../../models/contact.model");

exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Send message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  try {
    // Ensure senderId exists in the User collection
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // Ensure receiverId exists in the User collection
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver not found" });
    }

    // Generate a single consistent chatId
    const chatId = [senderId, receiverId].sort().join("-");

    // Create the message in the database
    const message = await Message.create({
      chatId,
      senderId,
      receiverId,
      content,
      timestamp: Date.now(),
    });

    // Emit the message to the respective chat room (chatId)
    io.to(chatId).emit("receiveMessage", {
      ...message.toObject(),
      senderName: sender.username,
      receiverName: receiver.username,
    });

    // Send response
    res.status(201).json({
      ...message.toObject(),
      senderName: sender.username,
      receiverName: receiver.username,
    });
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
      const messages = await Message.find({
        chatId,
      }).sort({ timestamp: 1 });
  
      res.status(200).json(messages);
    } else if (userId) {
      const lastMessages = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: new mongoose.Types.ObjectId(userId) },
              { receiverId: new mongoose.Types.ObjectId(userId) }
            ]
          }
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$chatId",
            lastMessage: { $first: "$$ROOT" }

          }
        },
        { $replaceRoot: { newRoot: "$lastMessage" } },
        {
          $lookup: {
            from: "users", // Fetch sender details from 'users' collection
            localField: "senderId",
            foreignField: "_id",
            as: "senderInfo"

          }
        },
        {
          $lookup: {
            from: "contacts",
            localField: "receiverId",
            foreignField: "userId",

            as: "receiverInfo"
          }
        },
        {
          $addFields: {
            senderName: {
              $ifNull: [
                { $arrayElemAt: ["$senderInfo.username", 0] },
                { $arrayElemAt: ["$senderInfo.name", 0] },
                "Unknown Sender"
              ]
            },
            
            receiverName: {
              $ifNull: [
                { $arrayElemAt: ["$receiverInfo.name", 0] },
                "Unknown Receiver"
              ]

            }
          }
        },
        { $project: { senderInfo: 0, receiverInfo: 0 } }
      ]);

      return res.status(200).json(lastMessages);
    } else {
      return res.status(400).json({ error: "Either chatId or userId must be provided." });
    }
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages." });
  }
};

