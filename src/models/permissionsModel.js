// models/NotificationPreferences.js
const mongoose = require('mongoose');

const notificationPreferencesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true
  },
  generalNotifications: {
    type: Boolean,
    default: false // Default to false, user can enable it
  },
  appUpdate: {
    type: Boolean,
    default: false // Default to false, user can enable it
  },
  billReminder: {
    type: Boolean,
    default: false // Default to false, user can enable it
  },
  promotion: {
    type: Boolean,
    default: false // Default to false, user can enable it
  },
  discountAvailable: {
    type: Boolean,
    default: false // Default to false, user can enable it
  }
}, { timestamps: true });

module.exports = mongoose.model('NotificationPreferences', notificationPreferencesSchema);
