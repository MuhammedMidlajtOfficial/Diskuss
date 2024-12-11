const {Referral} = require('../../models/referral.model');
const EnterpriseUser = require('../../models/enterpriseUser');
const { ObjectAlreadyInActiveTierError } = require('@aws-sdk/client-s3');
const { ObjectId } = require('mongodb');
const { individualUserCollection: IndividualUser } = require('../../DBConfig');
const checkUserType = async (userId) => {
    const individualUser = await IndividualUser.findById(userId).exec();
    const enterpriseUser = await EnterpriseUser.findById(userId).exec();
    if (!individualUser && !enterpriseUser) {
        throw new Error('Invalid user');
    }
    return individualUser ? 'individual' : 'enterprise';
}

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
const registerInvitee = async (referralId, inviteePhoneNo) => {
    const referral = await Referral.findById(referralId);
    if (!referral) throw new Error('Referral not found');
    if (referral.status !== 'Invited') throw new Error('Invitee already registered or card created');
    
    referral.invitee = inviteePhoneNo;
    referral.status = 'Registered';
    referral.registeredAt = new Date();
    referral.rewardsEarned += 50; // Award 50 coins for registration
    await referral.save();

    // Update invitee's coin balance
    const totalCoins = await Referral.aggregate([ 
        { $match: { referrer: referral.referrer } }, 
        { $group: { total: { $sum: '$rewardsEarned' } } } ]).lean().exec();
    
    const userType = await checkUserType(referral.referrer);
    // Update referrerId's coin balance
    if (userType === 'individual') {
        await IndividualUser.findByIdAndUpdate(referral.referrer,  { coins: totalCoins.total } );
    } else {
        await EnterpriseUser.findByIdAndUpdate(referral.referrer,  { coins: totalCoins.total } );
    }    
    return referral;
};

// Register Invitee by Referral Code
const registerInviteeByReferralCode = async (referralCode, inviteePhoneNo) => {
    const individualUser = await IndividualUser.findOne({ referralCode }).exec();
    const enterpriseUser = await EnterpriseUser.findOne({ referralCode }).exec();

    let referral = null;

    if (!individualUser && !enterpriseUser) {
        throw new Error('Invalid referral code');
    }
    else if (individualUser) {
        referral = await Referral.findOne({ referrer: individualUser._id, inviteePhoneNo, status: 'Invited' }).exec(); 
        if (!referral) {
            const newReferral = new Referral({
                referrer: individualUser._id,
                inviteePhoneNo,
                status: "Invited",
                rewardsEarned: 0,
            });
            await newReferral.save();
            referral = newReferral;
        };   
    }
    else if (enterpriseUser) {
        referral = await Referral.findOne({ referrer: enterpriseUser._id, inviteePhoneNo,status: 'Invited' }).exec();
        if (!referral) {
            const newReferral = new Referral({
                referrer: enterpriseUser._id,
                inviteePhoneNo,
                status: "Invited",
                rewardsEarned: 0,
            });
            await newReferral.save();
            referral = newReferral; 
        };   
    }
    if (!referral) throw new Error('Referral not found');
    if (referral.status !== 'Invited') throw new Error('Invitee already registered or card created');

    referral.invitee = inviteePhoneNo;
    referral.status = 'Registered';
    referral.rewardsEarned += 50; // Award 50 coins for registration
    referral.registeredAt = new Date();
    await referral.save();

    // Update invitee's coin balance
    const totalCoins = await Referral.aggregate([ 
        { $match: { referrer: referral.referrer } }, 
        { $group: { _id : null ,total: { $sum: '$rewardsEarned' } } } ]).exec();
    
    const userType = await checkUserType(referral.referrer);
    // Update referrerId's coin balance
    if (userType === 'individual') {
        await IndividualUser.findByIdAndUpdate(referral.referrer,  { coins: totalCoins.total } );
    } else {
        await EnterpriseUser.findByIdAndUpdate(referral.referrer,  { coins: totalCoins.total } );
    }    
    return referral;
}   

// Create Card by Invitee
const createCardByInvitee = async (referralId) => {
    const referral = await Referral.findById(referralId);
    if (!referral) throw new Error('Referral not found');
    if (referral.status !== 'Registered') throw new Error('Invitee must be registered before creating a card');
    
    referral.status = 'Card Created';
    referral.cardCreatedAt = new Date();
    referral.rewardsEarned += 50; // Award 50 coins for card creation
    await referral.save();

    // Update invitee's coin balance
    const totalCoins = await Referral.aggregate([ 
        { $match: { referrer: referral.referrer } }, 
        { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]).lean().exec();
    
    const userType = await checkUserType(referral.referrer);
    // Update referrerId's coin balance
    if (userType === 'individual') {
        await IndividualUser.findByIdAndUpdate(referral.referrer,  { coins: totalCoins.total } );
    } else {
        await EnterpriseUser.findByIdAndUpdate(referral.referrer,  { coins: totalCoins.total } );
    }    
    
    return referral;
};

// Get Referral Details
const getReferralDetails = async (userId) => {
    const referrals = await Referral.find({ referrer: userId }).populate('referrer', 'username image').exec();
    const totalReferrals = referrals.length;
    const cardCreated = referrals.filter(referral => referral.status === 'Card Created').length;
    const registered = referrals.filter(referral => referral.status === 'Registered').length;
    const invited = referrals.filter(referral => referral.status === 'Invited').length;

    // Update invitee's coin balance
    const totalCoinsData = await Referral.aggregate([ 
        { $match: { referrer : new  ObjectId("6731e31c1637d690957d8e69")} }, 
        { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]);
    
    // console.log("totalCoins : ", totalCoinsData);

    // Update referrerId's coin balance
    // await User.findByIdAndUpdate( userId,  { coins:  } );

    // const userData = await User.findById(userId).select('coins referralCode').lean().exec();
    // const coins = userData ? userData.coins : 0; // Default to 0 if no user found
    // console.log("coins : ", coins);
    const userType = await checkUserType(userId);
    let userData = {};
    if (userType === 'individual') {
        userData = await IndividualUser.findById(userId).select('referralCode').lean().exec();
    } else {
        userData = await EnterpriseUser.findById(userId).select('referralCode').lean().exec();
    }
    const referralCode = userData ? userData.referralCode : ''; // Default to empty string if no user found
    console.log("referralCode : ", referralCode);
    

    const response = {
        totalReferrals,
        cardCreated,
        registered,
        invited,
        referralCode,
        totalCoins : totalCoinsData[0].total,
        invitedUsers: referrals
    }
    return response;
};

const checkReferralCode = async (referralCode) => {
    const individualUser = await IndividualUser.findOne({ referralCode }).exec();
    const enterpriseUser = await EnterpriseUser.findOne({ referralCode }).exec();
    if (!individualUser && !enterpriseUser) {
        return { valid: false };
    }
    return { valid: true };
};

const findAllReferrals = async (page, limit) => {
    try {
        const referrals = await Referral.find()
        .populate('referrer', 'username email image')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec();

        const totalReferrals = await Referral.countDocuments().exec();
        const totalPages = Math.ceil(totalReferrals / limit);
        const response = {
            page,
            limit,
            totalPages,
            totalReferrals,
            referrals
        };

        return response;
    } catch (error) {
        console.error("Error fetching referrals:", error);
        throw error; // Re-throw the error for higher-level handling if needed
    }
};

module.exports = {
    sendInvite,
    registerInvitee,
    createCardByInvitee,
    getReferralDetails,
    checkReferralCode,
    registerInviteeByReferralCode,
    findAllReferrals

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
