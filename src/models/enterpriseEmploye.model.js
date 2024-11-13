const mongoose = require("mongoose");

const EnterpriseEmployeeSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    userType: {
        type: String,
        default:'employee'
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    cardNo: {
      type: Number,
      required: true,
      default : 0
    },
    image: {
      type:String,
      default : ''
    },
    role: {
      type:String,
      default : ''
    },
    website: {
      type:String,
      default : ''
    },
    phnNumber: {
      type:String,
      default : ''
    },
    address: {
      type:String,
      default : ''
    },
    contacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
        default: []
      }
    ],    
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
      
    }
} ,{ timestamps: true });

module.exports = mongoose.model("EnterpriseEmployee",EnterpriseEmployeeSchema );
