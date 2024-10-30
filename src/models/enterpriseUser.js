const mongoose = require('mongoose')

const enterpriseUserSchema = new mongoose.Schema({
    companyName : {
        type:String,
        required:true
    }, 
    industryType: {
        type:String,
        required:true
    }, 
    email: {
        type:String,
        required:true
    }, 
    password : {
        type:String,
        required:true
    },
    isSubscribed: {
        type: Boolean,
        default: false,
      },
    cardNo: {
        type: Number,
        default : 0
    },
    image: {
        type:String,
        default : ''
    }
},{ timestamps:true })

module.exports = mongoose.model('EnterpriseUser',enterpriseUserSchema)