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
  password: {
    type: String,
    required: true,
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
  referralCode: {
    type: String,
    unique: true, // Ensure referral codes are unique
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
<<<<<<< HEAD
    referralCode: {type: String},  // Unique referral code
=======
  },
    coins: { type: Number, default: 0 },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    referralCode: String,  // Unique referral code
>>>>>>> 688a71dca81f29a19fe53b4715a394d579a12800
    coins: { type: Number, default: 0 },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' }],
  
    meetings: [
      {
        type: String,
        ref: "Meeting", // Reference to Meeting model
        required: false,
      },
    ],
} ,{ timestamps: true });

// Set referral code as unique
// Generate a unique referral code using crypto or any other method
IndividualUserSchema.pre('save', async function(next) {
  if (!this.referralCode) {
    const generateReferralCode = () => {
      return crypto.randomBytes(4).toString('hex').toUpperCase(); // Generate 12 character long referral code
    };

    let referralCode = generateReferralCode();
    
<<<<<<< HEAD
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
=======
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


>>>>>>> 688a71dca81f29a19fe53b4715a394d579a12800

  
  module.exports.individualUserCollection = mongoose.model('User', IndividualUserSchema);
  
  // module.exports = mongoose.model('User', IndividualUserSchema);
  
