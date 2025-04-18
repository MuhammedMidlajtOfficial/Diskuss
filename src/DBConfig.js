// require('dotenv').config();

// const crypto = require('crypto');

// const mongoose = require('mongoose');
// const mailSender = require('./util/mailSender');
// // console.log(process.env.MongoDBURL);

// if (!process.env.MongoDBURL) {
//   console.error("MongoDBURL environment variable is not defined.");
//   process.exit(1);
// }

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MongoDBURL, {
//       connectTimeoutMS: 20000,
//       socketTimeoutMS: 45000,
//     });
//     console.log('DB Connected');
//     return
//   } catch (error) {
//     console.error('DB Connection Failed:', error);
//     return
//   }
// };

// connectDB();

// mongoose.connect( process.env.MongoDBURL,{
//   connectTimeoutMS: 20000, 
//   socketTimeoutMS: 45000,
// })
//   .then(() => {
//     console.log('DB Connected');
//   })
//   .catch((err) => {
//     console.error('DB Connection Failed:', err);
//   });


// } else{
//   mongoose.connect( process.env.MongoDBURL,{
//     connectTimeoutMS: 20000, 
//     socketTimeoutMS: 45000,
//   })
//     .then(() => {
//       console.log('DB Connected');
//     })
//     .catch((err) => {
//       console.error('DB Connection Failed:', err);
//     });
// }


// db.js
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

let isConnected = false; // Prevent multiple connections

const connectDB = async () => {
  if (isConnected) {
    console.log('🟢 Already connected to MongoDB');
    return;
  }

  if (!process.env.MongoDBURL) {
    console.error("❌ MongoDBURL not set in .env");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MongoDBURL, {
      maxPoolSize: 100,            // Handle more concurrent operations
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000, // Fail fast if can't connect
      connectTimeoutMS: 20000,
      socketTimeoutMS: 45000,
    });

    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// Optional: Clean disconnection when app closes
const disconnectDB = async () => {
  if (!isConnected) return;

  try {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
    isConnected = false;
  } catch (err) {
    console.error("❌ Error during disconnection:", err.message);
  }
};





  const individualUserSchema = new mongoose.Schema({
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
      ref: "Meeting", // Reference to Meeting model
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
    coinsWithdrawn: { type: Number, default: 0 },
    coinsPending: { type: Number, default: 0 },
    invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' }],
    isDeleted : {type: Boolean, default: false}
  } ,{ timestamps: true });

  // const otpSchema = new mongoose.Schema({
  //   email: {
  //     type: String,
  //     required: true,
  //   },
  //   otp: {
  //     type: String,
  //     required: true,
  //   },
  //   createdAt: {
  //     type: Date,
  //     default: Date.now,
  //     expires: 60 * 5, 
  //   },
  // });



  // async function sendVerificationEmail(email, otp) {
  //   try {
  //     const mailResponse = await mailSender(
  //       email,
  //       "Connect - Verification Email",
  //       `
  //         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
  //           <h2 style="color: #333; text-align: center;">Know Connections - Verification Email</h2>
  //           <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; text-align: center;">
  //             <h1 style="color: #007bff;">Please confirm your OTP</h1>
  //             <p style="font-size: 18px; color: #555;">Here is your OTP code: ${otp}</p>
  //           </div>
  //         </div>
  //       `
  //     );
  //     console.log("Email sent successfully: ", mailResponse);
  //   } catch (error) {
  //     console.log("Error occurred while sending email: ", error);
  //     throw error;
  //   }
  // }
  // otpSchema.pre("save", async function (next) {
  //   console.log("New document saved to the database");
  //   if (this.isNew) {
  //     await sendVerificationEmail(this.email, this.otp);
  //   }
  //   next();
  // });
  
// Set referral code as unique
// Generate a unique referral code using crypto or any other method
individualUserSchema.pre('save', async function(next) {
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


module.exports = {
  individualUserCollection :  mongoose.model('user', individualUserSchema),
  connectDB, 
  disconnectDB
}
// module.exports.otpCollection = mongoose.model('otp', otpSchema);

// module.exports = {  };