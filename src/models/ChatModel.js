// models/Chat.js
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    isGroupChat: { type: Boolean, default: false },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of user IDs
    chatName: { type: String }, // Optional, for group chat name
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin for group chat
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' } // Reference to the last message
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);
