require('dotenv').config();

const mongoose = require('mongoose');
const mailSender = require('./util/mailSender');

if (!process.env.MongoDBURL) {
  console.error("MongoDBURL environment variable is not defined.");
  process.exit(1);
}

const MongoLocalURI = "mongodb://localhost:27017/diskuss"
let localDb = false 

if (localDb){
  mongoose.connect(MongoLocalURI,{
    connectTimeoutMS: 20000, 
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('DB Connected');
  })
  .catch((err) => {
    console.error('DB Connection Failed:', err);
  });

} else{
  mongoose.connect( process.env.MongoDBURL,{
    connectTimeoutMS: 20000, 
    socketTimeoutMS: 45000,
  })
    .then(() => {
      console.log('DB Connected');
    })
    .catch((err) => {
      console.error('DB Connection Failed:', err);
    });
}



  const individualUserSchema = new mongoose.Schema({
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
  });

  const otpSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 5, 
    },
  });



  async function sendVerificationEmail(email, otp) {
    try {
      const mailResponse = await mailSender(
        email,
        "Connect - Verification Email",
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2 style="color: #333; text-align: center;">DISKUSS - Verification Email</h2>
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px; text-align: center;">
              <h1 style="color: #007bff;">Please confirm your OTP</h1>
              <p style="font-size: 18px; color: #555;">Here is your OTP code: ${otp}</p>
            </div>
          </div>
        `
      );
      console.log("Email sent successfully: ", mailResponse);
    } catch (error) {
      console.log("Error occurred while sending email: ", error);
      throw error;
    }
  }
  otpSchema.pre("save", async function (next) {
    console.log("New document saved to the database");
    if (this.isNew) {
      await sendVerificationEmail(this.email, this.otp);
    }
    next();
  });
  
module.exports.individualUserCollection = mongoose.model('user', individualUserSchema);
module.exports.otpCollection = mongoose.model('otp', otpSchema);
