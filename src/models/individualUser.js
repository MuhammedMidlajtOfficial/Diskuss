const mongoose = require("mongoose");


const IndividualUserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
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
    }
  } ,{ timestamps: true });
  
  module.exports.individualUserCollection = mongoose.model('User', IndividualUserSchema);
  
  // module.exports = mongoose.model('User', IndividualUserSchema);
  