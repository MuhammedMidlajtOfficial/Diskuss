const Razorpay = require('razorpay');
require('dotenv')

module.exports.razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,  
  key_secret: process.env.RAZORPAY_API_SECRET
});