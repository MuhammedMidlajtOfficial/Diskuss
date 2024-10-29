const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema({
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
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cards : [{ type : mongoose.Schema.Types.ObjectId, ref: 'Card', required: false }],
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  incentives : [{ type : mongoose.Schema.Types.ObjectId, ref: 'Incentive', required: false }],
});

module.exports = mongoose.model("Profile", ProfileSchema);