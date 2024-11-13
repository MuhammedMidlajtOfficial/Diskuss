const enterpriseUser = require("../../models/enterpriseUser");
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
        const { teamId, teamName, permissions, teamMembersId, teamLead } = req.body;

        const teamExist = await teamModel.findOne({ _id: teamId });
        if (!teamExist) {
            return res.status(404).json({ message: "Team not found" });
        }

        const updateResult = await teamModel.updateOne(
            { _id: teamId },
            { teamName, permissions, teamMembersId, teamLead }
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