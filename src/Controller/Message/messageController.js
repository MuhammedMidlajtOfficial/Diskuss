let io;
const mongoose = require("mongoose");
const Message = require("../../models/message/messageModel");
const { individualUserCollection: User } = require("../../DBConfig");
const Contact = require("../../models/contacts/contact.individual.model");
const EnterpriseUser = require("../../models/users/enterpriseUser");
const EnterpriseEmployee = require("../../models/users/enterpriseEmploye.model");
const axios = require("axios");
const {getReceiverSocketId, userSocketMap} = require("../../Controller/Socketio/socketController")
const { getNewChatList, getAdminNewChatList } = require("../../services/Message/message.service")
const { checkUserType } = require("../../util/HelperFunctions");
const { uploadImageToS3 } = require("../../services/AWS/awsService")

exports.setSocketIO = (socketIO) => {
  io = socketIO;
};

const admin_userId = new mongoose.Types.ObjectId("67d2de6eb9df3ccb48c462c9")

const admin_ind_chatId = "67d2de6eb9df3ccb48c462d9";
const admin_ent_chatId = "67d2de6eb9df3ccb48c462e9";
const admin_emp_chatId = "67d2de6eb9df3ccb48c462f9";

// Todo : Add Image in the message
// send Message From Admin
exports.sendAdminMessage = async (req, res) => {
  //getting body content and usertype
  // const { content, userType } = req.body;

  //getting formdata content and usertype
  const { content, userType } = req.body;

  let image = ""
  let video = ""
  // console.log("req.body", req.body);
  // console.log("req.file", req.file);
  
  // let image = "https://diskuss-application-bucket.s3.ap-south-1.amazonaws.com/profile-images/67b82f0a703ea2f81ccd6263-profile.jpg";

  if (userType !== "INDIVIDUAL" && userType !== "ENTERPRISE" && userType !== "EMPLOYEE") {
    return res.status(400).json({ error: "Invalid user type" });
  }
  // if (!req.file) {
  //   return res.status(400).send({ error: "No file uploaded" });
  // }

  try {
  image = await uploadMessageImage(req, res);
  video = await uploadMessageVideo(req, res);
  // // The folder name in the S3 bucket
  // const folderName = "admin_messages";
  // const fileName = req.file.originalname;

  // // Upload the file to S3
  // const result = await uploadImageToS3(req.file.buffer, folderName, fileName);
  // const originalUrl = result.Location; // S3 URL of the uploaded file

  // Get the current timestamp and local time
  const now = new Date();
  const localTime = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata", // Replace with your desired timezone
  }).format(now);

  const chatId = userType === "INDIVIDUAL" ? admin_ind_chatId : userType === "ENTERPRISE" ? admin_ent_chatId : admin_emp_chatId;

  // Create the message
  const message = await Message.create({
    chatId: chatId,
    senderId: admin_userId,
    receiverId: admin_userId,
    timestamp: now,
    content,
    localTime, // Add the formatted local time
    isAdmin : true,
    readBy : [],
    forUserType : userType,
    image: image,
    video: video
  });
  await message.save();

  io.emit("newMessage", message);


  // const newChatList = await getAdminNewChatList({userId : "67bdb074ed52c8f211cc44f9"});
  // console.log("newChatList", newChatList);
  // io.to(receiverSocketId).to(senderSocketId).emit("newChat", newChatList);
  // io.emit("newChat", newChatList);
  // io.to(receiverSocketId).emit("newChat", newChatList);

  // Notify the receiver using the admin backend
  try {
    await axios.post(
      "http://13.203.24.247:9000/api/v1/fcm/sendAdminNotification",
      {
        content,
        userType: userType.toLowerCase(), 
        image: image,
        video: video
      }
    );
  } catch (notificationError) {
    console.error("Error sending Admin notification:", notificationError.message);
  }

  return res.status(201).json({
    ...message.toObject(),
    // newChatList
    senderName:  "Know Connection",
    receiverName: userType,
  });

  } catch (error) {
    console.error("Error sending message:", error.message || error);
    res
      .status(500)
      .json({ error: "Error sending message.", details: error.message });
  }
};

// Read Messafe from Admin
exports.markAdminMessagesAsRead = async (req, res) => {
  const { receiverId, messageIds } = req.body;
  let { chatId } = req.body;
  if (!chatId) {
    const {userType} = await checkUserType(receiverId);
    chatId = userType === 'individual' ? admin_ind_chatId : userType === 'enterprise' ? admin_ent_chatId : admin_emp_chatId;
  }
  // console.log("receiverId", receiverId);    
  
  try {
    // console.log("chatId", chatId);
    
    // Update all messages with the specified chatId
    const result = await Message.updateMany(
      { chatId : chatId, readBy: { $nin: [receiverId]} }, // Find all messages in this chat that are not read
      { $addToSet: { readBy: receiverId } } // Add userId to readBy and mark as read
    );

    // // Notify the sender and receiver using Socket.io
    // // console.log("receiverId", receiverId);
    // const receiverSocketId = getReceiverSocketId(senderId);
    // // const senderSocketId = getReceiverSocketId(receiverId);
    // // console.log("receiverSocketId", receiverSocketId);
    // if (receiverSocketId) {
    //   // io.to(receiverSocketId).to(senderSocketId).emit("messageRead", {chatId, receiverId, senderId});
    //   if (messageIds){
    //     io.to(receiverSocketId).emit("messageRead", {chatId, receiverId, senderId, messageIds});
    //   }else{
    //     io.to(receiverSocketId).emit("messageRead", {chatId, receiverId, senderId});
    //   }
    // }


    res.status(200).json({ message: "Messages marked as read", result });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
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
    await message.save();

    // Notify the sender and receiver using Socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);
    if (receiverSocketId) {
      // io.to(receiverSocketId).to(senderSocketId).emit("newMessage", message);
      io.to(receiverSocketId).emit("newMessage", message);
      const newChatList = await getNewAdminChatList({userId: receiverId});
      // console.log("newChatList", newChatList);
      // io.to(receiverSocketId).to(senderSocketId).emit("newChat", newChatList);
      io.to(receiverSocketId).emit("newChat", newChatList);
    }


    // // Emit the message to the respective chat room (chatId)
    // io.to(chatId).emit("receiveMessage", {
    //   ...message.toObject(),
    //   senderName: sender.username || sender.name || "Unknown Sender", // Use appropriate field for sender name
    //   receiverName: receiver.username || receiver.name || "Unknown Receiver", // Use appropriate field for receiver name
    // });

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
  const { chatId, receiverId, senderId, messageIds } = req.body;

  try {
    const result = await Message.updateMany(
      { chatId, receiverId: receiverId, isRead: false },
      { $set: { isRead: true } }
    );

    // Notify the sender and receiver using Socket.io
    // console.log("receiverId", receiverId);
    const receiverSocketId = getReceiverSocketId(senderId);
    // const senderSocketId = getReceiverSocketId(receiverId);
    // console.log("receiverSocketId", receiverSocketId);
    if (receiverSocketId) {
      // io.to(receiverSocketId).to(senderSocketId).emit("messageRead", {chatId, receiverId, senderId});
      if (messageIds){
        io.to(receiverSocketId).emit("messageRead", {chatId, receiverId, senderId, messageIds});
      }else{
        io.to(receiverSocketId).emit("messageRead", {chatId, receiverId, senderId});
      }
    }


    res.status(200).json({ message: "Messages marked as read", result });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
};

// Get messages or last message of each chat involving the user
exports.getMessages = async (req, res) => {
  const { chatId, userId } = req.query;
  let { page = null, limit = null } = req.query;

  try {
    if (chatId) {
      let messages = await Message.find({ chatId }).sort({ timestamp: 1 });

      // Get unread messages count for the current user in this chat
      const unreadCount = await Message.countDocuments({
        chatId,
        receiverId: userId,
        isRead: false,
      });


       // Apply pagination if page and limit are provided
      if (page !== null && limit !== null) {
        const startIndex = (page - 1) * limit;
        messages = messages.slice(startIndex, startIndex + limit);
      }

      return res.status(200).json({
        messages: messages.map((message) => ({
          ...message.toObject(),
        })),
        unreadCount,
      });
    } else if (userId) {
      const messages = await Message.find({
        $or: [
          { senderId: new mongoose.Types.ObjectId(userId) },
          { receiverId: new mongoose.Types.ObjectId(userId) },
          { isAdmin: true }
        ],
      }).sort({ timestamp: -1 });
  
      // Group messages by chatId and pick the latest message
      const lastMessagesMap = new Map();
      for (const message of messages) {
        if (!lastMessagesMap.has(message.chatId)) {
          lastMessagesMap.set(message.chatId, message);
        }
      }
      // console.log("Last Messages Map:", lastMessagesMap);
      let lastMessages = Array.from(lastMessagesMap.values());
      // console.log("Last Messages:", lastMessages);
  
      // Enrich each last message with additional information
      let enrichedMessages = await Promise.all(
        lastMessages.map(async (lastMessage) => {
          // Fetch sender info
          const senderUserInfo = await User.findById(lastMessage.senderId);
          const senderEnterpriseInfo = await EnterpriseUser.findById(lastMessage.senderId);
          const senderEmployeeInfo = await EnterpriseEmployee.findById(lastMessage.senderId);
  
          // Fetch receiver info
          const receiverUserInfo = await User.findById(lastMessage.receiverId);
          const receiverEnterpriseInfo = await EnterpriseUser.findById(lastMessage.receiverId);
          const receiverEmployeeInfo = await EnterpriseEmployee.findById(lastMessage.receiverId);
  
          // Fetch mutual connection info
          const contacts = await Contact.find({
            $or: [
              {
                contactOwnerId: lastMessage.senderId,
                "contacts.userId": lastMessage.receiverId,
              },
              {
                contactOwnerId: lastMessage.receiverId,
                "contacts.userId": lastMessage.senderId,
              },
            ],
          });
          
          let senderName = null;
          let receiverName = null;
          
          // Iterate through the contacts to determine sender and receiver names
          if (contacts && contacts.length > 0) {
            contacts.forEach((contact) => {
              contact.contacts.forEach((c) => {
                // Check for sender name
                if (
                  c.userId.toString() === lastMessage.senderId.toString() &&
                  contact.contactOwnerId.toString() === lastMessage.receiverId.toString()
                ) {
                  senderName = c.name;
                }
          
                // Check for receiver name
                if (
                  c.userId.toString() === lastMessage.receiverId.toString() &&
                  contact.contactOwnerId.toString() === lastMessage.senderId.toString()
                ) {
                  receiverName = c.name;
                }
              });
            });
          }
          
          // console.log("Sender Name:", senderName);
          // console.log("Receiver Name:", receiverName);       
  
          // Add all enriched fields
          return {
            ...lastMessage.toObject(),
            senderName: senderName || senderUserInfo?.phnNumber || senderEnterpriseInfo?.phnNumber || senderEmployeeInfo?.phnNumber || "User Deleted",
            senderNumber: senderUserInfo?.phnNumber || senderEnterpriseInfo?.phnNumber || senderEmployeeInfo?.phnNumber || "Receiver is not a Know Connections user",
            receiverName: receiverName || receiverUserInfo?.phnNumber || receiverEnterpriseInfo?.phnNumber || receiverEmployeeInfo?.phnNumber || "User Deleted",
            receiverNumber: receiverUserInfo?.phnNumber || receiverEnterpriseInfo?.phnNumber || receiverEmployeeInfo?.phnNumber || "Receiver is not a Know Connections user",
            senderProfilePic: senderUserInfo?.image || senderEnterpriseInfo?.image || senderEmployeeInfo?.image || "",
            receiverProfilePic: receiverUserInfo?.image || receiverEnterpriseInfo?.image || receiverEmployeeInfo?.image || "",
            unreadCount: messages.filter(
              (msg) =>
                !msg.isRead &&
                msg.receiverId.toString() === userId.toString() &&
                msg.chatId.toString() === lastMessage.chatId.toString()
            ).length,
            
          };
        })
      );
      
      // console.log("Enriched Messages:", enrichedMessages);
      // Apply pagination if page and limit are provided
      if (page !== null && limit !== null) {
        const startIndex = (page - 1) * limit;
        enrichedMessages = enrichedMessages.slice(startIndex, startIndex + limit);
      }
  
      return res.status(200).json(enrichedMessages);
    }  else {
      return res
        .status(400)
        .json({ error: "Either chatId or userId must be provided." });
    }
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages." });
  }
};



// New Send Message
exports.sendMessageNew = async (req, res) => {
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
    await message.save();
    
    // Notify the sender and receiver using Socket.io
    const receiverSocketId = getReceiverSocketId(receiverId);
    const senderSocketId = getReceiverSocketId(senderId);
    if (receiverSocketId) {
      // io.to(receiverSocketId).to(senderSocketId).emit("newMessage", message);
      io.to(receiverSocketId).emit("newMessage", message);
      const newChatList = await getAdminNewChatList({userId: receiverId});
      // console.log("newChatList", newChatList);
      // io.to(receiverSocketId).to(senderSocketId).emit("newChat", newChatList);
      io.to(receiverSocketId).emit("newChat", newChatList);
    }


    // // Emit the message to the respective chat room (chatId)
    // io.to(chatId).emit("receiveMessage", {
    //   ...message.toObject(),
    //   senderName: sender.username || sender.name || "Unknown Sender", // Use appropriate field for sender name
    //   receiverName: receiver.username || receiver.name || "Unknown Receiver", // Use appropriate field for receiver name
    // });

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

// New Get Message
exports.getMessagesNew = async (req, res) => {
  const { chatId, userId } = req.query;
  let { page = null, limit = null } = req.query;

  try {
    if (chatId) {
      let messages = await Message.find({ chatId }).sort({ timestamp: 1 });

      // Get unread messages count for the current user in this chat
      const unreadCount = await Message.countDocuments({
        chatId,
        receiverId: userId,
        isRead: false,
      });


       // Apply pagination if page and limit are provided
      if (page !== null && limit !== null) {
        const startIndex = (page - 1) * limit;
        messages = messages.slice(startIndex, startIndex + limit);
      }
      const isAdmin = chatId === admin_userId.toString();
      console.log("isAdmin", isAdmin);
      if (isAdmin) {
        return res.status(200).json({
          messages: messages.map((message) => ({
            ...message.toObject(),
          })),
          unreadCount,
          isAdmin : true
        });
      }

      return res.status(200).json({
        messages: messages.map((message) => ({
          ...message.toObject(),
        })),
        unreadCount,
        
      });
    } else if (userId) {
      const enrichedMessages = await getAdminNewChatList({userId});
      // console.log("Enriched Messages:", enrichedMessages);
      // Apply pagination if page and limit are provided
      if (page !== null && limit !== null) {
        const startIndex = (page - 1) * limit;
        enrichedMessages = enrichedMessages.slice(startIndex, startIndex + limit);
      }
  
      return res.status(200).json(enrichedMessages);
    }  else {
      return res
        .status(400)
        .json({ error: "Either chatId or userId must be provided." });
    }
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages." });
  }
};

exports.getMessagesByChatId = async (req, res) => {
  const { chatId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!chatId) {
    return res.status(400).json({ error: "chatId must be provided." });
  }

  // Convert page and limit to integers
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, parseInt(limit, 10)); // Ensure limit is at least 1

  try {
    const [messages, totalMessages] = await Promise.all([
      Message.find({ chatId })
        .sort({ timestamp: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .select('content timestamp localTime image readBy'),
      Message.countDocuments({ chatId })
    ]);
      const totalPages =  Math.ceil(totalMessages / limit);
      return res.status(200).json({
        messages,
        page: Number(page),
        limit: Number(limit),
        totalPages
      });

  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Error retrieving messages." });
  }
};

// Handle Image upload request
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    // The folder name in the S3 bucket
    const folderName = "admin_channel_images";
    const fileName = req.file.originalname;

    // Upload the file to S3
    const result = await uploadImageToS3(req.file.buffer, folderName, fileName);
    const originalUrl = result.Location; // S3 URL of the uploaded file

    // // Generate a short code and ensure uniqueness in DB
    // let shortCode;
    // while (true) {
    //   shortCode = shortId.generate();
    //   const urlExists = await Url.findOne({ shortCode });
    //   if (!urlExists) break; // If unique, exit loop
    // }

    // // Construct short URL
    // const shortUrl = `${process.env.SHORT_BASE_URL}/${shortCode}`;

    // // Save the shortened URL to the database
    // const newUrl = new Url({ originalUrl, shortCode, shortUrl });
    // await newUrl.save();

    // Send back the shortened URL along with the original S3 URL
    return res.status(200).json({
      message: "File uploaded successfully",
      originalUrl
      // shortUrl,
    });
  } catch (error) {
    console.error("Error in image upload:", error);
    return res.status(500).send({ error: "Failed to upload image" });
  }
};

const uploadMessageImage = async (req, res) => {
  // console.log("files: ", req.files['image'][0].originalname);
  try {
    if (!req.files?.image) {
      // return res.status(400).send({ error: "No file uploaded" });
      return ""
    }

    // The folder name in the S3 bucket
    const folderName = "admin_channel_images";
    // const fileName = req.files['image'][0].originalname ;
    const file_ext = req.files['image'][0].originalname.split('.').pop();
    const fileName = req.files['image'][0].originalname +"_"+ new Date().getTime()+"."+file_ext;
    

    // Upload the file to S3
    const result = await uploadImageToS3(req.files['image'][0].buffer, folderName, fileName);
    const originalUrl = result.Location; // S3 URL of the uploaded file

    // // Generate a short code and ensure uniqueness in DB
    // let shortCode;
    // while (true) {
    //   shortCode = shortId.generate();
    //   const urlExists = await Url.findOne({ shortCode });
    //   if (!urlExists) break; // If unique, exit loop
    // }

    // // Construct short URL
    // const shortUrl = `${process.env.SHORT_BASE_URL}/${shortCode}`;

    // // Save the shortened URL to the database
    // const newUrl = new Url({ originalUrl, shortCode, shortUrl });
    // await newUrl.save();

    // Send back the shortened URL along with the original S3 URL
    return originalUrl
  } catch (error) {
    console.error("Error in image upload:", error);
    return 
  }
};

const uploadMessageVideo = async (req, res) => {
  // console.log("video : ", req.files.video[0].originalname);
  try {
    if (!req.files?.video) {
      // return res.status(400).send({ error: "No file uploaded" });
      return ""
    }

    // The folder name in the S3 bucket
    const folderName = "admin_channel_videos";
    // const fileName = req.files.video[0].originalname;
    const file_ext = req.files['video'][0].originalname.split('.').pop();
    const fileName = req.files.video[0].originalname+"_"+Date.now()+"."+file_ext;

    // Upload the file to S3
    const result = await uploadImageToS3(req.files['video'][0].buffer, folderName, fileName);
    const originalUrl = result.Location; // S3 URL of the uploaded file

    // // Generate a short code and ensure uniqueness in DB
    // let shortCode;
    // while (true) {
    //   shortCode = shortId.generate();
    //   const urlExists = await Url.findOne({ shortCode });
    //   if (!urlExists) break; // If unique, exit loop
    // }

    // // Construct short URL
    // const shortUrl = `${process.env.SHORT_BASE_URL}/${shortCode}`;

    // // Save the shortened URL to the database
    // const newUrl = new Url({ originalUrl, shortCode, shortUrl });
    // await newUrl.save();

    // Send back the shortened URL along with the original S3 URL
    return originalUrl
  } catch (error) {
    console.error("Error in video upload:", error);
    return 
  }
};

const enrichReadBy = async (message) => {
  const userPromises = message.readBy.map(async (id) => {
      console.log(id);
      return await User.findById(id).select('username image phnNumber').lean();
  });
  
  // Wait for all promises to resolve
  Promise.all(userPromises)
      .then(users => {
          console.log("Users:", users);
      })
      .catch(error => {
          console.error("Error fetching users:", error);
      });     

    return message
}
