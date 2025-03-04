const mongoose = require("mongoose");
const UserSubscription = require("../models/subscription/userSubscription.model"); // Assuming models are exported from a file named 'models.js'
const { Referral } = require("../models/referral/referral.model")

const MongoDBURL = "mongodb+srv://knowconnection:knowconnection@knowconnection.6a76p.mongodb.net/knowConnection"

async function updateReferralIsSubscribed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MongoDBURL || MongoDBURL, { useNewUrlParser: true, useUnifiedTopology: true });

    console.log("Connected to MongoDB");

    let ctr = 0;
    // Fetch all referrals
    const referrals = await Referral.find();

    for (const referral of referrals) {
      // Check if the invitee has subscribed to any plan
      if (referral.invitee === ""){
        continue
      }
      const hasSubscribed = await UserSubscription.exists({
        userId: referral.invitee,
        status: { $in: ["active"]}, // Adjust statuses as needed
      });

      !!hasSubscribed ? ctr ++ : "";
      console.log("Updated ", ctr)
      // Update the isSubscribed field in the Referral document
      referral.isSubscribed = !!hasSubscribed;
      
      await referral.save();
    }

    console.log("Referral documents updated successfully");
  } catch (error) {
    console.error("Error updating referral documents:", error);
  } finally {
    mongoose.connection.close();
  }
}

async function checkReferralsIsSubscribed(inviteeIds) {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MongoDBURL || MongoDBURL, { useNewUrlParser: true, useUnifiedTopology: true });
  
      console.log("Connected to MongoDB");
  
      // Fetch referrals with invitee IDs from the provided list
      const referrals = await Referral.find({ invitee: { $in: inviteeIds } });
  
      // Log the results
      referrals.forEach((referral) => {
        console.log(
          `Invitee ID: ${referral.invitee}, isSubscribed: ${referral.isSubscribed}`
        );
      });
    } catch (error) {
      console.error("Error checking referral documents:", error);
    } finally {
      mongoose.connection.close();
    }
  }

// updateReferralIsSubscribed();
const subscribedUser = [
    "67c29bbb6eb02914b318fffd",
    "67c168d3f95afca2cf930854",
    "67c29cb16eb02914b3191a55",
    "67c29db66eb02914b3193733",
    "67c2c07371bdb1e166578c2e",
    "67c16423f95afca2cf91f7dd",
    "67c0317bc92f4cffcc4a416c",
    "67c18acba51b9a186db8596a",
    "67c164e3f95afca2cf922cf1",
    "67c184d5dca6e37883e774da",
    "67c298b66eb02914b318afa8",
    "67c2a31771bdb1e16653be9c",
    "67c180ee5394a2e6c0dcc1c3",
    "67c1684ef95afca2cf92ee69",
    "67c2bfd771bdb1e16657742f",
    "67c189cda51b9a186db832a3",
    "67c167a9f95afca2cf92db93",
    "67c14f55f95afca2cf900f98",
    "67c188c9a51b9a186db80c79",
    "67c182785394a2e6c0dd05f3",
    "67bd8ceded52c8f211ca7ab2"
  ]

checkReferralsIsSubscribed(subscribedUser);

  