// models/Chat.js
const mongoose = require('mongoose');
const ChatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Chat', ChatSchema);
