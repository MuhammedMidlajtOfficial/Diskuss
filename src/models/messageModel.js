// // models/Message.js
// const mongoose = require('mongoose');
// const MessageSchema = new mongoose.Schema({
//   chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
//   senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   type: { type: String, enum: ['text', 'image', 'voice'], required: true },
//   content: { type: String, required: true },
//   status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
//   timestamp: { type: Date, default: Date.now },
//   replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
// });
// module.exports = mongoose.model('Message', MessageSchema);

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: String, required: true, ref: "User" },
  receiverId: { type: String, required: true, ref: "User" },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
