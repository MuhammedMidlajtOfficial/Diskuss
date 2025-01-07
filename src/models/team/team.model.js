const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  teamOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'EnterpriseUser'
  },
  teamName: {
    type: String,
    required: true
  },
  permissions: {
    type: String,
    required: true
  },
  teamMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref:'EnterpriseEmployee',
    }
  ],
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    ref:'EnterpriseEmployee',
  },
  TLPermissions:{
    type: String,
    required: true,
  }
});

module.exports = mongoose.model("Team", teamSchema);
