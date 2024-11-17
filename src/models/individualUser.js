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
    referralCode: {type: String},  // Unique referral code
    coins: { type: Number, default: 0 },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' }]
    
  }, { timestamps: true });

  //add referral code to user when we register user 
  IndividualUserSchema.pre('save', async function (next) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let referralCode;
    let isUnique = false;

    while (!isUnique) {
        referralCode = Array.from({ length: 6 }, () => characters.charAt(Math.floor(Math.random() * characters.length))).join('');

        const existingUser = await User.findOne({ referralCode });
        if (!existingUser) {
            isUnique = true;
        }
    }
    
    if (!this.referralCode) {
      const referralCode = Math.random().toString(36).substring(7);
      this.referralCode = referralCode;
    }
    next();
  });

  
  module.exports.individualUserCollection = mongoose.model('User', IndividualUserSchema);
  