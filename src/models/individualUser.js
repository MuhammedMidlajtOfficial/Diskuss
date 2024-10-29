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
<<<<<<< HEAD
    isSubscribed: {
      type: Boolean,
      default: false,
    },
    
  }, { timestamps: true });
  
  module.exports.individualUserCollection = mongoose.model('User', IndividualUserSchema);
=======
    cardNo: {
      type: Number,
      required: true,
      default : 0
    },
  });
  
  // module.exports = mongoose.model('User', IndividualUserSchema);
>>>>>>> Naren
  