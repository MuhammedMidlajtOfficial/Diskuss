const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId:{
    type:String,
    required:true
  },
  businessName: {
    type:String,
    required:true
  },
  yourName: {
    type:String,
    required:true
  },
  designation: {
    type:String,
    required:true
  },
  mobile: {
    type:String,
    required:true
  },
  email: {
    type:String,
    required:true
  },
  location: {
    type:String,
    required:true
  },
  services: [{
    type:String,
    required:true
  }], 
  image: {
    type:String,
    required:true
  },       
  position: {
    type:String,
    required:true
  },
  color: {
    type:String,
    required:true
  },
});

module.exports = mongoose.model("Profile", profileSchema);