const {Referral} = require('../../models/referral.model');
const individualUserCollection = require('../../models/individualUser')
const User = individualUserCollection.individualUserCollection;
// Send Invite
const sendInvite = async (referrerId, inviteePhoneNo) => {
    const referral = new Referral({
        referrer: referrerId,
        inviteePhoneNo,
        status: "Invited",
        rewardsEarned: 0
    });
    await referral.save();
    return referral;

};

// Register Invitee
const registerInvitee = async (referralId, inviteeId) => {
    const referral = await Referral.findById(referralId);
    if (!referral) throw new Error('Referral not found');
    if (referral.status !== 'Invited') throw new Error('Invitee already registered or card created');
    
    referral.invitee = inviteeId;
    referral.status = 'Registered';
    referral.rewardsEarned += 50; // Award 50 coins for registration
    await referral.save();

    // Update referrerId's coin balance
    await  (referral.referrer, { $inc: { coins: 50 } });
    
    return referral;
};

// Create Card by Invitee
const createCardByInvitee = async (referralId) => {
    const referral = await Referral.findById(referralId);
    if (!referral) throw new Error('Referral not found');
    if (referral.status !== 'Registered') throw new Error('Invitee must be registered before creating a card');
    
    referral.status = 'Card Created';
    referral.rewardsEarned += 50; // Award 50 coins for card creation
    await referral.save();

    // Update referrer's coin balance
    await User.findByIdAndUpdate(referral.referrer, { $inc: { coins: 50 } });
    
    return referral;
};

// Get Referral Details
const getReferralDetails = async (userId) => {
    const referrals = await Referral.find({ referrer: userId }).select('inviteeEmail status rewardsEarned createdAt');
    const user = await User.findById(userId);
    const coins = user.coins;
    
    return { coins, invitedUsers: referrals };
};

module.exports = {
    sendInvite,
    registerInvitee,
    createCardByInvitee,
    getReferralDetails
}

// const {Referral} = require('../../models/referral.model');

// /**
//  * Find all Referrals
//  * @returns {Promise<Referral[]>}
//  */
// const findAllReferrals = async () => {
//     try {
//         const referrals = await Referral.find().exec();
//         return referrals;
//     } catch (error) {
//         console.error("Error fetching referrals:", error);
//         throw error; // Re-throw the error for higher-level handling if needed
//     }
// };



// /**
//  * Get a Referral by ID
//  * @param {String} referralId - The unique identifier of the Referral to retrieve.
//  * @returns {Promise<Object>} - Returns the found Referral.
//  * @throws {Error} - Throws an error if the Referral is not found.
//  */
// const findReferralById = async (referralId) => {
//     try {
//         const referral = await Referral.findById(referralId).exec();
//         if (!referral) {
//             throw new Error("Referral not found");
//         }
//         return referral;
//     } catch (error) {
//         console.error("Error fetching referral by ID:", error);
//         throw error;
//     }
// };


// /**
//  * Find all Referrals made by a specific user
//  * @param {String} userId - The unique identifier of the user.
//  * @returns {Promise<Referral[]>}
//  */
// const   findReferralsByUserId = async (userId) => {
//     try {
//         return await Referral.find({ referrerId: userId }).exec(); // Assuming referrerId is the field that links to the User model
//     } catch (error) {
//         console.error("Error fetching referrals for user:", error);
//         throw error; // Re-throw the error for higher-level handling if needed
//     }
// };


// /**
//  * Create a new Referral
//  * @param {Object} referralData - The referral data.
//  * @param {String} referralData.referrerId - ID of the referrer.
//  * @param {String} referralData.refereeId - ID of the referred user.
//  * @param {Number} referralData.level - Level of the referral.
//  * @returns {Promise<Object>} - Returns the created Referral.
//  */
// const createReferral = async (referralData) => {
//     try {
//         const newReferral = new Referral(referralData);
//         const savedReferral = await newReferral.save();
//         return savedReferral;
//     } catch (error) {
//         console.error("Error creating referral:", error);
//         throw error;
//     }
// };

// /**
//  * Update a Referral by ID
//  * @param {String} referralId - The unique identifier of the Referral to update.
//  * @param {Object} updateData - The data to update the Referral.
//  * @returns {Promise<Object>} - Returns the updated Referral.
//  * @throws {Error} - Throws an error if the Referral is not found or if there's an issue with the update.
//  */
// const updateReferralById = async (referralId, updateData) => {
//     try {
//         const updatedReferral = await Referral.findByIdAndUpdate(referralId, updateData, { new: true }).exec();
//         if (!updatedReferral) {
//             throw new Error("Referral not found");
//         }
//         return updatedReferral;
//     } catch (error) {
//         console.error("Error updating referral:", error);
//         throw error;
//     }
// };

// /**
//  * Delete a Referral by ID
//  * @param {String} referralId - The unique identifier of the Referral to delete.
//  * @returns {Promise<Object>} - Returns the deleted Referral for confirmation.
//  * @throws {Error} - Throws an error if the Referral is not found or if there's an issue with the deletion.
//  */
// const deleteReferralById = async (referralId) => {
//     try {
//         const deletedReferral = await Referral.findByIdAndDelete(referralId).exec();
//         if (!deletedReferral) {
//             throw new Error("Referral not found");
//         }
//         return deletedReferral; // Return the deleted Referral for confirmation
//     } catch (error) {
//         console.error("Error deleting referral:", error);
//         throw error;
//     }
// };

// const findInvitedUsers = async (referrarId) => {
//     try {

//         // const invitedUsers = await Referral.aggregate([
//         //     { $match: { referrerId: referrarId } },
//         //     {
//         //         $lookup: {
//         //             from: 'actions',
//         //             localField: '_id',
//         //             foreignField: 'referralId',
//         //             as: 'actions'
//         //         }
//         //     },
//         //     {
//         //         $addFields: {
//         //             latestAction: { $arrayElemAt: ['$actions', -1] }
//         //         }
//         //     },
//         //     {
//         //         $project: {
//         //             referrerId: 1,
//         //             refereeId: 1,
//         //             latestActionType: '$latestAction.actionType',
//         //             latestActionDate: '$latestAction.actionDate'
//         //         }
//         //     }
//         // ]);

//         const invitedUsers = {}
//         console.log("invitedUsers : ", invitedUsers);
//         return invitedUsers;
//     } catch (error) {
//         console.error("Error fetching referrals for user:", error);
//         throw error; // Re-throw the error for higher-level handling if needed
//     }
// };


// module.exports = {
//     findAllReferrals,
//     findReferralById,
//     findReferralsByUserId,
//     createReferral,
//     updateReferralById,
//     deleteReferralById,
//     findInvitedUsers

// };