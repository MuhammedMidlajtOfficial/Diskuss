const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
  businessName: String,
  yourName: String,
  designation: String,
  mobile: String,
  email: String,
  location: String,
  services: [String], 
  image: String,       
  position: String,
  color: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cards : [{ type : mongoose.Schema.Types.ObjectId, ref: 'Card', required: false }],
});

module.exports = mongoose.model("Profile", ProfileSchema);