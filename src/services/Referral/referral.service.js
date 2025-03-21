const {Referral, WithdrawalRequest} = require('../../models/referral/referral.model');
const EnterpriseUser = require('../../models/users/enterpriseUser');
const { individualUserCollection: IndividualUser } = require('../../DBConfig');
const EnterpriseEmployeeUser = require("../../models/users/enterpriseEmploye.model")
const { ObjectAlreadyInActiveTierError } = require('@aws-sdk/client-s3');
const {convertToMonthlyCounts} = require('../../util/HelperFunctions');
const { ObjectId } = require('mongodb');
const { checkUserType } = require('../../util/HelperFunctions');
const Settings = require('../../models/settings/settingModel');
const configModel = require('../../models/config/config.model');
const UserSubscription = require('../../models/subscription/userSubscription.model');
const Notification = require("../../models/notification/NotificationModel")
const {emitNotification} = require("../../Controller/Socket.io/NotificationSocketIo");


const configId = "67988e04e60b8e8d6f248e07"


// Send Invite
const sendInvite = async (referrerId, inviteePhoneNo,referralCode ) => {

    // check if the invitee is already registered or card created
    let alreadyRegistered = await Referral.findOne({  
        inviteePhoneNo: inviteePhoneNo,
            $or: [
                { referralCode: referralCode },
                { referralId: referralCode } // Assuming you have a referralId field
            ]
    })
    console.log("alreadyRegistered : ", alreadyRegistered);

    if (alreadyRegistered) {
        throw new Error('Invitee already registered or card created');
    }

    const referral = new Referral({
        referrer: referrerId,
        inviteePhoneNo,
        referralCode,
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
    
    const settings = await Settings.findOne({});

    referral.invitee = inviteePhoneNo;
    referral.status = 'Registered';
    referral.registeredAt = new Date();
    referral.rewardsEarned += parseInt(settings.registrationReward); // Award 50 coins for registration
    await referral.save();

    const isSubscribed = await checkUserSubscription(inviteePhoneNo);
    if (isSubscribed) {
        referral.isSubscribed = true;
    }

    // Update invitee's coin balance
    const totalCoins = await Referral.aggregate([ 
        { $match: { referrer: referral.referrer } }, 
        { $group: { total: { $sum: '$rewardsEarned' } } } ]).lean().exec();

    const rewardedCoins = await Referral.aggregate([ 
    { $match: { referrer: referral.referrer, isSubscribed: true} }, 
    { $group: { total: { $sum: '$rewardsEarned' } } } ]).lean().exec();
    
    const pendingCoins = parseInt(totalCoins[0].total || 0) - parseInt(rewardedCoins[0].total || 0);

    
    const userType = await checkUserType(referral.referrer).userType;
    
    let coinsRewarded = 0;
    

    // Update referrerId's coin balance
    if (userType === 'individual') {
        await IndividualUser.findByIdAndUpdate(referral.referrer,  { coinsRewarded: totalCoins.total } );
    } else if (userType === 'enterprise') {
        await EnterpriseUser.findByIdAndUpdate(referral.referrer,  { coinsRewarded: totalCoins.total } );
    } else if (userType === 'enterpriseEmployee') {
        await EnterpriseEmployeeUser.findByIdAndUpdate(referral.referrer,  { coinsRewarded: totalCoins.total } );
    }

    return referral;
};

// Register Invitee by Referral Code
const registerInviteeByReferralCode = async (referralCode, inviteePhoneNo, inviteeId = "") => {
    // checking if the referral code is valid
    const [individualUser, enterpriseUser, enterpriseEmployeeUser] = await Promise.all(
        [
            await IndividualUser.findOne({ referralCode }).exec(),
            await EnterpriseUser.findOne({ referralCode }).exec(),
            await EnterpriseEmployeeUser.findOne({ referralCode }).exec()
        ]);

    // const individualUser = await IndividualUser.findOne({ referralCode }).exec();
    // const enterpriseUser = await EnterpriseUser.findOne({ referralCode }).exec();
    // const enterpriseEmployeeUser = await EnterpriseEmployeeUser.findOne({ referralCode }).exec();

    if (!individualUser && !enterpriseUser && !enterpriseEmployeeUser) {
        throw new Error('Invalid referral code');
    }
    const referrerId = individualUser ? individualUser._id : enterpriseUser ? enterpriseUser._id : enterpriseEmployeeUser._id;

    // check if the invitee is already registered or card created
    let alreadyRegistered = await Referral.findOne({  
        inviteePhoneNo,
        status : { $ne : "Invited" }
 }).exec();

    console.log("alreadyRegistered : ", alreadyRegistered);
    if (alreadyRegistered) {
        throw new Error('Invitee already registered or card created');
    }

    let newReferral = new Referral({
        inviteePhoneNo : inviteePhoneNo,
        invitee: inviteeId,
        status: "Invited",
        rewardsEarned: 0,
        referralCode: referralCode
    });
    
    referral = await Referral.findOne({ referrer: referrerId, inviteePhoneNo, status : "Invited"}).exec(); 

    if(!referral) {
        newReferral.referrer = individualUser ? individualUser._id : enterpriseUser ? enterpriseUser._id : enterpriseEmployeeUser._id;
        await newReferral.save();
    }
    else {
        newReferral = referral;
    }

    // const settings = await Settings.findOne({});
    const referalConfig = await configModel.findById(configId);
    // console.log("referalConfig : ", referalConfig);
    const settings = referalConfig.config;
    newReferral.status = 'Registered';
    newReferral.registeredAt = new Date();
    newReferral.rewardsEarned = parseInt(settings.RegistrationReward) ; // Award 50 coins for registration
    // console.log("registration reward : ", settings.RegistrationReward); 
    await newReferral.save();

    const notification = new Notification({
      receiver:referrerId,
      currency: 'INR',
      type: "referral",
      content: inviteePhoneNo +" has registered with your referral code",
      status: "unread",
    });
    await notification.save();

    // Emit notification
    emitNotification(referrerId, notification);

   

    const isSubscribed = await checkUserSubscription(newReferral.invitee);
    // console.log("isSubscribed : ", isSubscribed)
    if (isSubscribed) {
        newReferral.isSubscribed = true;
        await newReferral.save();
    }

    // Update invitee's coin balance
    await updateCoinsBalance(newReferral.referrer);



    // // Update invitee's coin balance
    // let totalCoins = await Referral.aggregate([
    //     { $match: { referrer: newReferral.referrer } },
    //     { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]).exec();
    
    // let rewardedCoins = await Referral.aggregate([
    //     { $match: { referrer: newReferral.referrer, isSubscribed: true } },
    //     { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]).exec();
    
    //     // console.log("total coin : ", totalCoins[0].total);
    //     // console.log("totalCoins : ", totalCoins);
    //     // console.log("rewardedCoins : ", rewardedCoins);
    //     totalCoins = totalCoins[0].total;
    //     rewardedCoins = !rewardedCoins ? rewardedCoins[0].total : 0;
    //     // console.log("totalCoins : ", totalCoins);
    //     // console.log("rewardedCoins : ", rewardedCoins);

    // const coinsPending = parseInt(totalCoins) - parseInt(rewardedCoins);
    // const withDrawn = await WithdrawalRequest.aggregate([
    //     {
    //         $match: {
    //             userId: newReferral.referrer,
    //             status: "approved",
    //         },
    //     },
    //     {
    //         $group: {
    //             _id: null,
    //             coinsRedeemed: { $sum: '$amount' },
    //         },
    //     },
    //     {
    //         $project: {
    //             _id: 0,
    //             total: '$coinsRedeemed',
    //         },
    //     },
    // ]).exec();

    // // console.log("withDrawn : ", withDrawn);

    // if (withDrawn.length === 0) {
    //     withDrawn.push({ total: 0 });
    // }
    // const coinsBalance = parseInt(rewardedCoins) - parseInt(withDrawn[0].total);

    // console.log("coinsBalance : ", coinsBalance, " coinsPending : ", coinsPending, " coinsRewarded : ", rewardedCoins);

    // const userType = (await checkUserType(newReferral.referrer)).userType;
    // // Update referrerId's coin balance
    // if (userType === 'individual') {
    //     await IndividualUser.findByIdAndUpdate(newReferral.referrer,  { coinsRewarded: rewardedCoins, coinsPending, coinsBalance } );
    // } else if (userType === 'enterprise') {
    //     await EnterpriseUser.findByIdAndUpdate(newReferral.referrer,  { coinsRewarded: rewardedCoins, coinsPending, coinsBalance } );
    // } else if (userType === 'enterpriseEmployee') {
    //     await EnterpriseEmployeeUser.findByIdAndUpdate(newReferral.referrer,  { coinsRewarded: rewardedCoins, coinsPending, coinsBalance } );
    // }
    return newReferral;
};

// Create Card by Referral Code and Invitee
const createCardByReferralCode = async (referralCode, inviteePhoneNo) => {
    // checking if the referral code is valid
    const individualUser = await IndividualUser.findOne({ referralCode }).exec();
    const enterpriseUser = await EnterpriseUser.findOne({ referralCode }).exec();
    const enterpriseEmployeeUser = await EnterpriseEmployeeUser.findOne({ referralCode }).exec();

    if (!individualUser && !enterpriseUser && !enterpriseEmployeeUser) {
        throw new Error('Invalid referral code');
    }
    const referrerId = individualUser ? individualUser._id : enterpriseUser ? enterpriseUser._id : enterpriseEmployeeUser._id;

    // check if the invitee is already registered or card created
    let cardCreated = await Referral.findOne({  
        inviteePhoneNo,
        status  : "Card Created"
 }).exec();

    // console.log("cardCreated : ", cardCreated);
    if (cardCreated) {
        throw new Error('Invitee already created card once');
    }

    let newReferral = await Referral.findOne({ referrer: referrerId, inviteePhoneNo}).exec(); 

    if(!newReferral) {
        return new Error('Invitee not registered');
    }

    // const settings = await Settings.findOne({});
    const referalConfig = await configModel.findById(configId);
    // console.log("referalConfig : ", referalConfig);
    const settings = referalConfig.config;
    newReferral.status = 'Card Created';
    newReferral.registeredAt = new Date();
    newReferral.rewardsEarned += parseInt(settings.CardCreationReward); // Award 50 coins for registration
    // console.log("new referral : ", newReferral);
    await newReferral.save();

    const notification = new Notification({
        receiver:referrerId,
        currency: 'INR',
        type: "referral",
        content: inviteePhoneNo +" has Created First Card.",
        status: "unread",
      });
      await notification.save();
  
      // Emit notification
      emitNotification(referrerId, notification);

    const isSubscribed = await checkUserSubscription(newReferral.invitee);
    // console.log("new Referral", newReferral)
    // console.log("is Subscribed ", isSubscribed)
    if (isSubscribed) {
        newReferral.isSubscribed = true;
        await newReferral.save();
    }

    await updateCoinsBalance(newReferral.referrer);

    // // Update invitee's coin balance
    // let totalCoins = await Referral.aggregate([
    //     { $match: { referrer: newReferral.referrer } },
    //     { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]).exec();
    // let rewardedCoins = await Referral.aggregate([
    //     { $match: { referrer: newReferral.referrer, isSubscribed: true } },
    //     { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]).exec();
        
    //     totalCoins = totalCoins[0].total;
    //     rewardedCoins = !rewardedCoins ? rewardedCoins[0].total : 0;
    //     const coinsPending = parseInt(totalCoins) - parseInt(rewardedCoins);
        
    //     const withDrawn = await WithdrawalRequest.aggregate([
    //         {
    //             $match: {
    //                 userId: newReferral.referrer,
    //                 status: "approved",
    //             },
    //         },
    //         {
    //             $group: {
    //                 _id: null,
    //                 coinsRedeemed: { $sum: '$amount' },
    //             },
    //         },
    //         {
    //             $project: {
    //                 _id: 0,
    //                 total: '$coinsRedeemed',
    //             },
    //         },
    //     ]).exec();
    
    //     // console.log("withDrawn : ", withDrawn);
    
    //     if (withDrawn.length === 0) {
    //         withDrawn.push({ total: 0 });
    //     }
    //     const coinsBalance = parseInt(rewardedCoins) - parseInt(withDrawn[0].total);
    

    // const userType = (await checkUserType(newReferral.referrer)).userType;
    // // Update referrerId's coin balance
    // if (userType === 'individual') {
    //     await IndividualUser.findByIdAndUpdate(newReferral.referrer,  { coinsRewarded: totalCoins[0].total, coinsPending, coinsBalance } );
    // } else if (userType === 'enterprise') {
    //     await EnterpriseUser.findByIdAndUpdate(newReferral.referrer,  { coinsRewarded: totalCoins[0].total, coinsPending, coinsBalance } );
    // } else if (userType === 'enterpriseEmployee') {
    //     await EnterpriseEmployeeUser.findByIdAndUpdate(newReferral.referrer,  { coinsRewarded: totalCoins[0].total, coinsPending, coinsBalance } );
    // }
    return newReferral;
};

// Create Card by Invitee
const createCardByInvitee = async (referralId) => {
    const referral = await Referral.findById(referralId);
    if (!referral) throw new Error('Referral not found');
    if (referral.status !== 'Registered') throw new Error('Invitee must be registered before creating a card');
    
    const settings = await Settings.findOne({});

    referral.status = 'Card Created';
    referral.cardCreatedAt = new Date();
    referral.rewardsEarned += parseInt(settings.cardCreationReward); // Award 50 coins for card creation
    // await referral.save();

    // Update invitee's coin balance
    const totalCoins = await Referral.aggregate([ 
        { $match: { referrer: referral.referrer } }, 
        { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]).lean().exec();
    
    const userType = await checkUserType(referral.referrer).userType;
    // Update referrerId's coin balance
    if (userType === 'individual') {
        await IndividualUser.findByIdAndUpdate(referral.referrer,  { coinsRewarded: totalCoins.total } );
    } else if (userType === 'enterprise') {
        await EnterpriseUser.findByIdAndUpdate(referral.referrer,  { coinsRewarded: totalCoins.total } );
    } else if (userType === 'enterpriseEmployee') {
        await EnterpriseEmployeeUser.findByIdAndUpdate(referral.referrer,  { coinsRewarded: totalCoins.total } );
    }
    
    return referral;
};

// Get Referral Details
const getReferralDetails = async (userId) => {
    const referrals = await Referral.find({ referrer: userId,  }).populate('referrer', 'username image').exec();
    const totalReferrals = referrals.length;
    const cardCreated = referrals.filter(referral => referral.status === 'Card Created').length;
    const registered = referrals.filter(referral => referral.status === 'Registered').length;
    const invited = referrals.filter(referral => referral.status === 'Invited').length;
    const referalConfig = await configModel.findById(configId);
    if (!referalConfig) {
        throw new Error("Referral configuration not found");
    }
    const settings = referalConfig.config;
    // Update invitee's coin balance
    // const totalCoinsData = await Referral.aggregate([ 
    //     { $match: { referrer : userId} }, 
    //     { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]);

    // console.log("totalCoins : ", totalCoinsData);

    // Update referrerId's coin balance
    // await User.findByIdAndUpdate( userId,  { coins:  } );

    // const userData = await User.findById(userId).select('coins referralCode').lean().exec();
    // const coins = userData ? userData.coins : 0; // Default to 0 if no user found
    // console.log("coins : ", coins);
    const userType = (await checkUserType(userId)).userType;
    let userData = {};
    switch (userType) {
        case 'individual':
            userData = await IndividualUser.findById(userId).select('referralCode coinsWithdrawn coinsRewarded coinsBalance').lean().exec();
            break;
        case 'enterprise':
            userData = await EnterpriseUser.findById(userId).select('referralCode coinsWithdrawn coinsRewarded coinsBalance').lean().exec();
            break;
        case 'enterpriseEmployee':
            userData = await EnterpriseEmployeeUser.findById(userId).select('referralCode coinsWithdrawn coinsRewarded coinsBalance').lean().exec();
            break;
        default:
            throw new Error("Unsupported user type");
    }
    if (!userData) {
        throw new Error("User data not found");
    }
    const referralCode = userData ? userData.referralCode : ''; // Default to empty string if no user found

    const [totalCoins, coinsWithdrawn, coinsRewarded] = await Promise.all([
        countTotalCoins(userId),
        countTotalCoinsWithdrawn(userId),
        countTotalCoinsRewarded(userId)
    ]);

    // console.log("coinswithdrawan: ", coinsWithdrawn)
    // console.log("coinsRewarded: ", coinsRewarded)
    const remainingCoins = parseInt(coinsRewarded) - parseInt(coinsWithdrawn); // Default to 0 if no user found
    const pendingCoins = parseInt(totalCoins) - parseInt(coinsRewarded);

     // Update user data
     switch (userType) {
        case 'individual':
            await IndividualUser.findByIdAndUpdate(userId, { coinsPending: pendingCoins, coinsBalance: remainingCoins, coinsRewarded, coinsWithdrawn });
            break;
        case 'enterprise':
            await EnterpriseUser.findByIdAndUpdate(userId, { coinsPending: pendingCoins, coinsBalance: remainingCoins, coinsRewarded, coinsWithdrawn });
            break;
        case 'enterpriseEmployee':
            await EnterpriseEmployeeUser.findByIdAndUpdate(userId, { coinsPending: pendingCoins, coinsBalance: remainingCoins, coinsRewarded, coinsWithdrawn });
            break;
    }

    // userData.coinsRewarded = coinsRewarded;
    // userData.coinsPending = pendingCoins;
    // userData.coinsBalance = remainingCoins;
    // userData.coinsWithdrawn = coinsWithdrawn;
    // await userData.save();

    // const updated  = await updateCoinsBalance(userId);
    // console.log("updated : ", updated);
    // const totalCoins = userData ? userData.coinsRewarded : 0; // Default to 0 if no user found
    // const coinsWithdrawn = userData ? userData.coinsWithdrawn : 0; // Default to 0 if no user found
    // const remainingCoins = totalCoins - coinsWithdrawn; // Default to 0 if no user found
    // // const coinsWithdrawn = userData ? userData.coinsWithdrawn : 0; // Default to 0 if no user found
    // const totalCoins = totalCoinsData[0].total; // Default to 0 if no user found
    // const remainingCoins = totalCoins - coinsWithdrawn; // Default to 0 if no user found
    // console.log("referralCode : ", referralCode);
    // console.log("coinsWithdrawn : ", coinsWithdrawn);
    // console.log("totalCoinsData : ", totalCoins);
    // console.log("remainingCoins : ", remainingCoins);
    // console.log("total coins : ", totalCoins);
    // const coinsRewarded = userData ? userData.coinsRewarded : 0; // Default to 0 if no user found
    let nextReward = settings.LevelOneReward;
    if (coinsRewarded > settings.LevelOneReward && coinsRewarded < settings.LevelTwoReward) {
        nextReward = settings.LevelTwoReward;
    } else if (coinsRewarded > settings.LevelTwoReward && coinsRewarded < settings.LevelThreeReward) {
        nextReward = settings.LevelThreeReward;
    }


    const userReferralRequired = parseInt((settings.LevelOneReward)/(parseInt(settings.RegistrationReward) + parseInt(settings.CardCreationReward)));
    // console.log("userReferralRequired : ", userReferralRequired);

 

    const response = {
        totalReferrals,
        cardCreated,
        registered,
        invited,
        referralCode,
        userReferralRequired,
        nextReward,
        minimumWithdrawalAmount: settings.MinimumWithdrawalAmount,
        registrationReward: settings.RegistrationReward,
        cardCreationReward: settings.CardCreationReward,
        coinsRewarded : coinsRewarded,
        coinsPending : pendingCoins,
        coinsBalance : remainingCoins,
        coinsWithdrawn : coinsWithdrawn,
        invitedUsers: referrals
    }
    return response;
};

const checkReferralCode = async (referralCode) => {
    const individualUser = await IndividualUser.findOne({ referralCode }).exec();
    const enterpriseUser = await EnterpriseUser.findOne({ referralCode }).exec();
    const enterpriseEmployeeUser = await EnterpriseEmployeeUser.findOne({ referralCode }).exec();
    if (!individualUser && !enterpriseUser && !enterpriseEmployeeUser) {
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

const findMonthlyReferralsCounts = async (year) => {
    try {
        // console.log("year : ", year);
        const monthlyReferrals = await Referral.aggregate([
            // Step 1: Match documents for the specified year
            {
                $match: {
                    registeredAt: {
                        $gte: new Date(`${year}-01-01`),
                        $lt: new Date(`${parseInt(year) + 1}-01-01`)
                        // $gte: new Date(`2023-01-01`),
                        // $lt: new Date(`2024-01-01`)
                    }
                }
            },
            // Step 2: Group by year and month
            {
                $group: {
                    _id: {
                        year: { $year: "$registeredAt" },
                        month: { $month: "$registeredAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            // Step 3: Project the results
            {
                $project: {
                    _id: 0,
                    year: "$_id.year",
                    month: "$_id.month",
                    count: "$count"
                }
            },
        ]);

        // console.log("monthlyReferrals : ", monthlyReferrals);
        // Convert the data to an array of 12 months
        const monthlyCounts = convertToMonthlyCounts( year, monthlyReferrals);

        return monthlyCounts;
    } catch (error) {
        console.error("Error fetching monthly referrals:", error);
        throw error; // Re-throw the error for higher-level handling if needed
    }
};

const validateWithdrawal = async (userId, amount, upiId) => {
    // console.log("userId : ", userId);
    const userType = (await checkUserType(userId)).userType;
    const settings = await Settings.findOne({});
    if (amount < settings.minWithdrawalAmount) {
        throw new Error('Minimum withdrawal amount is ' + settings.minWithdrawalAmount);
    }
    // let userData = {};
    // if (userType === 'individual') {
    //     userData = await IndividualUser.findById(userId).select('coins coinsWithdrawn').lean().exec();
    // } else {
    //     userData = await EnterpriseUser.findById(userId).select('coins coinsWithdrawn').lean().exec();
    // }
    // const totalCoins = userData ? userData.coins : 0; // Default to 0 if no user found
    // const coinsWithdrawn = userData ? userData.coinsWithdrawn : 0; // Default to 0 if no user found
    // const remainingCoins = totalCoins - coinsWithdrawn; // Default to 0 if no user found
    const [ coinsWithdrawn, coinsRewarded] = await Promise.all([
        countTotalCoinsWithdrawn(userId),
        countTotalCoinsRewarded(userId)
    ]);

    const remainingCoins = parseInt(coinsRewarded) - parseInt(coinsWithdrawn); // Default to 0 if no user found
    
    if (amount > remainingCoins) {
        throw new Error('Insufficient coins for withdrawal');
    }
    if (amount <= 0) {
        throw new Error('Invalid withdrawal amount');
    }
    // if (userType === 'individual') {
    //     await IndividualUser.findByIdAndUpdate(userId, { coinsWithdrawn: coinsWithdrawn + amount });
    // } else {
    //     await EnterpriseUser.findByIdAndUpdate(userId, { coinsWithdrawn: coinsWithdrawn + amount });
    // }
    return { coinsWithdrawn: coinsWithdrawn + amount };
};


const updateWithdrawalRequest = async (id, status, transactionId) => {
    const withdrawalRequest = await WithdrawalRequest.findById(id);
    if (!withdrawalRequest) throw new Error('Withdrawal request not found');
    if (withdrawalRequest.status === status ) throw new Error('Same status');
    if (status === 'approved') {
        const userType = (await checkUserType(withdrawalRequest.userId)).userType;
        if (userType === 'individual') {
            // console.log("in indi" , withdrawalRequest.userId)
            // const up = await IndividualUser.findById(withdrawalRequest.userId);
            const withDrawn = await WithdrawalRequest.aggregate([
                { 
                    $match: { userId: withdrawalRequest.userId, status : "pending" } },
                    // $match: { userId: withdrawalRequest.userId } },
                { 
                    $group: { _id: null, coinsRedeemed: { $sum: '$amount' } },
                },
                {
                    $project: {
                        _id: 0,
                        total: "$coinsRedeemed"
                    }
                }
            ]).exec();

            // console.log("withDrawn : ", withDrawn);
            // console.log("withDrawn[0].total : ", withDrawn[0].total);

            const user = await IndividualUser.findById(withdrawalRequest.userId);
        if (!user) {
            throw new Error("User not found.");
        }

        const newCoinsBalance = (user.coinsRewarded || 0) - withDrawn[0].total;

            const up = await IndividualUser.findOneAndUpdate(
                { _id: new ObjectId(withdrawalRequest.userId) },
                {
                    $set: {
                 coinsWithdrawn: withDrawn[0].total,
                 coinsBalance: newCoinsBalance }
                },
                {
                    new: true,
                }
            );
            
            withdrawalRequest.status = 'approved';
            withdrawalRequest.transactionId = transactionId;
            await withdrawalRequest.save();
            // console.log("withdrawalRequest : ", withdrawalRequest   );

        } else if (userType === 'enterprise') {
            await EnterpriseUser.findByIdAndUpdate(withdrawalRequest.userId, { $inc: { coinsWithdrawn:  withdrawalRequest.amount, coinsBalance: -(withdrawalRequest.amount) } });
            withdrawalRequest.status = 'approved';
            withdrawalRequest.transactionId = transactionId;
            await withdrawalRequest.save();
        } else if (userType === 'enterpriseEmployee') {
            await EnterpriseEmployeeUser.findByIdAndUpdate(withdrawalRequest.userId, { $inc: { coinsWithdrawn:  withdrawalRequest.amount, coinsBalance : -(withdrawalRequest.amount) } });
            withdrawalRequest.status = 'approved';
            withdrawalRequest.transactionId = transactionId;
            await withdrawalRequest.save();
        }

    } else if (status === 'rejected') {
        withdrawalRequest.status = 'rejected';
        await withdrawalRequest.save();
    } else {
        throw new Error('Invalid status');
    }
    return withdrawalRequest;
};

// Helper Functions
// Function to get the rewards earned by a user
function getRewardsEarned(userId) {
    // Implement logic to calculate rewards earned by the user
    const rewards = Referral.find({ referrer: userId }).select('rewardsEarned').exec();
    return rewards;
}   


// check user has subscribed to a plan or not
const checkUserSubscription = async (userId) => {
    if (!userId) {
        return false;
    }
    const userSubscription = await UserSubscription.find({ 
        userId: userId,
        $or: [
            { status : "active" },
            { status : "inactive" }]
        }).exec();
    // console.log("userSubscription : ", userSubscription);
    if (userSubscription.length === 0) {
        return false;
    }
    return true;
};
// check user has subscribed to a plan or not
const checkUserSubscriptionByPhoneNo = async (inviteePhoneNo) => {
    const userSubscription = await UserSubscription.findOne({ 
        inviteePhoneNo: inviteePhoneNo,
        $or: [
            { status : "active" },
            { status : "inactive" }]
        }).exec();
    console.log("userSubscription : ", userSubscription);
    if (!userSubscription) {
        return false;
    }
    return true;
};

// Total coins pending and unlocked and withrdrawn
const countTotalCoins = async (userId) => {
    let totalCoins = await Referral.aggregate([
        { $match: { referrer: userId } },
        { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]).exec();

    if (totalCoins.length === 0) {
       return 0;
    }
    return totalCoins[0].total;
}

// Total unlocked and withdrawn coins
const countTotalCoinsRewarded = async (userId) => {
    let rewardedCoins = await Referral.aggregate([
        { $match: { referrer: userId, isSubscribed: true } },
        { $group: { _id: null, total: { $sum: '$rewardsEarned' } } } ]).exec();

    if (rewardedCoins.length === 0) {
        return 0;
    }
    // console.log("rewardedCoins : ", rewardedCoins);
    return rewardedCoins[0].total;
}

// total coins pending
const countTotalCoinsPending = async (userId) => {
    const [totalCoins, rewardedCoins] = await Promise.all([
        countTotalCoins(userId),
        countTotalCoinsRewarded(userId)
    ]);
    const coinsPending = parseInt(totalCoins) - parseInt(rewardedCoins);
    return coinsPending;
}

// total coins withdrawn
const countTotalCoinsWithdrawn = async (userId) => {
    const withDrawn = await WithdrawalRequest.aggregate([
            { $match: { userId: userId, status: "approved" },},
            { $group: { _id: null, total: { $sum: '$amount' } },},
        ]
    ).exec();
    if (withDrawn.length === 0) {
        return 0;
    }
    // console.log("withDrawn : ", withDrawn);
    return withDrawn[0].total;
};

const countTotalCoinsBalance = async (userId) => {
    const [totalCoinsRewarded, coinsWithdrawn] = await Promise.all([
        countTotalCoinsRewarded(userId),
        countTotalCoinsWithdrawn(userId)
    ]);
    const coinsBalance = parseInt(totalCoinsRewarded) - parseInt(coinsWithdrawn);
    return coinsBalance;
}

const updateCoinsBalance = async (userId) => {
    try {
    const [coinsPending, coinsBalance, coinsWithdrawn, coinsRewarded, userType] = await Promise.all([
        countTotalCoinsPending(userId),
        countTotalCoinsBalance(userId),
        countTotalCoinsWithdrawn(userId),
        countTotalCoinsRewarded(userId),
        checkUserType(userId)
    ]);

    // console.log(coinsPending, coinsBalance, coinsWithdrawn, coinsRewarded, userType.userType)
    // const coinsPending = await countTotalCoinsPending(userId);
    // const coinsBalance = await countTotalCoinsBalance(userId);
    // const coinsWithdrawn = await countTotalCoinsWithdrawn(userId);
    // const coinsRewarded = await countTotalCoinsRewarded(userId);
    // const userType = (await checkUserType(userId)).userType;
    // Update referrerId's coin balance
    if (userType.userType === 'individual') {
        console.log("1");
        await IndividualUser.findByIdAndUpdate(userId,  { coinsPending, coinsRewarded, coinsWithdrawn, coinsBalance } );
    } else if (userType.userType === 'enterprise') {
        console.log("2");
        await EnterpriseUser.findByIdAndUpdate(userId,  { coinsPending, coinsRewarded, coinsWithdrawn, coinsBalance } );
    } else if (userType.userType === 'enterpriseEmployee') {
        console.log("3");
        await EnterpriseEmployeeUser.findByIdAndUpdate(userId,  { coinsPending, coinsRewarded, coinsWithdrawn, coinsBalance } );
    }
    // console.log("Updated coins balance");
    return  ;
} catch (error) {
    console.error("Error updating coins balance:", error);
    throw error;
}
};

module.exports = {
    sendInvite,
    registerInvitee,
    createCardByInvitee,
    getReferralDetails,
    checkReferralCode,
    registerInviteeByReferralCode,
    findAllReferrals,
    findMonthlyReferralsCounts,
    validateWithdrawal,
    updateWithdrawalRequest,
    createCardByReferralCode,

    checkUserSubscription,
    checkUserSubscriptionByPhoneNo
}

// const {Referral} = require('../../models/referral/referral.model');

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
