const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
<<<<<<< HEAD
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
=======
  userId: {
    type:String,
    required : true
  },
  businessName: {
    type:String,
    required : true
  },
  yourName:  {
    type:String,
    required : true
  },
  designation:  {
    type:String,
    required : true
  },
  mobile:  {
    type:String,
    required : true
  },
  email:  {
    type:String,
    required : true
  },
  location:  {
    type:String,
    required : true
  },
  services: [ {
    type:String,
    required : true
  }], 
  image:  {
    type:String,
    required : true
  },       
  position:  {
    type:String,
    required : true
  },
  color:  {
    type:String,
    required : true
  },
>>>>>>> Naren
});

module.exports = mongoose.model("Profile", ProfileSchema);