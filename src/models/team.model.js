const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  teamName:{
    type:String,
    required:true
  },
  permissions:{
    type:String,
    required:true
  },
  teamMembersId:[ {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnterpriseEmployee',
    required:true
  } ],
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EnterpriseEmployee',
    required:true
  }
});

module.exports = mongoose.model("Team", teamSchema);