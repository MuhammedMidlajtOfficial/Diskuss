const teamModel = require("../../models/team.model");


module.exports.createTeam = async (req, res) => {
    try {
        const { teamName, permissions, teamMembersId, teamLead } = teamData = req.body
        if( !teamName || !permissions || !teamMembersId || !teamLead ){
            return res.status(400).json({ message: "All fields are required" });
        }

        const team = await teamModel.create({ teamData })
        if (!team) {
            return res.status(404).json({ message: "Team creation failed" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to add team", error });
    }
};

module.exports.editTeam = async (req, res) => {
    try {
        const { teamId, teamName, permissions, teamMembersId, teamLead } = teamData = req.body
        
        const teamExist = await teamModel.findOne({ _id:teamId })
        if(!teamExist){
            return res.status(404).json({ message: "Team not found" });
        }
        const team = await teamModel.updateOne({ _id:teamId },{ teamData })
        if (!team) {
            return res.status(404).json({ message: "Team creation failed" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to add team", error });
    }
};