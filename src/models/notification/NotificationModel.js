const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    sender: {
        type: String,
    },
    receiver: {
        type: String,
    },
    type: {
        type: String,
        enum: ['message', 'meeting', 'alert', 'system','subscription'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    Plan_name : {
        type: String,
    },
    orderId : {
        type: String,
    },
    amount : {
        type: String,
    },
    currency : {
        type: String,
    },
    status: {
        type: String,
        enum: ['unread', 'read'],
        default: 'unread'
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = Notification;
