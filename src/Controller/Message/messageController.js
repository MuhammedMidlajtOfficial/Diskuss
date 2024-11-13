let io;
const mongoose = require("mongoose");
const Message = require("../../models/messageModel");
const { individualUserCollection: User } = require("../../DBConfig");
const ContactIndividual = require("../../models/contact.individul.model");

exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

// Send message
exports.sendMessage = async (req, res) => {
  const { senderId, receiverId, content } = req.body;
  try {
    // Ensure senderId is from the User collection
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ error: "Sender not found" });
    }

    // Convert senderId and receiverId to ObjectId
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

    // Log the ObjectId conversion
    console.log("senderObjectId:", senderObjectId);
    console.log("receiverObjectId:", receiverObjectId);

    // Build the query
    const query = {
      contactOwnerId: senderObjectId,
      "contacts.userId": receiverObjectId, 
    };

    // Log the query structure
    console.log("Running query:", JSON.stringify(query, null, 2));

    // Find the receiver in ContactIndividual by contactOwnerId and contacts.userId
    const contact = await ContactIndividual.findOne(query);

    console.log("Contact document:", contact);

    if (!contact) {
      return res.status(404).json({ error: "Receiver not found in contact list" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "Receiver user not found" });
    }

    // Generate chatId by sorting senderId and receiverId to ensure consistency
    const chatId = [senderId, receiverId].sort().join("-");

    // Create the message
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
      senderName: sender.username, // Assuming sender has a 'username' field
      receiverName: receiver.username, // Assuming receiver has a 'name' field
    });

    res.status(201).json({
      ...message.toObject(),
      senderName: sender.username,
      receiverName: receiver.username,
    });
  } catch (error) {
    console.error("Error sending message:", error.message || error);
    res
      .status(500)
      .json({ error: "Error sending message.", details: error.message });
  }
};

// Get messages or last message of each chat involving the user
exports.getMessages = async (req, res) => {
  const { chatId, userId } = req.query;

  try {
    if (chatId) {
      const messages = await Message.find({ chatId }).sort({ timestamp: 1 });
      // .populate("senderId", "name username") // Populate sender name and username
      // .populate("receiverId", "name username"); // Populate receiver name only



      return res.status(200).json(
        messages.map((message) => ({
          ...message.toObject(),
          // senderName: message.senderId?.name || message.senderId?.username || "Unknown Sender",
          // receiverName: message.receiverId?.name ||message.receiverId?.username || "Unknown Receiver",

        }))
      );
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
            lastMessage: { $first: "$$ROOT" },
          },
        },
        { $replaceRoot: { newRoot: "$lastMessage" } },
        {
          $lookup: {
            from: "users", // Ensure "users" is correct for sender info
            localField: "senderId",
            foreignField: "_id",
            as: "senderInfo",
          },
        },
        {
          $lookup: {
            from: "contactindividuals",
            let: { receiverId: "$receiverId" },
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
                },
              },
            ],
            as: "receiverInfo",
          },
        },
        {
          $lookup: {
            from: "users", // To fetch the profile picture of the receiver
            localField: "receiverId", // Receiver's ID
            foreignField: "_id",
            as: "receiverUserInfo",
          },
        },
        {
          $addFields: {
            senderName: {
              $ifNull: [
                { $arrayElemAt: ["$senderInfo.username", 0] },
                "Unknown Sender",
              ],
            },
            receiverName: {
              $ifNull: [
                { $arrayElemAt: ["$receiverInfo.name", 0] },
                { $arrayElemAt: ["$receiverInfo.username", 0] },
                "Unknown Receiver",
              ],
            },
            senderProfilePic: {
              $ifNull: [
                { $arrayElemAt: ["$senderInfo.image", 0] }, // Profile picture for sender
                "", // Default to empty if not available
              ],
            },
            receiverProfilePic: {
              $ifNull: [
                { $arrayElemAt: ["$receiverUserInfo.image", 0] }, // Profile picture for receiver
                "", // Default to empty if not available
              ],

            },
            // name: {
            //   $cond: {
            //     if: { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
            //     then: {
            //       $ifNull: [
            //         { $arrayElemAt: ["$receiverInfo.name", 0] },
            //         "Unknown Receiver",
            //       ],
            //     },
            //     else: {
            //       $ifNull: [
            //         { $arrayElemAt: ["$senderInfo.username", 0] },
            //         "Unknown Sender",
            //       ],
            //     },
            //   },
            // },

          },

        },
        { $project: { senderInfo: 0, receiverInfo: 0, receiverUserInfo: 0 } },
      ]);

      console.log(
        "Last Messages Result (Processed):",
        JSON.stringify(lastMessages, null, 2)
      );
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
