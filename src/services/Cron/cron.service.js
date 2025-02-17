const cron = require('node-cron');
const axios = require('axios');
const MeetingBase = require("../../models/meeting/EnterpriseMeetingModel");
const Notification = require("../../models/notification/NotificationModel");
const {
  emitNotification,
} = require("../../Controller/Socket.io/NotificationSocketIo");
const moment = require("moment");

// SUBSCRIPTION CRON
cron.schedule('0 0 * * *', async () => {
  console.log("Cron job triggered at:", new Date().toLocaleString());
  try {
    console.log("Triggering expired subscriptions deactivation...");
    const response = await axios.get('http://13.203.24.247:2000/api/v1/subscription/deactivate-expired-subscriptionsns');
    console.log("Deactivation response:", response.data);
  } catch (error) {
    console.error("Error triggering deactivation route:", error);
  }
});

// MEETING NOTIFICATION 
cron.schedule("* * * * *", async () => {
  try {
    console.log("🔍 Checking for upcoming and ongoing meetings...");

    const todayDate = moment().format("YYYY-MM-DD");
    const currentTime = moment().format("hh:mm A");
    const reminderTime = moment().add(30, "minutes").format("hh:mm A");
    console.log("currentTime -",currentTime);
    console.log("reminderTime -",reminderTime);

    // Fetch all meetings that are either starting now or in 30 minutes
    const meetings = await MeetingBase.find({
      selectedDate: todayDate,
      startTime: { $in: [reminderTime, currentTime] },
    });
    console.log("meetings -",meetings);
    if (meetings.length === 0) {
      return;
    }

    const notificationsToInsert = [];
    const socketNotifications = [];

    for (const meeting of meetings) {
      const invitedPeople = [
        ...meeting.invitedPeople.map((person) => person.user.toString()),
        meeting.meetingOwner.toString(),
      ];

      const type = meeting.startTime === reminderTime ? "upcoming" : "ongoing";
      const notificationContent =
        type === "upcoming"
          ? `Reminder: Your meeting "${meeting.meetingTitle}" is scheduled at ${meeting.startTime}. Be ready in 30 minutes!`
          : `Reminder: Your meeting "${meeting.meetingTitle}" is starting now!`;

      // Batch users into groups of 5 for API requests
      for (let i = 0; i < invitedPeople.length; i += 5) {
        const batch = invitedPeople.slice(i, i + 5);

        try {
          const response = await axios.post("http://13.203.24.247:9000/api/v1/fcm/sendMeetingNotification", {
            userIds: batch,
            notification: { title: "Meeting Invitation", body: notificationContent },
          });

          console.log('response sendMeetingNotification -',response);
          
        } catch (error) {
          console.error("❌ Notification API Error:", error.response?.data || error.message);
        }
      }

      // Prepare notifications for bulk insert
      for (const userId of invitedPeople) {
        notificationsToInsert.push({
          sender: meeting.meetingOwner,
          receiver: userId,
          type: "meeting",
          content: notificationContent,
          status: "unread",
        });

        socketNotifications.push({ userId, content: notificationContent });
      }
    }
    console.log("notificationsToInsert from meeting cron-",notificationsToInsert);

    // Insert all notifications at once
    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
    }

    // Emit socket notifications
    for (const { userId, content } of socketNotifications) {
      emitNotification(userId, { content });
    }

    console.log("🎯 Notification process completed successfully.");
  } catch (error) {
    console.error("🔥 Error in cron job:", error);
  }
});