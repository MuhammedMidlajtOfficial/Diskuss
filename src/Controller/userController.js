const EnterpriseUser = require('../models/users/enterpriseUser');
const { individualUserCollection: IndividualUser } = require('../DBConfig');
const EnterpriseEmployeeUser = require("../models/users/enterpriseEmploye.model")
const { ObjectId } = require('mongodb');

const getUserByIdF = async (userId) => {
    const objectId = new ObjectId(userId);

    const user = await Promise.all([
                        IndividualUser.findOne({ _id: objectId }).lean(),
                        EnterpriseUser.findOne({ _id: objectId }).lean(),
                        EnterpriseEmployeeUser.findOne({ _id: objectId }, { username: 1 }).lean()
                    ]);
    return user;
}


const getUserByPhoneNo = async (req, res) => {
    const phoneNo = req.params.phoneNo;
    console.log("phoneNo : ", phoneNo); 
    try {
        
        const user = await Promise.all([
            IndividualUser.findOne({ phnNumber: phoneNo }).lean(),
            EnterpriseUser.findOne({ phnNumber: phoneNo }).lean(),
            EnterpriseEmployeeUser.findOne({ phnNumber: phoneNo }).lean()
        ]);
        // console.log("user : ", user);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}


const getUserById = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await getUserByIdF(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    getUserById,
    getUserByPhoneNo
};