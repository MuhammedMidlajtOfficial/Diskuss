const mongoose = require("mongoose");
const crypto = require('crypto');

const IndividualUserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    companyName: {
      type: String,
      default: ''
    },
    password: {
      type: String
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    cardNo: {
      type: Number,
      required: true,
      default : 0
    },
    firstCardCreated: {
      type: Boolean,
      required: true,
      default : false
    },
    image: {
      type:String,
      default : ''
    },
    role: {
      type:String,
      default : ''
    },
    name: {
      type:String,
      default : ''
    },
    website: {
      type:String,
      default : ''
    },
    phnNumber: {
      type: String,
      default: '',
    },
    address: {
      type:String,
      default : ''
    },
    contacts : {
      type : Array,
      default : []
    },
    meetings : [{
      type: String,
      // ref: "Meeting", // Reference to Meeting model
      required: false,
    }],
    status:{
      type:String,
      default : 'active'
    },
    socialMedia: {
      whatsappNo: {
        type:String,
        default : ''
      },
      facebookLink: {
        type:String,
        default : ''
      },
      instagramLink: {
        type:String,
        default : ''
      },
      twitterLink: {
        type:String,
        default : ''
      },
    },
    referralCode: {
      type: String,
      unique: true,
    }, // Ensure referral codes are unique
    referralCodeUsed: {
      type: String,
      default: null,
    }, // Referral code used by the user
    coinsBalance : { type: Number, default: 0 },
    coinsRewarded: { type: Number, default: 0 },
    coinsWithdrawn: { type: Number, default: 0 },
    coinsPending: { type: Number, default: 0 },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' }],
    isDeleted : {type: Boolean, default: false}
  } ,{ timestamps: true });

// Set referral code as unique
// Generate a unique referral code using crypto or any other method
IndividualUserSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    const generateReferralCode = () => {
      return crypto.randomBytes(4).toString('hex').toUpperCase(); // Generate 12 character long referral code
    };

    let referralCode = generateReferralCode();
    
    // Ensure the referral code is unique
    let isUnique = false;
    while (!isUnique) {
      const existingUser = await mongoose.model('User').findOne({ 'referralCode': referralCode });
      if (!existingUser) {
        isUnique = true;
      } else {
        referralCode = generateReferralCode(); // Generate a new code if it's not unique
      }
    }

    this.referralCode = referralCode;
  }

  next();
});  
  
  module.exports = mongoose.model('User', IndividualUserSchema);
  
