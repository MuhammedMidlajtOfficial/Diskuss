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

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  // senderName: { type: String, default: 'Unknown Sender',required: true },
  // receiverName: { type: String, default: 'Unknown Receiver',required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

module.exports = mongoose.model('Message', messageSchema);

