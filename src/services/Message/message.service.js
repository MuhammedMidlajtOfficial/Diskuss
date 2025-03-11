const User = require('../../models/users/individualUser');
const EnterpriseEmployee = require('../../models/users/enterpriseEmploye.model');
const EnterpriseUser = require('../../models/users/enterpriseUser');
const Message = require('../../models/message/messageModel');
const axios = require('axios');
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
        } else {
          console.log(`Sender ${message.senderId} not online.`);
        }
      } catch (error) {
        console.error("Error updating message isRead:", error);
      }
  };

exports.setSocketIO = (socketIO) =>  {
    io = socketIO;
};
