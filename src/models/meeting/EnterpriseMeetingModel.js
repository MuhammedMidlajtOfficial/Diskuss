// models/Meeting.js
const mongoose = require('mongoose');
const cron = require('node-cron');


const meetingSchema = new mongoose.Schema({
  meetingOwner: { type: mongoose.Schema.Types.ObjectId,ref:'EnterpriseEmployee', required: true }, // Common for both types
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
      status: { type: String, enum: ['pending', 'accepted', 'denied'], default: 'pending' },
      // reason: { type: String, required: function() { return this.status === 'rejected'; } }
      reason: { type: String, default: '' }
    }
  ],
  ListOfInvitedPeopleViaSms: [  
    {
      Name: { type: String, required: true },
      PhonNumber: { type: String, required: true },
      status:{type:String,default:'Invite Via SMS'}
      
    }
  ],

  description: { type: String }, // Description for the meeting
  isRemind: { type: Boolean, default: false }, // Reminder option

}, { timestamps: true });


// Setting Indexes
meetingSchema.index({ meetingOwner: 1 });
meetingSchema.index({ "invitedPeople.user": 1 });
meetingSchema.index({ selectedDate: 1 });

// Export the model
module.exports = mongoose.model('EnterpriseMeeting', meetingSchema);

