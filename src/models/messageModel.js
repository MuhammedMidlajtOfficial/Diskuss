const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

messageSchema.set("toJSON", {
  transform: function (doc, ret) {
    // Convert timestamp to local time string
    const localDate = new Date(ret.timestamp).toLocaleString("en-US", {
      timeZone: "Asia/Kolkata", // Replace with your timezone
      hour12: false,
    });
    ret.timestamp = localDate; // Replace the original timestamp
    return ret;
  },
});

module.exports = mongoose.model('Message', messageSchema);
