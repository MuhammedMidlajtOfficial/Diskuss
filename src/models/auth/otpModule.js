const mongoose = require("mongoose");
const watiSender = require("../../util/Wati/watiSender");
const { sendOtpFast2SMS } = require("../../util/Fast2SMS/fast2SMSSender");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  phnNumber: {
    type: String,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 5, // 5 minutes
  },
});

async function sendVerificationMessage(phnNumber, otp) {
  try {
    const response = await sendOtpFast2SMS(phnNumber, otp);
    console.log("SMS OTP sent successfully:", response);
  } catch (error) {
    console.error("Error occurred while sending SMS OTP:", error);
    throw error;
  }
}

otpSchema.pre("save", async function (next) {
  console.log("New OTP document saved to the database");
  if (this.isNew) {
    await sendVerificationMessage(this.phnNumber, this.otp);
  }
  next();
});

module.exports = mongoose.model("otp", otpSchema);
