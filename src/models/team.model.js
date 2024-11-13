const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true
  },
  permissions: {
    type: String,
    required: true
  },
  teamMembersId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'teamMemberType'  // Dynamic reference based on teamMemberType field
    }
  ],
  teamMemberType: {
    type: String,
    required: true,
    enum: ['EnterpriseEmployee', 'EnterpriseUser']  // Restrict to specific models
  },
  teamLead: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'teamLeadType'  // Dynamic reference based on teamLeadType field
  },
  teamLeadType: {
    type: String,
    required: true,
    enum: ['EnterpriseEmployee', 'EnterpriseUser']
  }
});

module.exports = mongoose.model("Team", teamSchema);
