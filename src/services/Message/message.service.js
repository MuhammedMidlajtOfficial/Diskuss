const User = require('../../models/users/individualUser');
const mongoose = require("mongoose");
const EnterpriseEmployee = require('../../models/users/enterpriseEmploye.model');
const EnterpriseUser = require('../../models/users/enterpriseUser');
const Message = require('../../models/message/messageModel');
const axios = require('axios');
const Contact = require("../../models/contacts/contact.individual.model");

// const { getReceiverSocketId, userSocketMap } = require('../../Controller/Socketio/socketController');
const socketController = require('../../Controller/Socketio/socketController');

const { ObjectId } = require('mongoose').Types;
let io;

exports.markMessagesAsRead = async (data) => {
  const { messageId, chatId, receiverId, senderId } = data; // data = messageId, chatId, userId
      try {
        // 1. Update the message in the database
        const message = await Message.updateMany(
              { chatId, receiverId: receiverId, isRead: false },
              { $set: { isRead: true } }
            );
        // const message = await Message.findByIdAndUpdate(
        //   messageId,
        //   { isRead: true },
        //   { new: true } // Return the updated document
        // );

        if (!message) {
          console.log("Message not found");
          return;
        }

        // 2. Emit a "messageRead" event to the *sender* of the message.  This is important!
        //    You need to get the sender's socket ID.
        // console.log("get receiver 1", getReceiverSocketId);
        // console.log("get receiver 2", getReceiverSocketId(senderId));
        // console.log("get receiver 3", userSocketMap);
        const senderSocketId = socketController.getReceiverSocketId(senderId); // Assuming you have this function
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageRead", {
            recieverId: receiverId,
            chatId: chatId,
            senderId: senderId
          });
          console.log(`Emitted messageRead to sender ${senderId}`);
          return
        } else {
          console.log(`Sender ${message.senderId} not online.`);
          return 
        }
      } catch (error) {
        console.error("Error updating message isRead:", error);
        return
      }
  };

exports.getNewChatList = async (data) => {
  const {userId} = data; 
  console.log("userId", userId);
  try {
     const messages = await Message.find({
            $or: [
              { senderId: new mongoose.Types.ObjectId(userId) },
              { receiverId: new mongoose.Types.ObjectId(userId) },
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
                senderNumber: senderUserInfo?.phnNumber || senderEnterpriseInfo?.phnNumber || senderEmployeeInfo?.phnNumber || "Receiver is not a diskuss user",
                receiverName: receiverName || receiverUserInfo?.phnNumber || receiverEnterpriseInfo?.phnNumber || receiverEmployeeInfo?.phnNumber || "User Deleted",
                receiverNumber: receiverUserInfo?.phnNumber || receiverEnterpriseInfo?.phnNumber || receiverEmployeeInfo?.phnNumber || "Receiver is not a diskuss user",
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

          return enrichedMessages;
                
      }catch (error) {
    console.error("Error getting chat list:", error);
    return;
  }
}


exports.setSocketIO = (socketIO) =>  {
    io = socketIO;
};
