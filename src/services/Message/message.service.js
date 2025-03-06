const User = require('../../models/users/individualUser');
const EnterpriseEmployee = require('../../models/users/enterpriseEmploye.model');
const EnterpriseUser = require('../../models/users/enterpriseUser');
const Message = require('../../models/message/messageModel');
const axios = require('axios');
const { ObjectId } = require('mongoose').Types;
let io;

async function setSocketIO(socketIO)  {
    io = socketIO;
};

async function findSender(senderId) {
  const [senderInUser, senderInContact, senderInEnterprise] =
    await Promise.all([
      User.findById(senderId),
      EnterpriseEmployee.findById(senderId),
      EnterpriseUser.findById(senderId),
    ]);

  return senderInUser || senderInContact || senderInEnterprise;
}

async function findReceiver(receiverId) {
  const [receiverInUser, receiverInContact, receiverInEnterprise] =
    await Promise.all([
      User.findById(receiverId),
      EnterpriseEmployee.findById(receiverId),
      EnterpriseUser.findById(receiverId),
    ]);

  return receiverInUser || receiverInContact || receiverInEnterprise;
}

async function generateChatId(senderId, receiverId) {
  return [senderId, receiverId].sort().join("-");
}

async function createMessage({chatId, senderId, receiverId, content}) {
    console.log("chatId "+ chatId + " \nsenderId "+ senderId + " receiverId "+ receiverId + " content "+ content);
try{
    const now = new Date();
    const localTime = new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata", // Replace with your desired timezone
    }).format(now);
  
    senderId = new ObjectId(senderId);
    receiverId = new ObjectId(receiverId);
    
    return await Message.create({
      chatId,
      senderId,
      receiverId,
      content,
      timestamp: now,
      localTime,
    });
} catch (error) {
    console.error("Error creating message:", error.message);
  }
}

async function emitMessage(message, sender, receiver) {
  io.to(message.chatId).emit("receiveMessage", {
    ...message.toObject(),
    senderName: sender.username || sender.name || "Unknown Sender",
    receiverName: receiver.username || receiver.name || "Unknown Receiver",
  });
}

async function notifyReceiver(receiverId, senderName, content, chatId) {
  try {
    await axios.post(
      "http://13.203.24.247:9000/api/v1/fcm/sendMessageNotification",
      {
        receiverId,
        senderName,
        content,
        chatId,
      }
    );
  } catch (notificationError) {
    console.error("Error sending notification:", notificationError.message);
  }
}

module.exports = {
setSocketIO,
  findSender,
  findReceiver,
  generateChatId,
  createMessage,
  emitMessage,
  notifyReceiver,
};
