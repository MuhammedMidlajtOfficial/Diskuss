const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("Profile", profileSchema);