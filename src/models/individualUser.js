const mongoose = require("mongoose");


const IndividualUserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    referralCode: String,  // Unique referral code
    coins: { type: Number, default: 0 },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' }]
    
  }, { timestamps: true });
  
  module.exports.individualUserCollection = mongoose.model('User', IndividualUserSchema);
  