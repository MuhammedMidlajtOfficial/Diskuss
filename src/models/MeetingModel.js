// models/Meeting.js
const mongoose = require('mongoose');
const cron = require('node-cron');


const meetingSchema = new mongoose.Schema({
  meetingOwner: { type: mongoose.Schema.Types.ObjectId,ref:'user', required: true }, // Common for both types
  meetingTitle: { type: String, required: true }, // Common for both types

  // Meeting Type: Online or Offline
  type: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },

  // Fields for Online Meeting
  meetingPlatform: { type: String, required: function() { return this.type === 'online'; } },
  meetingLink: { type: String, required: function() { return this.type === 'online'; } },

  // Fields for Offline Meeting
  meetingPlace: { type: String, required: function() { return this.type === 'offline'; } },
  roomNo: { type: String, required: function() { return this.type === 'offline'; } },
  cabinNo: { type: String, function() { return this.type === 'offline'; } },

  // Common Fields for Date and Time
  selectedDate: { type: Date, required: true }, // Date of the meeting
  startTime: { type: String, required: true }, // Meeting start time
  endTime: { type: String, required: true }, // Meeting end time

  // List of People Invited
  invitedPeople: [
    {
      user: { type: String , required: true },
      status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
      reason: { type: String, required: function() { return this.status === 'rejected'; } }
    }
  ],

  description: { type: String }, // Description for the meeting
  isRemind: { type: Boolean, default: false }, // Reminder option

}, { timestamps: true });

// Export the model
module.exports = mongoose.model('Meeting', meetingSchema);
