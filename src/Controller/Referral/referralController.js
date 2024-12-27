// controllers/referralController.js
const referralService = require('../../services/Referral/referral.service');

// Send Invite
const sendInvite = async (req, res) => {
    try {
        const { referrerId, inviteePhoneNo } = req.body;
        const referral = await referralService.sendInvite(referrerId, inviteePhoneNo);
        res.status(201).json({ message: "Invite sent", referral });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Register Invitee
const registerInvitee = async (req, res) => {
    try {
        const { referralId, inviteeId } = req.body;
        const updatedReferral = await referralService.registerInvitee(referralId, inviteeId);
        res.status(200).json({ message: "Invitee registered, coins awarded", updatedReferral });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create Card by Invitee
const createCardByInvitee = async (req, res) => {
    try {
        const { referralId } = req.body;
        const updatedReferral = await referralService.createCardByInvitee(referralId);
        res.status(200).json({ message: "Card created, coins awarded", updatedReferral });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get Referral Details
const getReferralDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const referralDetails = await referralService.getReferralDetails(userId);
        res.status(200).json(referralDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const checkReferralCode = async (req, res) => {
    try {
        const { referralCode } = req.params;
        const referral = await referralService.checkReferralCode(referralCode);
        res.status(200).json(referral);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllReferrals = async (req, res) => {
    page = parseInt(req.query.page) || 1;
    limit = parseInt(req.query.limit) || 10;
    try {
        const referrals = await referralService.findAllReferrals(page, limit);
        return res.status(200).json({ referrals });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

const getMonthlyReferralsCounts = async (req, res) => {
    const year = req.query.year || new Date().getFullYear();
    try {
        const referrals = await referralService.findMonthlyReferralsCounts(year);
        return res.status(200).json({ referrals });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

const createWithdrawal = async (req, res) => {
    try {
        // console.log("req.body : ", req.body)
        const { userId, amount } = req.body;
        // const withdrawal = await referralService.createWithdrawal(userId, amount);
        const withdrawalData = await referralService.tester(userId, amount);
        // console.log("withdrawal : ", withdrawalData)
        return res.status(201).json({ message: "Withdrawal request created", withdrawal });
    } catch (e) {
        // handle errors here
        if (e.message === "Insufficient coins for withdrawal") {
            return res.status(400).json({ error: e.message });
        } else if (e.message === "User not found") {
            return res.status(404).json({ error: e.message });
        } else if (e.message === "Invalid withdrawal amount") {
            return res.status(400).json({ error: e.message });
        }
            return res.status(500).json({ error: e.message });
    }
};


module.exports = {
    sendInvite,
    registerInvitee,
    createCardByInvitee,
    getReferralDetails,
    checkReferralCode,
    getAllReferrals,
    getMonthlyReferralsCounts,
    createWithdrawal

}

// // controllers/referralController.js
// const ReferralService = require('../../services/Referral/referral.service');
// const ActionService = require('../../services/Referral/action.service');

// /**
//  * Get all Referrals
//  * @param {Request} req
//  * @param {Response} res
//  * @returns {Promise<Response>}
//  */
// const getAllReferrals = async (req, res) => {
//     try {
//         const referrals = await ReferralService.findAllReferrals();
//         return res.status(200).json({ referrals });
//     } catch (e) {
//         return res.status(500).json({ error: e.message });
//     }
// };



// /**
//  * Get a Referral by ID
//  * @param {Request} req
//  * @param {Response} res
//  * @returns {Promise<Response>}
//  */
// const getReferralById = async (req, res) => {
//     try {
//         const { id } = req.params; // Extract id from request parameters
//         const referral = await ReferralService.getReferralById(id);

//         if (!referral) return res.status(404).json({ message: 'Referral not found' });

//         return res.status(200).json(referral);
//     } catch (e) {
//         return res.status(500).json({ error: e.message });
//     }
// };


// /**
//  * Get all Referrals made by a specific user
//  * @param {Request} req
//  * @param {Response} res
//  * @returns {Promise<Response>}
//  */
// const getReferralsByUserId = async (req, res) => {
//     try {
//         const { userId } = req.params; // Extract userId from request parameters
//         const referrals = await ReferralService.findReferralsByUserId(userId); // Call service method

//         if (!referrals || referrals.length === 0) {
//             return res.status(404).json({ message: 'No referrals found for this user' });
//         }

//         return res.status(200).json(referrals);
//     } catch (error) {
//         console.error("Error fetching referrals by user ID:", error);
//         return res.status(500).json({ error: error.message });
//     }
// };


// /**
//  * Create a new Referral
//  * @param {Request} req
//  * @param {Response} res
//  * @returns {Promise<Response>}
//  * @example
//  * {
//  *   "referrerId": "ObjectId",
//  *   "refereeId": "ObjectId",
//  *   "level": 1
//  * }
//  */
// const createReferral = async (req, res) => {
//     try {
//         const { referrerId, refereeId } = req.body;

//         // Check if required fields are provided
//         if (!referrerId || !refereeId  === undefined) {
//             return res.status(400).json({ message: "All fields are required." });
//         }

//         // Prepare data to pass to the service function
//         const referralData = { referrerId, refereeId };

//         // Call the service to create a referral
//         const newReferral = await ReferralService.createReferral(referralData);

//         // Prepare the service to create an action
//         const actionData = { referralId: newReferral._id, actionType: "pending" };

//         const newAction = await ActionService.createAction(actionData);

//         // Respond with success and the created referral
//         res.status(201).json({ message: "Referral created successfully", referral: newReferral });
//     } catch (e) {
//         return res.status(500).json({ error: e.message });
//     }
// };

// /**
//  * Update a Referral
//  * @param {Request} req
//  * @param {Response} res
//  * @returns {Promise<Response>}
//  * @example
//  * {
//  *   "level": 2
//  * }
//  */
// const updateReferral = async (req, res) => {
//     try {
//         const { id } = req.params; // Extract id from request parameters
//         const updateData = req.body; // Extract update data from request body

//         // Check if required fields are provided (if applicable)
//         if (!updateData || Object.keys(updateData).length === 0) {
//             return res.status(400).json({ message: "No data provided for update." });
//         }

//         // Call the service to update the referral
//         const updatedReferral = await ReferralService.updateReferral(id, updateData);

//         if (!updatedReferral) return res.status(404).json({ message: 'Referral not found' });

//         // Respond with success and the updated referral
//         res.status(200).json({
//             message: "Referral updated successfully",
//             updatedReferral,
//         });
//     } catch (error) {
//         console.error("Error updating Referral:", error);
//         return res.status(500).json({ error: error.message });
//     }
// };

// /**
//  * Delete a Referral
//  * @param {Request} req
//  * @param {Response} res
//  * @returns {Promise<Response>}
//  */
// const deleteReferral = async (req, res) => {
//     try {
//         const { id } = req.params; // Extract id from request parameters

//         // Call the service to delete the referral
//         const deletedReferral = await ReferralService.deleteReferral(id);

//         if (!deletedReferral) return res.status(404).json({ message: 'Referral not found' });

//         // Respond with success and the deleted information
//         res.status(200).json({
//             message: "Referral deleted successfully",
//             deletedReferral,
//         });
//     } catch (error) {
//         console.error("Error deleting Referral:", error);
//         return res.status(500).json({ error: error.message });
//     }
// };

// const getInvitedUsers = async (req, res) => {
//     try {
//         const { userId } = req.params; // Extract userId from request parameters
//         // const referrals = await ReferralService.findReferralsByUserId(userId) // Call service method
        
//         // Step 2: Extract referee IDs
//         // const referralIds = referrals.map(referral => referral._id);
//         // console.log(referralIds);
//         // // Step 3: Fetch actions for each referral
        
//         // const all = await referralIds.forEach(async (referralId) => {
//         //     const actions = await ActionService.findActionsByReferralId(referralId);
//         //     console.log("action : ", actions);
//         // });
//         // console.log("all :", all);

//         // const actions = await ActionService.findActionsByReferralId(referrals.map(r => r._id));

//         // const invitedUsers = referrals.map(referral => ({
//         //     ...referral,
//         //     actions: actions.filter(action => action.referralId === referral._id)
//         // }));

//         // const invitedUsers = await ReferralService.findInvitedUsers(userId);

//         const referrals = await ReferralService.findReferralsByUserId(userId)
//         console.log("referrals : ", referrals)
        
//         const referralIds = await referrals.map(ref => ref._id)

//         console.log("ref_ids : ", referralIds)

//         // const action = referralIds.map(async (refId)=> {
//         //     const action =  await ActionService.findActionsByReferralId(refId)
//         //     return action
//         // })

//                 // Fetch actions for each referral ID asynchronously
//         const actions = await Promise.all(referralIds.map(async (refId) => {
//             const action = await ActionService.findActionsByReferralId(refId);
//             return action;
//         }));

//         console.log("actions :", actions)

//         // if (!invitedUsers || invitedUsers.length === 0) {
//         //     return res.status(404).json({ message: 'No invited users found for this user' });
//         // }

//         return res.status(200).json(actions );
//     } catch (error) {
//         console.error("Error fetching invited users by user ID:", error);
//         return res.status(500).json({ error: error.message });
//     }
// }


// /*
// I want this: 
// {
// inviteduser : [
// {
//     'referralId': 123123,
//     '
// },{},{}]
// }
// */


// module.exports = {
//     getAllReferrals,
//     getReferralById,
//     getReferralsByUserId,
//     createReferral,
//     updateReferral,
//     deleteReferral,
//     getInvitedUsers
// };
