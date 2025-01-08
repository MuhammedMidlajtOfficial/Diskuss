const mongoose = require("mongoose");

const EnterpriseEmployeeCardSchema = new mongoose.Schema({
  userId:{
    type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseEmployee',
    required : true
  },
  enterpriseId:{
    type: mongoose.Schema.Types.ObjectId, ref: 'EnterpriseUser',
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
  email: {
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
  location:  {
    type:String,
    required : true,
    default:''
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
    default:"Business card"
  },
  website:  {
    type:String,
    // required : true,
    default:''
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
    type: String,
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
  status:{
    type:String,
    default : 'active'
  },
});

module.exports = mongoose.model("EnterpriseEmployeeCard",EnterpriseEmployeeCardSchema );
