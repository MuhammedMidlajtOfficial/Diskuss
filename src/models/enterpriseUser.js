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
    } ]

},{ timestamps:true })

module.exports = mongoose.model('EnterpriseUser',enterpriseUserSchema)