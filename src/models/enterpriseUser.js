const { string } = require('joi')
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
    },
    phnNumber: {
      type:String,
      required:true,
    },
    aboutUs: {
        type:String,
        default : ''
    },
    website: {
        type:String,
        default : ''
    },
    address: {
        type:String,
        default : ''
      },
    socialMedia: {
      whatsappNo: {
        type:String,
        default : ''
      },
      facebookLink: {
        type:String,
        default : ''
      },
      instagramLink: {
        type:String,
        default : ''
      },
      twitterLink: {
        type:String,
        default : ''
      },
    },
    empCards:[ {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'EnterpriseEmployeeCard' 
    } ],
    empId :[ {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'EnterpriseEmployee' 
    } ],
    meetings: [
      {
        type: String,
        ref: "EnterpriseMeeting", // Reference to Meeting model
        required: false,
      },
    ],
    theme:{
      type:String,
      default:'01',
      required:true
    }
},{ timestamps:true })


module.exports = mongoose.model('EnterpriseUser',enterpriseUserSchema)
