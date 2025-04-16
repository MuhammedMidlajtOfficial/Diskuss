const Interaction = require('../models/tracker/interactionModel');

const detectInactiveUsers = async () => {
    const INACTIVITY_DAYS = 3; // Threshold for inactivity
    const thresholdDate = new Date(Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
  
    const inactivePairs = await Interaction.find({
      lastContactedAt: { $lt: thresholdDate },
      $or: [
        { lastNotifiedAt: { $exists: false } },
        { lastNotifiedAt: { $lt: thresholdDate } }
      ]
    });
  
    inactivePairs.forEach(async (pair) => {
      await sendNotification(pair.user1Id, pair.user2id);
      await Interaction.updateOne(
        { _id: pair._id },
        { $set: { lastNotifiedAt: new Date() } }
      );
    });
};

  
const sendNotification = async (user1Id, user2Id) => {
  const message = "You have not been contacted since a few days.";
  
  console.log("Sending notification to users:", user1Id, " and ", user2Id);
  // // Example notification logic
  // await NotificationService.send(user1Id, message);
  // await NotificationService.send(user2Id, message);
};


const cron = require('node-cron');

// Run every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily interaction check...');
  detectInactiveUsers();
});