// models/NotificationModel.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // User to whom the notification is sent
    meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true }, // The meeting associated with the notification
    message: { type: String, required: true }, // Notification message
    createdAt: { type: Date, default: Date.now }, // Timestamp for when the notification was created
}, { timestamps: true });

// Export the model
module.exports = mongoose.model('Notification', notificationSchema);
