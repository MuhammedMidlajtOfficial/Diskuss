const MeetingBase = require("../../models/meeting/EnterpriseMeetingModel");
const moment = require("moment");
const cron = require("node-cron");
const Profile = require("../../models/users/enterpriseEmploye.model");
const axios = require("axios");
const enterprise = require("../../models/users/enterpriseUser");
const individualUserCollection = require("../../models/users/individualUser");
const mongoose = require("mongoose");

const Notification = require("../../models/notification/NotificationModel");
const {
  emitNotification,
} = require("../../Controller/Socket.io/NotificationSocketIo");
const { required } = require("joi");

const CreateMeeting = async (req, res) => {
  try {
    const {
      meetingOwner,
      meetingTitle,
      type, // 'online' or 'offline'
      selectedDate,
      startTime,
      endTime,
      invitedPeople, // Array of invited users
      ListOfInvitedPeopleViaSms,
      description,
      isRemind,
      meetingPlatform, // Only for online
      meetingLink, // Only for online
      meetingPlace, // Only for offline
      roomNo, // Only for offline
      cabinNo, // Only for offline
    } = req.body;

    // Validate required fields
    if (
      !meetingOwner ||
      !meetingTitle ||
      !type ||
      !selectedDate ||
      !startTime ||
      !endTime ||
      !invitedPeople
    ) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // Initialize meeting data
    const newMeetingData = {
      meetingOwner,
      meetingTitle,
      type,
      selectedDate,
      startTime,
      endTime,
      ListOfInvitedPeopleViaSms,
      invitedPeople: invitedPeople.map((user) => ({ user, status: "pending" })),
      description,
      isRemind,
    };

    // Validate and add online/offline-specific fields
    if (type === "online") {
      if (!meetingPlatform || !meetingLink) {
        return res.status(400).json({
          message: "Platform and link are required for online meetings.",
        });
      }
      newMeetingData.meetingPlatform = meetingPlatform;
      newMeetingData.meetingLink = meetingLink;
    } else if (type === "offline") {
      if (!meetingPlace || !roomNo) {
        return res.status(400).json({
          message: "Place and room number are required for offline meetings.",
        });
      }
      newMeetingData.meetingPlace = meetingPlace;
      newMeetingData.roomNo = roomNo;
      newMeetingData.cabinNo = cabinNo || null; // Optional field
    } else {
      return res.status(400).json({
        message: "Invalid meeting type. Must be 'online' or 'offline'.",
      });
    }

    // Save the meeting
    const newMeeting = new MeetingBase(newMeetingData);
    const savedMeeting = await newMeeting.save();

    // Fetch the meeting owner profile
    const ownerProfile =
      (await Profile.findById(meetingOwner)) ||
      (await enterprise.findById(meetingOwner)) ||
      (await individualUserCollection.findById(meetingOwner));

    if (!ownerProfile) {
      return res
        .status(400)
        .json({ message: `No user found with ID: ${meetingOwner}` });
    }

    await ownerProfile.updateOne({ $push: { meetings: savedMeeting._id } });

    // Create notification
    const selectedDateObj = new Date(selectedDate);
    const day = String(selectedDateObj.getDate()).padStart(2, "0");
    const month = String(selectedDateObj.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const year = selectedDateObj.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    const ownerName =
      ownerProfile.username || ownerProfile.companyName || "Unknown";
     
  

const notificationContent = `You have been invited to a meeting titled "${meetingTitle}" on ${formattedDate} Sheduled on ${startTime}, created by ${ownerName}.`;
      
  
     
  

    console.log("invitedPeople-", invitedPeople);

    if (invitedPeople.length != 0) {
      // Send notification to admin backend
      const repose = await axios.post(
        "http://13.203.24.247:9000/api/v1/fcm/sendMeetingNotification",
        {
          userIds: invitedPeople,
          notification: {
            title: "Meeting Invitation",
            body: notificationContent,
          },
        }
      );

      console.log(repose.data);
    }

    // Notify invited users and update their profiles
    await Promise.all(
      invitedPeople.map(async (userId) => {
        const invitedUserProfile =
          (await Profile.findById(userId)) ||
          (await enterprise.findById(userId)) ||
          (await individualUserCollection.findById(userId));

        if (invitedUserProfile) {
          await invitedUserProfile.updateOne({
            $push: { meetings: savedMeeting._id },
          });

          // Create notification
          const selectedDateObj = new Date(selectedDate);
          const day = String(selectedDateObj.getDate()).padStart(2, "0");
          const month = String(selectedDateObj.getMonth() + 1).padStart(2, "0"); // months are 0-based
          const year = selectedDateObj.getFullYear();

          const formattedDate = `${day}/${month}/${year}`;

          const ownerName =
            ownerProfile.username || ownerProfile.companyName || "Unknown";
            const notificationContent = `
            <h3>
              You have been invited to a meeting titled 
              <strong>"${meetingTitle}"</strong> on 
              <strong>${formattedDate}</strong>, Scheduled at 
              <strong>${startTime}</strong>, created by 
              <strong>${ownerName}</strong>.
            </h3>
          `;

          const notification = new Notification({
            sender: meetingOwner,
            receiver: userId,
            type: "meeting",
            content: notificationContent,
            status: "unread",
          });
          await notification.save();

          // Emit notification
          emitNotification(userId, notification);
        }
      })
    );

    res.status(201).json({
      message: "Meeting created successfully.",
      meeting: savedMeeting,
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const updateMeetingStatus = async (req, res) => {
  const { meetingId, userId, status, reason } = req.body;

  try {
    // Validate input
    if (!meetingId || !userId || !status) {
      return res
        .status(400)
        .json({ message: "Meeting ID, User ID, and status are required." });
    }

    if (!["pending", "accepted", "denied"].includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Valid options are 'pending', 'accepted', or 'denied'.",
      });
    }

    // if (status === 'rejected' && !reason) {
    //     return res.status(400).json({ message: "Reason is required for rejection." });
    // }

    // Update the meeting status for the user
    const updatedMeeting = await MeetingBase.findOneAndUpdate({ _id: meetingId, "invitedPeople.user": userId },
      {
        $set: {
          "invitedPeople.$.status": status,
          ...(status === "denied" || (status === "accepted" && reason)
            ? { "invitedPeople.$.reason": reason }
            : {}),
        },
      },
      { new: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting or user not found." });
    }

    const invitedUserProfile =
      (await Profile.findById(userId)) ||
      (await enterprise.findById(userId)) ||
      (await individualUserCollection.findById(userId));

    const username =
      invitedUserProfile.username ||
      invitedUserProfile.companyName ||
      "Unknown";

    // Notify the meeting owner about the user's decision
    const meetingOwner = updatedMeeting.meetingOwner;
    const meetingTitle = updatedMeeting.meetingTitle;
    const decision = status === "accepted" ? "accepted" : "denied";

  const notificationContent = `${username} has ${decision} your meeting titled "${meetingTitle}".`;

  

    try {
      if (meetingOwner.length != 0) {
        // Send notification to admin backend
        const repose = await axios.post(
          "http://13.203.24.247:9000/api/v1/fcm/acceptanceNotification",
          {
            userId: meetingOwner,
            notification: {
              title: "Meeting Status",
              body: notificationContent,
            },
          }
        );
  
        console.log(repose.data);
      }
    } catch (notificationError) {
        console.error(
          "Error sending meeting acceptance notification:",
          notificationError.response?.data || notificationError.message
        );
    }

    const notificationContent2 = `
    <h3>
      <strong>${username}</strong> has 
      <strong>${decision}</strong> your meeting titled 
      <strong>"${meetingTitle}"</strong>.
    </h3>
  `;


    const notification = new Notification({
      sender: userId,
      receiver: meetingOwner,
      type: "meeting",
      content: notificationContent2,
      status: "unread",
    });
    await notification.save();

    // console.log(notification);

    // Emit notification
    emitNotification(meetingOwner, notification);

    // const notificationPayload = {
    //   userId: meetingOwner,
    //   notification: {
    //     title: "Meeting Update",
    //     body: `User has ${decision} your meeting titled "${meetingTitle}".`,
    //   },
    // };

    // Send notification to admin backend
    // try {
    //   await axios.post(
    //     "http://13.203.24.247:9000/api/v1/fcm/acceptanceNotification",
    //     notificationPayload,
    //     {
    //       headers: {
    //         "Content-Type": "application/json",
    //       },
    //     }
    //   );
    //   console.log("Meeting acceptance notification sent successfully.");
    // } catch (notificationError) {
    //   console.error(
    //     "Error sending meeting acceptance notification:",
    //     notificationError.response?.data || notificationError.message
    //   );
    // }


    res.status(200).json({
      message: `Meeting status updated to '${status}' successfully.`,
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("Error updating meeting status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

const getUpcomingMeetings = async (req, res) => {
  const { userId } = req.params; // Get the user ID from the request parameters
  let { page = null, limit = null } = req.query;

  try {
    // Get the current date and time
    const currentDateTime = moment();

    // Find all upcoming meetings organized by the user
    let upcomingMeetings = await MeetingBase.find({
      meetingOwner: userId, // Filter by user ID
      selectedDate: { $gte: currentDateTime.toDate() }, // Filter for upcoming meetings for today
    }).exec();

    // Check if there are no upcoming meetings
    if (upcomingMeetings.length === 0) {
      return res.status(404).json({ message: "No upcoming meetings found." });
    }

     // Apply pagination if page and limit are provided
     if (page !== null && limit !== null) {
      const startIndex = (page - 1) * limit;
      upcomingMeetings = upcomingMeetings.slice(startIndex, startIndex + limit);
    }

    return res.status(200).json(upcomingMeetings);
  } catch (error) {
    console.error("Error fetching upcoming meetings:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getMeetingsByIds = async (req, res) => {
  try {
    const { userId } = req.params;
    let { page = null, limit = null } = req.query;

    // Fetch user profile from Profile, Enterprise, or IndividualUserCollection
    let userInfo = await Profile.findById(userId).populate({
      path: "meetings",
      strictPopulate: false,
    });

    if (!userInfo) {
      userInfo = await enterprise.findById(userId).populate({
        path: "meetings",
        strictPopulate: false,
      });
    }

    // console.log(userInfo);

    if (!userInfo) {
      userInfo = await individualUserCollection.findById(userId).populate({
        path: "meetings",
        strictPopulate: false,
      });
    }

    if (!userInfo) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const meetingIds = userInfo.meetings?.map((meeting) => meeting._id);
    console.log(meetingIds);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log(today);
    // const meetings = await MeetingBase.find({
    //   _id: { $in: meetingIds },
    //   // selectedDate: { $gte: today },
    // }).sort({ selectedDate: 1 }); // Ascending order based on selectedDate
  //   const meetings = await MeetingBase.aggregate([
  //     {
  //         $match: {
  //             $and: [
  //                 {
  //                     $or: [
  //                         { meetingOwner: new ObjectId(userId) }, // Convert userId to ObjectId
  //                         { 'invitedPeople.user': new ObjectId(userId) } // Convert userId to ObjectId
  //                     ]
  //                 },
  //                 { selectedDate: { $gte: today } } // Filter meetings with selectedDate >= today
  //             ]
  //         }
  //     }
  // ]);
  const meetings = await MeetingBase.find({
    $or: [
      { meetingOwner: userId },
      { 'invitedPeople.user': userId }
    ],
    selectedDate: { $gte: today }
  }).sort({ selectedDate: 1 });
  


    
  
    const meeting_date = meetings.map((meeting) => meeting.selectedDate);
    

    if (meetings.length === 0) {
      return res.status(200).json({ meetings: [] });
    }

    const meetingOwnerIds = meetings.map((meeting) => meeting.meetingOwner);

    const invitedPeopleIds = meetings.flatMap((meeting) =>
      meeting.invitedPeople.map((invitee) => invitee.user)
    );

    // Fetch profiles from all collections
    const [ownerProfiles, invitedProfiles] = await Promise.all([
      Profile.find({ _id: { $in: meetingOwnerIds } }),
      Profile.find({ _id: { $in: invitedPeopleIds } }),
    ]);

    const [enterpriseOwnerProfiles, enterpriseInvitedProfiles] =
      await Promise.all([
        enterprise.find({ _id: { $in: meetingOwnerIds } }),
        enterprise.find({ _id: { $in: invitedPeopleIds } }),
      ]);

    const [individualOwnerProfiles, individualInvitedProfiles] =
      await Promise.all([
        individualUserCollection.find({ _id: { $in: meetingOwnerIds } }),
        individualUserCollection.find({ _id: { $in: invitedPeopleIds } }),
      ]);

    const profiles = [
      ...ownerProfiles,
      ...enterpriseOwnerProfiles,
      ...individualOwnerProfiles,
      ...invitedProfiles,
      ...enterpriseInvitedProfiles,
      ...individualInvitedProfiles,
    ];

    // Construct profilesMap
    const profilesMap = profiles.reduce((map, profile) => {
      map[profile._id.toString()] = {
        username: profile.username || profile.companyName || profile.name,
        email: profile.email,
        image: profile.image || "",
        userId: profile._id,
      };
      return map;
    }, {});

    // Enrich meetings with owner and invited user info
    let enrichedMeetings = meetings.map((meeting) => {
      const meetingOwnerInfo =
        profilesMap[meeting.meetingOwner?.toString()] || null;

      const invitedInfo = meeting.invitedPeople.map((invitee) => {
        const inviteeInfo = profilesMap[invitee.user?.toString()] || {};
        return {
          ...inviteeInfo,
          status: invitee.status,
          reason: invitee.reason || null,
        };
      });

      return {
        ...meeting.toObject(),
        meetingOwnerInfo,
        invitedInfo,
      };
    });

      // Apply pagination if page and limit are provided
      if (page !== null && limit !== null) {
        const startIndex = (page - 1) * limit;
        enrichedMeetings = enrichedMeetings.slice(startIndex, startIndex + limit);
      }

    return res.status(200).json({ meetings: enrichedMeetings });
  } catch (error) {
    console.error("Error fetching meetings by IDs:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const deleteMeeting = async (req, res) => {
  const { meetingId } = req.params; // Get the meeting ID from the request parameters

  try {
    // Find the meeting by ID
    const meetingToDelete = await MeetingBase.findById(meetingId);

    // Check if the meeting exists
    if (!meetingToDelete) {
      return res.status(404).json({ message: "Meeting not found." });
    }

    const { meetingOwner, invitedPeople } = meetingToDelete;

    // Delete the meeting
    const meeting = await MeetingBase.findByIdAndDelete(meetingId);
    // console.log(meeting);

    // Remove the meeting ID from the meeting owner's Profile, Enterprise, or individualUserCollection
    const ownerUpdated =
      (await Profile.findByIdAndUpdate(
        meetingOwner,
        { $pull: { meetings: meetingId } },
        { new: true }
      )) ||
      (await enterprise.findByIdAndUpdate(
        meetingOwner,
        { $pull: { meetings: meetingId } },
        { new: true }
      )) ||
      (await individualUserCollection.findByIdAndUpdate(
        meetingOwner,
        { $pull: { meetings: meetingId } },
        { new: true }
      ));

    if (!ownerUpdated) {
      console.log(
        `No profile, enterprise, or individual user found for meeting owner ID: ${meetingOwner}`
      );
    }

    // Create notification
    const selectedDateObj = new Date(meetingToDelete.selectedDate);
    const day = String(selectedDateObj.getDate()).padStart(2, "0");
    const month = String(selectedDateObj.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const year = selectedDateObj.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;

    const ownerName =
      ownerUpdated.username || ownerUpdated.companyName || "Unknown";

    const notificationContent = 
  `The meeting titled '${meetingToDelete.meetingTitle}' on ${formattedDate}, scheduled at ${meetingToDelete.startTime}, created by ${ownerName}, has been cancelled.`;

  
    

    // console.log(invitedPeople);

    // Remove the meeting ID from each invited user's Profile, Enterprise, or individualUserCollection
    await Promise.all(
      invitedPeople.map(async ({ user }) => {
        const userId = user.toString(); // Convert the user ID to a string
        try {
          // Update the user's document in Profile, Enterprise, or individualUserCollection
          const userUpdated =
            (await Profile.findByIdAndUpdate(
              userId,
              { $pull: { meetings: meetingId } },
              { new: true }
            )) ||
            (await enterprise.findByIdAndUpdate(
              userId,
              { $pull: { meetings: meetingId } },
              { new: true }
            )) ||
            (await individualUserCollection.findByIdAndUpdate(
              userId,
              { $pull: { meetings: meetingId } },
              { new: true }
            ));

          if (!userUpdated) {
            console.log(
              `No profile, enterprise, or individual user found for user ID: ${userId}`
            );
          } else {
            // Create notification content for the invited user

            const userIds = invitedPeople.map((person) => person.user.toString());
            // Send notification to admin backend
            if (invitedPeople.length != 0) {
              const repose = await axios.post(
                "http://13.203.24.247:9000/api/v1/fcm/sendMeetingNotification",
                {
                  userIds,
                  notification: {
                    title: "Meeting has been cancelled",
                    body: notificationContent,
                  },
                }
              );
              console.log("Received userIds:", userIds);
              console.log("Meeting deleted successfully", repose.data);
            }

            const notificationContent2 = `
  <h3>
    The meeting titled <strong>'${meetingToDelete.meetingTitle}'</strong> on 
    <strong>${formattedDate}</strong>, Scheduled at 
    <strong>${meetingToDelete.startTime}</strong>, created by 
    <strong>${ownerName}</strong>, has been cancelled.
  </h3>
`;

         

            // Create and save a notification
            const notification = new Notification({
              sender: meetingOwner,
              receiver: userId,
              type: "meeting",
              content: notificationContent2,
              status: "unread",
            });
            await notification.save();
            emitNotification(userId, notification);
          }
        } catch (error) {
          console.error(
            `Error updating profile, enterprise, or individual user for user ID: ${userId}`,
            error
          );
        }
      })
    );

    // Log confirmation
    console.log("Meeting deleted and references removed successfully.");

    // Return success response
    return res.status(200).json({
      message: "Meeting deleted successfully.",
      meeting: meetingToDelete,
    });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};



    
const UpdateMeeting  = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const updatedData = req.body;

    // Fetch the original meeting
    const oldMeeting = await MeetingBase.findById(meetingId);
    if (!oldMeeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    const ownerId = oldMeeting.meetingOwner;

     const updateTime  = updatedData.startTime.split(":");

     if(updateTime[0] < 10){

      updatedData.startTime = "0" + updatedData.startTime;
      console.log(updatedData.startTime)

     }

    // Fetch the meeting owner's profile
    const invitedUserProfile =
      (await Profile.findById(ownerId)) ||
      (await enterprise.findById(ownerId)) ||
      (await individualUserCollection.findById(ownerId));

    const Ownername =
      invitedUserProfile?.username ||
      invitedUserProfile?.companyName ||
      "Unknown";

    console.log("Meeting Owner:", Ownername);

    // Store the old invited people
    const oldInvitedPeople = oldMeeting.invitedPeople.map((person) =>
      person.user.toString()
    );
    console.log("Old Invited People:", oldInvitedPeople);

    // Reset status to "pending" for updated invited people
    if (updatedData.invitedPeople) {
      updatedData.invitedPeople = updatedData.invitedPeople.map((user) => ({
        user,
        status: "pending",
      }));
    }

    if (updatedData.ListOfInvitedPeopleViaSms && Array.isArray(updatedData.ListOfInvitedPeopleViaSms)) {
      updatedData.ListOfInvitedPeopleViaSms = updatedData.ListOfInvitedPeopleViaSms.map(({ Name, PhonNumber }) => ({
        Name,
        PhonNumber,
      }));
    }

    // Update the meeting
    const updatedMeeting = await MeetingBase.findByIdAndUpdate(
      meetingId,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting not found after update" });
    }

    // Store the new invited people
    const newInvitedPeople = updatedMeeting.invitedPeople.map((person) =>
      person.user.toString()
    );

    // Find removed users (present in old but not in new)
    const removedPeople = oldInvitedPeople.filter(
      (userId) => !newInvitedPeople.includes(userId)
    );

    // Find users who are present in both old and new meetings (previously present and still invited)
    const usersStillInvited = oldInvitedPeople.filter((userId) =>
      newInvitedPeople.includes(userId)
    );

    console.log("New Invited People:", newInvitedPeople);
    console.log("Removed People:", removedPeople);
    console.log("Users Still Invited:", usersStillInvited);

    // Format the selected date
    const selectedDateObj = new Date(updatedData.selectedDate);
    const day = String(selectedDateObj.getDate()).padStart(2, "0");
    const month = String(selectedDateObj.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const year = selectedDateObj.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    // Notify removed users
    if (removedPeople.length > 0) {
      const notificationContentRemove = `You have been removed from the meeting titled "${updatedData.meetingTitle}" scheduled on ${formattedDate}, created by ${Ownername}.`;

      try {
        const fcmResponse = await axios.post(
          "http://13.203.24.247:9000/api/v1/fcm/sendMeetingNotification",
          {
            userIds: removedPeople,
            notification: {
              title: "Meeting Removal",
              body: notificationContentRemove,
            },
          }
        );
        console.log("FCM Response for Removed Users:", fcmResponse.data);
      } catch (error) {
        console.error("FCM Error for Removed Users:", error.message);
      }

      const notificationContentRemove2 = `
          <h3>
            You have been removed from the meeting titled <strong>"${updatedData.meetingTitle}"</strong> on 
            <strong>${formattedDate}</strong>, Scheduled at 
            <strong>${updatedMeeting.startTime}</strong>, created by 
            <strong>${Ownername}</strong>.
          </h3>
        `;

      // Remove meeting ID from removed users
      await Promise.all(
        removedPeople.map(async (userId) => {
          try {
            const profileOrEnterprise =
              (await Profile.findById(userId)) ||
              (await enterprise.findById(userId)) ||
              (await individualUserCollection.findById(userId));

            if (profileOrEnterprise) {
              await profileOrEnterprise.updateOne(
                { $pull: { meetings: updatedMeeting._id } }, // Remove the meeting ID
                { new: true }
              );
            } else {
              console.log(
                `No profile, enterprise, or individual user found with ID: ${userId}`
              );
            }

            const notification = new Notification({
              sender: ownerId,
              receiver: userId,
              type: "meeting",
              content: notificationContentRemove2,
              status: "unread",
            });
            await notification.save();

            // Emit notification
            emitNotification(userId, notification);
          } catch (error) {
            console.error(
              `Error removing meeting ID from user ID: ${userId}`,
              error
            );
          }
        })
      );
    }

    // Notify newly invited users
    if (newInvitedPeople.length > 0) {
      const notificationContent = `You have been invited to a meeting titled "${updatedData.meetingTitle}" on ${formattedDate}, scheduled at ${updatedMeeting.startTime}, created by ${Ownername}.`;

      try {
        const fcmResponse = await axios.post(
          "http://13.203.24.247:9000/api/v1/fcm/sendMeetingNotification",
          {
            userIds: newInvitedPeople,
            notification: {
              title: "Meeting Invitation",
              body: notificationContent,
            },
          }
        );
        console.log("FCM Response for New Invited Users:", fcmResponse.data);
      } catch (error) {
        console.error("FCM Error for New Invited Users:", error.message);
      }

      const notificationContentInApp = `
  <h3>
    You have been invited to a meeting titled <strong>"${updatedData.meetingTitle}"</strong> on 
    <strong>${formattedDate}</strong>, Scheduled at 
    <strong>${updatedMeeting.startTime}</strong>, created by 
    <strong>${Ownername}</strong>.
  </h3>
`;

      // Add meeting ID to new invited users
      await Promise.all(
        newInvitedPeople.map(async (userId) => {
          try {
            const profileOrEnterprise =
              (await Profile.findById(userId)) ||
              (await enterprise.findById(userId)) ||
              (await individualUserCollection.findById(userId));

            if (profileOrEnterprise) {
              await profileOrEnterprise.updateOne(
                { $addToSet: { meetings: updatedMeeting._id } }, // Add the meeting ID
                { new: true }
              );
            } else {
              console.log(
                `No profile, enterprise, or individual user found with ID: ${userId}`
              );
            }

            const notification = new Notification({
              sender: ownerId,
              receiver: userId,
              type: "meeting",
              content: notificationContentInApp,
              status: "unread",
            });
            await notification.save();

            // Emit notification
            emitNotification(userId, notification);
          } catch (error) {
            console.error(`Error adding meeting ID to user ID: ${userId}`, error);
          }
        })
      );
    }

    // Notify users who are still invited (present in both old and new meetings)
    if (usersStillInvited.length > 0) {
      const notificationContentUpdate = `The meeting titled "${updatedData.meetingTitle}", scheduled on ${formattedDate} at ${updatedMeeting.startTime}, created by ${Ownername}, has been updated. Please check the details for any changes.`;

      try {
        const fcmResponse = await axios.post(
          "http://13.203.24.247:9000/api/v1/fcm/sendMeetingNotification",
          {
            userIds: usersStillInvited,
            notification: {
              title: "Meeting Updated",
              body: notificationContentUpdate,
            },
          }
        );
        console.log("FCM Response for Users Still Invited:", fcmResponse.data);
      } catch (error) {
        console.error("FCM Error for Users Still Invited:", error.message);
      }

      const notificationContentUpdate2 = `
            <h3>
              The meeting titled <strong>"${updatedData.meetingTitle}"</strong> on 
              <strong>${formattedDate}</strong>, Scheduled at 
              <strong>${updatedMeeting.startTime}</strong>, created by 
              <strong>${Ownername}</strong> has been updated. Please check the details for any changes..
            </h3>
          `;


      // Notify users still invited in the database
      await Promise.all(
        usersStillInvited.map(async (userId) => {
          try {
            const notification = new Notification({
              sender: ownerId,
              receiver: userId,
              type: "meeting",
              content: notificationContentUpdate2,
              status: "unread",
            });
            await notification.save();

            // Emit notification
            emitNotification(userId, notification);
          } catch (error) {
            console.error(`Error notifying user ID: ${userId}`, error);
          }
        })
      );
    }

    // Return the updated meeting information
    return res.status(200).json({
      data: updatedMeeting,
      success: true,
      message: "Successfully updated",
    });
  } catch (error) {
    console.error("Error in UpdateMeeting:", error);
    return res.status(500).json({ message: "Failed to update meeting", error: error.message });
  }
};






module.exports = {
  CreateMeeting,
  getUpcomingMeetings,
  deleteMeeting,
  getMeetingsByIds,
  UpdateMeeting,
  updateMeetingStatus,
};
