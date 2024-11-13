const enterpriseUser = require("../../models/enterpriseUser");
const teamModel = require("../../models/team.model");

module.exports.getAllTeamById = async (req, res) => {
    try {
        const teamOwnerId= req.params.id
        if( !teamOwnerId ){
            return res.status(400).json({ message: "teamOwnerId is required" });
        }

        const team = await teamModel.findOne({ teamOwnerId })
        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch team", error });
    }
};

module.exports.createTeam = async (req, res) => {
    try {
        const { teamOwnerId, teamName, permissions, teamMembersId, TLPermissions, teamLead } = req.body;
        
        // Check for missing required fields
        if (!teamOwnerId || !teamName || !permissions || !teamMembersId || !teamLead || !TLPermissions) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Create the team document directly with the unpacked team data
        const team = await teamModel.create({
            teamOwnerId,
            teamName,
            permissions,
            teamMembersId,
            TLPermissions,
            teamLead
        });

        if (!team) {
            return res.status(404).json({ message: "Team creation failed" });
        }

        res.status(201).json({ message: "Team created successfully", team });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to add team", error });
    }
};


module.exports.editTeam = async (req, res) => {
    try {
        const { teamId, teamName, permissions, teamMembersId, TLPermissions, teamLead } = req.body;

        const teamExist = await teamModel.findOne({ _id: teamId });
        if (!teamExist) {
            return res.status(404).json({ message: "Team not found" });
        }

        const updateResult = await teamModel.updateOne(
            { _id: teamId },
            { teamName, permissions, teamMembersId, teamLead, TLPermissions }
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(500).json({ message: "Team update failed" });
        }

        return res.status(200).json({ message: "Team updated successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to update team", error });
    }
};

module.exports.deleteTeam = async (req, res) => {
    try {
        const { teamId } = req.body;

        const teamExist = await teamModel.findOne({ _id: teamId });
        if (!teamExist) {
            return res.status(404).json({ message: "Team not found" });
        }

        const deleteResult = await teamModel.deleteOne({ _id: teamId });
        if (deleteResult.deletedCount === 0) {
            return res.status(500).json({ message: "Team deletion failed" });
        }

        return res.status(200).json({ message: "Team deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to delete team", error });
    }
};

module.exports.getCardForEnterprise = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const user = await enterpriseUser.findOne({ _id : userId }).populate('empCards');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user.empCards);
        return res.status(200).json({ cards:user.empCards })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch employee cards", error });
    }
};

module.exports.getUserOfEnterprise = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const user = await enterpriseUser.findOne({ _id : userId }).populate({
            path: 'empId',
            strictPopulate: false, 
        } )
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user);
        return res.status(200).json({ employee:user.empId })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch employee", error });
    }
}