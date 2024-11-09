const mongoose = require("mongoose");

const EnterpriseEmployeeSchema = new mongoose.Schema({
    email: {
        type:String,
        required : true
    },
    password: {
        type:String,
        required : true
    },
    businessName: {
      type:String,
      required : true
    },
    empName:  {
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
      required : true,
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
      required : true,
      default:''
    },
});

module.exports = mongoose.model("EnterpriseEmployee",EnterpriseEmployeeSchema );
