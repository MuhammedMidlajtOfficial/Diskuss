const mongoose = require('mongoose');
const crypto = require('crypto');
const { individualUserCollection } = require('../models/individualUser'); // Adjust the path accordingly

const generateReferralCode = () => {
    return crypto.randomBytes(4).toString('hex').toUpperCase(); // Generate 8 character long referral code
};

const assignReferralCodesToExistingUsers = async () => {
    try {
        // Connect to your MongoDB database
        await mongoose.connect(process.env.MongoDBURL, { useNewUrlParser: true, useUnifiedTopology: true });

        // Find all users who do not have a referral code
        const usersWithoutReferralCode = await individualUserCollection.find({ referralCode: { $exists: false } });


        for (const user of usersWithoutReferralCode) {
            let referralCode = generateReferralCode();
            let isUnique = false;

            // Ensure the referral code is unique
            while (!isUnique) {
                const existingUser = await individualUserCollection.findOne({ referralCode });
                if (!existingUser) {
                    isUnique = true;
                } else {
                    referralCode = generateReferralCode(); // Generate a new code if it's not unique
                }
            }

            // Update user with the new referral code
            user.referralCode = referralCode;
            await user.save();
            console.log(`Assigned referral code ${referralCode} to user ${user.username}`);
        }

        console.log("All eligible users have been updated with referral codes.");
    } catch (error) {
        console.error("Error assigning referral codes:", error);
    } finally {
        mongoose.connection.close();
    }
};

// Run the function
assignReferralCodesToExistingUsers();