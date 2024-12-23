const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  userId: {
    type:String,
    required : true
  },
  businessName: {
    type:String,
    required : true
  },
  businessType: {
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
  } ], 
  image:  {
    type:String,
    default:''
  },       
  position:  {
    type:String,
    required : true
  },
  color:  {
    type:String,
    required : true
  },
  cardType: {
    type:String,
    required:true,
    default:"Personal card"
  },
  website:  {
    type:String,
    required : true
  },
  theme:{
    type:String,
    default:'01',
    required:true
  },
  topServices: [ {
    type:String,
    max:5,
    required:true
  } ],
    whatsappNo: {
      type: Number,
      default: "",
    },
    facebookLink: {
      type: String,
      default: "",
    },
    instagramLink: {
      type: String,
      default: "",
    },
    twitterLink: {
      type: String,
      default: "",
    },
},{ timestamps:true });

module.exports = mongoose.model("Card", cardSchema);
