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
  console.log("Request Body:", req.body);

  try {
    console.log("Checking for users...");
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    const [sender, receiver] = await Promise.all([
      User.findById(senderObjectId),
      Contact.findById(receiverObjectId),
    ]);

    console.log("Sender:", sender);
    console.log("Receiver:", receiver);

    if (!sender || !receiver) {
      return res.status(404).json({
        error: "Sender or receiver not found. Please check the user IDs and try again.",
      });
    }

    const chatId = [senderId, receiverId].sort().join("-");

    const message = await Message.create({
      chatId,
      senderId,
      receiverId,
      content,
      timestamp: Date.now(),
    });

    io.to(chatId).emit("receiveMessage", {
      ...message.toObject(),
      senderName: sender.username,
      receiverName: receiver.name,
    });

    res.status(201).json({
      ...message.toObject(),
      senderName: sender.username,
      receiverName: receiver.name,
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
      // const messages = await Message.find({ chatId })
      //   .sort({ timestamp: 1 })
      //   .populate({ path: "senderId", select: "username name" }) // ensure username and name are selected
      //   .populate({ path: "receiverId", select: "name" }); // ensure name is selected

      // return res.status(200).json(
      //   messages.map((message) => ({
      //     ...message.toObject(),
      //     senderName: message.senderId?.username || message.senderId?.name || "Unknown Sender",
      //     receiverName: message.receiverId?.name || "Unknown Receiver",
      //   }))
      // );
      const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
      return res.status(200).json(messages);
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
            from: "users", // Make sure "users" is the correct collection name for users
            localField: "senderId",
            foreignField: "_id",
            as: "senderInfo"
          }
        },
        {
          $lookup: {
            from: "contacts", // Make sure "contacts" is the correct collection name for contacts
            localField: "receiverId",
            foreignField: "_id",
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

