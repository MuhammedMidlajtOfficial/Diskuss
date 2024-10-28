const mongoose = require("mongoose");


const individualUserSchema = new mongoose.Schema({
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
  },
  { timestamps : true }
  );
  
  module.exports.individualUserCollection = mongoose.model('user', individualUserSchema);
  