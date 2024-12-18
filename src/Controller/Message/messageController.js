let io;
const mongoose = require("mongoose");
const Message = require("../../models/messageModel");
const { individualUserCollection: User } = require("../../DBConfig");
// const Contact = require("../../models/contact.individual.model");
const EnterpriseUser = require("../../models/enterpriseUser");
const EnterpriseEmployee = require("../../models/enterpriseEmploye.model");
const axios = require("axios");

exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Send message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;

  try {
    // Search for the sender in three different collections
    const [senderInUser, senderInContact, senderInEnterprise] =
      await Promise.all([
        User.findById(senderId),
        EnterpriseEmployee.findById(senderId),
        EnterpriseUser.findById(senderId),
      ]);

    // Determine the sender
    const sender = senderInUser || senderInContact || senderInEnterprise;

    if (!sender) {
      return res
        .status(404)
        .json({ error: "Sender not found in any collection" });
    }

    // Search for the receiver in three different collections
    const [receiverInUser, receiverInContact, receiverInEnterprise] =
      await Promise.all([
        User.findById(receiverId),
        EnterpriseEmployee.findById(receiverId),
        EnterpriseUser.findById(receiverId),
      ]);

    // Determine the receiver
    const receiver =
      receiverInUser || receiverInContact || receiverInEnterprise;

    if (!receiver) {
      return res
        .status(404)
        .json({ error: "Receiver not found in any collection" });
    }

    // Generate chatId by sorting senderId and receiverId to ensure consistency
    const chatId = [senderId, receiverId].sort().join("-");

    // Get the current timestamp and local time
    const now = new Date();
    const localTime = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata", // Replace with your desired timezone
    }).format(now);

    // Create the message
    const message = await Message.create({
      chatId,
      senderId,
      receiverId,
      content,
      timestamp: now,
      localTime, // Add the formatted local time
    });

    // Emit the message to the respective chat room (chatId)
    io.to(chatId).emit("receiveMessage", {
      ...message.toObject(),
      senderName: sender.username || sender.name || "Unknown Sender", // Use appropriate field for sender name
      receiverName: receiver.username || receiver.name || "Unknown Receiver", // Use appropriate field for receiver name
    });

    // Notify the receiver using the admin backend
    try {
      await axios.post(
        "http://13.203.24.247:9000/api/v1/fcm/sendMessageNotification",
        {
          receiverId,
          senderName: sender.username || sender.name || "Unknown Sender",
          content,
          chatId,
        }
      );
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError.message);
    }

    // Respond with the message
    res.status(201).json({
      ...message.toObject(),
      senderName: sender.username || sender.name || "Unknown Sender",
      receiverName: receiver.username || receiver.name || "Unknown Receiver",
    });
  } catch (error) {
    console.error("Error sending message:", error.message || error);
    res
      .status(500)
      .json({ error: "Error sending message.", details: error.message });
  }
};

//Mark Messages as Read
exports.markMessagesAsRead = async (req, res) => {
  const { chatId, userId } = req.body;

  try {
    const result = await Message.updateMany(
      { chatId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: "Messages marked as read", result });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
};

// Get messages or last message of each chat involving the user
exports.getMessages = async (req, res) => {
  const { chatId, userId } = req.body;

  console.log("Get last message:",chatId,userId);
  try {
    if (chatId) {
      const messages = await Message.find({ chatId }).sort({ timestamp: 1 });

      // Get unread messages count for the current user in this chat
      const unreadCount = await Message.countDocuments({
        chatId,
        receiverId: userId,
        isRead: false,
      });

      return res.status(200).json({
        messages: messages.map((message) => ({
          ...message.toObject(),
        })),
        unreadCount,
      });
    } else if (userId) {
      const lastMessages = await Message.aggregate([
        {
          $match: {
            $or: [
              { senderId: new mongoose.Types.ObjectId(userId) },
              { receiverId: new mongoose.Types.ObjectId(userId) },
            ],
          },
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: "$chatId",
            lastMessage: { $first: "$$ROOT" }, // Capture only the latest message
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "lastMessage.senderId",
            foreignField: "_id",
            as: "senderUserInfo",
          },
        },
        {
          $lookup: {
            from: "enterpriseusers",
            localField: "lastMessage.senderId",
            foreignField: "_id",
            as: "senderEnterpriseInfo",
          },
        },
        {
          $lookup: {
            from: "enterpriseemployees",
            localField: "lastMessage.senderId",
            foreignField: "_id",
            as: "senderEmployeeInfo",
          },
        },
        {
          $lookup: {
            from: "contacts",
            let: { receiverId: "$lastMessage.receiverId" },
            pipeline: [
              { $unwind: "$contacts" },
              {
                $match: {
                  $expr: { $eq: ["$contacts.userId", "$$receiverId"] },
                },
              },
              {
                $addFields: {
                  name: "$contacts.name",
                  username: "$contacts.username",
                  companyName: "$contacts.companyName",
                },
              },
            ],
            as: "receiverContactInfo",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "lastMessage.receiverId",
            foreignField: "_id",
            as: "receiverUserInfo",
          },
        },
        {
          $lookup: {
            from: "enterpriseusers",
            localField: "lastMessage.receiverId",
            foreignField: "_id",
            as: "receiverEnterpriseInfo",
          },
        },
        {
          $lookup: {
            from: "enterpriseemployees",
            localField: "lastMessage.receiverId",
            foreignField: "_id",
            as: "receiverEmployeeInfo",
          },
        },
        {
          $addFields: {
            "lastMessage.senderName": {
              $ifNull: [
                { $arrayElemAt: ["$senderUserInfo.username", 0] },
                { $arrayElemAt: ["$senderEnterpriseInfo.companyName", 0] },
                { $arrayElemAt: ["$senderEmployeeInfo.username", 0] },
                "Unknown Sender",
              ],
            },
            "lastMessage.receiverName": {
              $ifNull: [
                { $arrayElemAt: ["$receiverContactInfo.name", 0] },
                { $arrayElemAt: ["$receiverContactInfo.username", 0] },
                { $arrayElemAt: ["$receiverContactInfo.companyName", 0] },
                {
                  $ifNull: [
                    // Fallback to receiver number if name is not found
                    { $arrayElemAt: ["$receiverUserInfo.phnNumber", 0] },
                    { $arrayElemAt: ["$receiverEnterpriseInfo.phnNumber", 0] },
                    { $arrayElemAt: ["$receiverEmployeeInfo.phnNumber", 0] },
                    "Unknown Receiver",
                  ],
                },
              ],
            },
            "lastMessage.receiverNumber": {
              $ifNull: [
                { $arrayElemAt: ["$receiverUserInfo.phnNumber", 0] },
                { $arrayElemAt: ["$receiverEnterpriseInfo.phnNumber", 0] },
                { $arrayElemAt: ["$receiverEmployeeInfo.phnNumber", 0] },
                "Receiver is not a diskuss user",
              ],
            },
            "lastMessage.senderProfilePic": {
              $ifNull: [
                { $arrayElemAt: ["$senderUserInfo.image", 0] },
                { $arrayElemAt: ["$senderEnterpriseInfo.image", 0] },
                { $arrayElemAt: ["$senderEmployeeInfo.image", 0] },
                "",
              ],
            },
            "lastMessage.receiverProfilePic": {
              $ifNull: [
                { $arrayElemAt: ["$receiverContactInfo.image", 0] },
                "",
              ],
            },
          },
        },
        {
          $addFields: {
            "lastMessage.unreadCount": {
              $size: {
                $ifNull: [
                  {
                    $filter: {
                      input: "$messages",
                      as: "message",
                      cond: {
                        $and: [
                          { $eq: ["$$message.isRead", false] },
                          {
                            $eq: [
                              "$$message.receiverId",
                              new mongoose.Types.ObjectId(userId),
                            ],
                          },
                        ],
                      },
                    },
                  },
                  [],
                ],
              },
            },
          },
        },
        {
          $replaceRoot: { newRoot: "$lastMessage" },
        },

        {
          $project: {
            _id: 0,
            senderUserInfo: 0,
            senderEnterpriseInfo: 0,
            senderEmployeeInfo: 0,
            receiverContactInfo: 0,
          },
        },
      ]);

      return res.status(200).json(lastMessages);
    } else {
      return res
        .status(400)
        .json({ error: "Either chatId or userId must be provided." });
    }
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages." });
  }
};