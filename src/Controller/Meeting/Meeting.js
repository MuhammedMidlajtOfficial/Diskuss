const MeetingBase = require("../../models/EnterpriseMeetingModel");
const moment = require("moment");
const cron = require("node-cron");
const Profile = require("../../models/enterpriseEmploye.model");
const enterprise = require("../../models/enterpriseUser");
const { individualUserCollection } = require("../../DBConfig");
const mongoose = require("mongoose");
const Contact = require("../../models/contact.individul.model");
const Notification = require("../../models/NotificationModel");
const {
  emitNotification,
} = require("../../Controller/Socket.io/NotificationSocketIo");
const { required } = require("joi");
const axios = require("axios");

// CreateMeeting controller

// const CreateMeeting = async (req, res) => {
//   try {
//     const {
//       meetingOwner,
//       meetingTitle,
//       type, // 'online' or 'offline'
//       selectedDate,
//       startTime,
//       endTime,
//       invitedPeople, // Array of invited users
//       description,
//       isRemind,
//       meetingPlatform, // Only for online
//       meetingLink, // Only for online
//       meetingPlace, // Only for offline
//       roomNo, // Only for offline
//       cabinNo, // Only for offline
//     } = req.body;

//     // Validate required fields
//     if (!meetingOwner || !meetingTitle || !type || !selectedDate || !startTime || !endTime || !invitedPeople) {
//       return res.status(400).json({ message: "Missing required fields." });
//     }

//     // Initialize meeting data
//     const newMeetingData = {
//       meetingOwner,
//       meetingTitle,
//       type,
//       selectedDate,
//       startTime,
//       endTime,
//       invitedPeople: invitedPeople.map(user => ({ user, status: "pending" })),
//       description,
//       isRemind,
//     };

//     console.log(newMeetingData)

//     // Validate and add online/offline-specific fields
//     if (type === "online") {
//       if (!meetingPlatform || !meetingLink) {
//         return res.status(400).json({ message: "Platform and link are required for online meetings." });
//       }
//       newMeetingData.meetingPlatform = meetingPlatform;
//       newMeetingData.meetingLink = meetingLink;
//     } else if (type === "offline") {
//       if (!meetingPlace || !roomNo) {
//         return res.status(400).json({ message: "Place and room number are required for offline meetings." });
//       }
//       newMeetingData.meetingPlace = meetingPlace;
//       newMeetingData.roomNo = roomNo;
//       newMeetingData.cabinNo = cabinNo || null; // Optional field
//     } else {
//       return res.status(400).json({ message: "Invalid meeting type. Must be 'online' or 'offline'." });
//     }

//     // Save the meeting
//     const newMeeting = new MeetingBase(newMeetingData);
//     const savedMeeting = await newMeeting.save();

//     // Fetch the meeting owner profile
//     const ownerProfile = await Profile.findById(meetingOwner) || await enterprise.findById(meetingOwner);
//     if (!ownerProfile) {
//       return res.status(400).json({ message: `No user found with ID: ${meetingOwner}` });
//     }
//     await ownerProfile.updateOne({ $push: { meetings: savedMeeting._id } });

//     // Notify invited users and update their profiles
//     await Promise.all(
//       invitedPeople.map(async (userId) => {
//         const invitedUserProfile = await Profile.findById(userId) || await enterprise.findById(userId);
//         if (invitedUserProfile) {
//           await invitedUserProfile.updateOne({ $push: { meetings: savedMeeting._id } });

//           // Create notification
//           const ownerName = ownerProfile.username || ownerProfile.companyName || "Unknown";
//           const notificationContent = `You have been invited to a meeting titled "${meetingTitle}" on ${selectedDate} at ${startTime}, created by ${ownerName}.`;

//           const notification = new Notification({
//             sender: meetingOwner,
//             receiver: userId,
//             type: "meeting",
//             content: notificationContent,
//             status: "unread",
//           });
//           await notification.save();

//           // Emit notification
//           emitNotification(userId, notification);
//         }
//       })
//     );

//     res.status(201).json({ message: "Meeting created successfully.", meeting: savedMeeting });
//   } catch (error) {
//     console.error("Error creating meeting:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// };

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
      invitedPeople: invitedPeople.map((user) => ({ user, status: "pending" })),
      description,
      isRemind,
    };

    // Validate and add online/offline-specific fields
    if (type === "online") {
      if (!meetingPlatform || !meetingLink) {
        return res
          .status(400)
          .json({
            message: "Platform and link are required for online meetings.",
          });
      }
      newMeetingData.meetingPlatform = meetingPlatform;
      newMeetingData.meetingLink = meetingLink;
    } else if (type === "offline") {
      if (!meetingPlace || !roomNo) {
        return res
          .status(400)
          .json({
            message: "Place and room number are required for offline meetings.",
          });
      }
      newMeetingData.meetingPlace = meetingPlace;
      newMeetingData.roomNo = roomNo;
      newMeetingData.cabinNo = cabinNo || null; // Optional field
    } else {
      return res
        .status(400)
        .json({
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

    const selectedDateObj = new Date(selectedDate);
    const day = String(selectedDateObj.getDate()).padStart(2, "0");
    const month = String(selectedDateObj.getMonth() + 1).padStart(2, "0"); // months are 0-based
    const year = selectedDateObj.getFullYear();

    const formattedDate = `${day}/${month}/${year}`;
    const notificationContent = `You have been invited to a meeting titled ${meetingTitle} on ${formattedDate} at ${startTime}.`;

    // Send notification to admin backend
    await axios.post(
      "https://diskuss-admin.onrender.com/api/v1/fcm/sendMeetingNotification",
      {
        userIds: invitedPeople,
        notification: {
          title: "Meeting Invitation",
          body: notificationContent,
        },
      }
    );

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
          const ownerName =
            ownerProfile.username || ownerProfile.companyName || "Unknown";
          const notificationContent = `You have been invited to a meeting titled "${meetingTitle}" on ${selectedDate} at ${startTime}, created by ${ownerName}.`;

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

    res
      .status(201)
      .json({
        message: "Meeting created successfully.",
        meeting: savedMeeting,
      });
  } catch (error) {
    console.error("Error creating meeting:", error);
    res
      .status(500)
      .json({
        message:
          "Internal server error while creating meeting. Please try again later.",
      });
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

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({
          message:
            "Invalid status. Valid options are 'pending', 'accepted', or 'rejected'.",
        });
    }

    if (status === "rejected" && !reason) {
      return res
        .status(400)
        .json({ message: "Reason is required for rejection." });
    }

    // Update the meeting status for the user
    const updatedMeeting = await MeetingBase.findOneAndUpdate(
      { _id: meetingId, "invitedPeople.user": userId },
      {
        $set: {
          "invitedPeople.$.status": status,
          ...(status === "rejected" || (status === "accepted" && reason)
            ? { "invitedPeople.$.reason": reason }
            : {}),
        },
      },
      { new: true }
    );

    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting or user not found." });
    }

    // Notify the meeting owner about the user's decision
    const meetingOwner = updatedMeeting.meetingOwner;
    const meetingTitle = updatedMeeting.meetingTitle;
    const decision = status === "accepted" ? "accepted" : "rejected";
    const notificationContent = `User ${userId} has ${decision} your meeting titled "${meetingTitle}".`;

            // Fetch the meeting owner's profile to get their userId
            const ownerProfile =
            await Profile.findById(meetingOwner) ||
            await enterprise.findById(meetingOwner) ||
            await individualUserCollection.findById(meetingOwner);

        if (!ownerProfile) {
            return res.status(400).json({ message: `No user found with ID: ${meetingOwner}` });
        }

        const ownerUserId = ownerProfile._id.toString(); // Ensure it's a string

        // Prepare notification payload
        const notificationPayload = {
            userId: ownerUserId,
            notification: {
                title: "Meeting Update",
                body: `User has ${decision} your meeting titled "${meetingTitle}".`,
            },
        };

        // Send notification to admin backend
        try {
            await axios.post(
                "http://localhost:9000/api/v1/fcm/send-meeting-acceptance", // Ensure this URL is correct
                notificationPayload,
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );
            console.log("Meeting acceptance notification sent successfully.");
        }  catch (notificationError) {
          console.error("Error sending meeting acceptance notification:", notificationError.response?.data || notificationError.message);
      }

    res.status(200).json({
      message: `Meeting status updated to '${status}' successfully.`,
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("Error updating meeting status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// const CreateMeeting = async (req, res) => {
//     try {
//         const {
//             meetingOwner,
//             meetingTitle,
//             type, // 'online' or 'offline'
//             selectedDate,
//             startTime,
//             endTime,
//             invitedPeople,
//             description,
//             isRemind,
//             meetingPlatform, // Only for online
//             meetingLink, // Only for online
//             meetingPlace, // Only for offline
//             roomNo, // Only for offline
//             cabinNo // Only for offline
//         } = req.body;

//         // Validate the required fields
//         if (!meetingTitle || !selectedDate || !startTime || !endTime || !invitedPeople) {
//             return res.status(400).json({ message: "Meeting title, date, start time, end time, and invited people are required." });
//         }

//         // Create a new meeting object
//         const newMeetingData = {
//             meetingOwner,
//             meetingTitle,
//             type,
//             selectedDate,
//             startTime,
//             endTime,
//             invitedPeople,
//             description,
//             isRemind
//         };

//         // Add online or offline-specific fields
//         if (type === 'online') {
//             if (!meetingPlatform || !meetingLink) {
//                 return res.status(400).json({ message: "Meeting platform and meeting link are required for online meetings." });
//             }
//             newMeetingData.meetingPlatform = meetingPlatform;
//             newMeetingData.meetingLink = meetingLink;
//         } else if (type === 'offline') {
//             if (!meetingPlace || !roomNo) {
//                 return res.status(400).json({ message: "Meeting place and room number are required for offline meetings." });
//             }
//             newMeetingData.meetingPlace = meetingPlace;
//             newMeetingData.roomNo = roomNo;
//             newMeetingData.cabinNo = cabinNo; // Optional
//         } else {
//             return res.status(400).json({ message: "Invalid meeting type. Please specify 'online' or 'offline'." });
//         }

//         // Save the new meeting
//         const newMeeting = new MeetingBase(newMeetingData);
//         const savedMeeting = await newMeeting.save();

//         // Update the meeting owner
//         const ownerProfile = await Profile.findById(meetingOwner) || await enterprise.findById(meetingOwner);

//         if (ownerProfile) {
//             await ownerProfile.updateOne({ $push: { meetings: savedMeeting._id } });
//         } else {
//             return res.status(400).json({ message: `No user found with ID: ${meetingOwner}` });
//         }

//         // Update each invited user's profile
//         await Promise.all(
//             invitedPeople.map(async (userId) => {

//                 let invitedUserProfile = await Profile.findById(userId) || enterprise.findById(userId);

//                 if (invitedUserProfile) {
//                     await invitedUserProfile.updateOne({ $push: { meetings: savedMeeting._id } });

//                     // Create a notification for the invited user
//                     const ownerName = ownerProfile.username || ownerProfile.companyName || "Unknown";

//                  // Create the notification content dynamically based on the available information
//                    const notificationContent = `You have been invited to a meeting titled "${meetingTitle}" on ${selectedDate} at ${startTime} created by ${ownerName}.`;

//                   // Create a notification for the invited user
//                    const notification = new Notification({
//                       sender: meetingOwner,
//                       receiver: userId,
//                         type: 'meeting',
//                        content: notificationContent,
//                       status: 'unread'
//                      });
//                     await notification.save();

//                     // Emit notification
//                     emitNotification(userId, notification);
//                 }
//             })
//         );

//         return res.status(201).json({ message: "Meeting created successfully.", meeting: savedMeeting });
//     } catch (error) {
//         console.error("Error creating meeting:", error);
//         return res.status(500).json({ message: "Internal server error." });
//     }
// };

// getUpcoming controller and its take req.params //
const getUpcomingMeetings = async (req, res) => {
  const { userId } = req.params; // Get the user ID from the request parameters

  try {
    // Get the current date and time
    const currentDateTime = moment();

    // Find all upcoming meetings organized by the user
    const upcomingMeetings = await MeetingBase.find({
      meetingOwner: userId, // Filter by user ID
      selectedDate: { $gte: currentDateTime.toDate() }, // Filter for upcoming meetings for today
    }).exec();

    // Check if there are no upcoming meetings
    if (upcomingMeetings.length === 0) {
      return res.status(404).json({ message: "No upcoming meetings found." });
    }

    return res.status(200).json(upcomingMeetings);
  } catch (error) {
    console.error("Error fetching upcoming meetings:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// get meeting by ids  //
// const getMeetingsByIds = async (req, res) => {
//     try {
//         const { userId } = req.params; // Extract userId from request parameters
//         //  console.log(userId);

//         // Find the user's profile by userId and populate meetings if referenced in schema
//         // console.log(userId);
//         let userInfo = await Profile.findById(userId).populate({
//             path: 'meetings',
//             strictPopulate: false,
//         });

//         // If not found in Profile collection, check in the enterprise collection
//         if (!userInfo) {
//             userInfo = await enterprise.findById(userId).populate({
//                 path: 'meetings',
//                 strictPopulate: false,
//             });
//         }

//         //  console.log("user info from line no 167",userInfo);
//          console.log('userInfo',userInfo);
//         // If user profile not found, return an error
//         if (!userInfo) {
//             return res.status(404).json({ message: "User profile not found." });
//         }

//         // Extract meeting IDs from the user's profile
//         const meetingIds = userInfo?.meetings?.map(meeting => meeting._id);
//         // console.log("meeting ids from line no 176",meetingIds);

//           // Get the current date and set the time to 00:00:00 for accurate filtering
//           const today = new Date();
//           today.setHours(0, 0, 0, 0);

//         // Find meetings in MeetingBase collection that match the extracted meeting IDs
//         // const meetings = await MeetingBase.find({ _id: { $in: meetingIds } });

//         const meetings = await MeetingBase.find({
//             _id: { $in: meetingIds },
//             selectedDate: { $gte: today } // Filter meetings where date is today or in the future
//         });

//         // console.log("meetings from  from line no 167",meetings);

//         // If no meetings found, return an error message
//         if (meetings.length === 0) {
//             return res.status(200).json({ message: [] });
//         }

//         // Extract meetingOwner IDs and invited people IDs from each meeting
//         const meetingOwnerIds = meetings.map(meeting => meeting.meetingOwner);
//         const invitedPeopleIds = meetings.flatMap(meeting => meeting.invitedPeople);
//         // console.log("from line no 190",meetingOwnerIds);
//         // console.log("from line no 190",invitedPeopleIds);

//         // Fetch profiles of meeting owners and invited people based on their IDs
//         const ownerProfiles = await Profile.find({ _id: { $in: meetingOwnerIds } });

//         const ownerProfilesenterprise = await enterprise.find({ _id: { $in: meetingOwnerIds } });

//         const invitedProfiles = await Profile.find({ _id: { $in: invitedPeopleIds } });
//         // console.log(ownerProfiles);
//         // console.log(invitedProfiles);
//           // Additionally check enterprise collection for invited people if needed
//           const additionalInvitedProfiles = await enterprise.find({ _id: { $in: invitedPeopleIds } });

//         // Create a map for easy lookup of profiles by userId
//         const profilesMap = [...ownerProfiles,...ownerProfilesenterprise, ...invitedProfiles,...additionalInvitedProfiles].reduce((acc, profile) => {
//             acc[profile._id] = {

//                 username: profile.username || profile.companyName,
//                 email: profile.email,
//                 image: profile.image,
//                 userId:profile._id
//             };; // Store each profile by its userId
//             return acc;
//         }, {});

//         // Enrich each meeting with the meeting owner's profile and invited people's profiles
//         const enrichedMeetings = meetings.map(meeting => {
//             const meetingOwnerInfo = profilesMap[meeting.meetingOwner] || null; // Find the meeting owner's profile
//             const invitedInfo = meeting.invitedPeople.map(id => profilesMap[id] || null); // Map invited IDs to profiles or null if not found
//             return {
//                 ...meeting.toObject(), // Convert mongoose document to plain object
//                 meetingOwnerInfo, // Add meeting owner's profile info
//                 invitedInfo // Add invited people's profile info
//             };
//         });

//         // console.log(enrichedMeetings);

//         // Send back the enriched meetings as the response
//         return res.status(200).json({ meetings: enrichedMeetings.reverse()  });

//     } catch (error) {
//         console.error("Error fetching meetings by IDs:", error); // Log error details for debugging
//         return res.status(500).json({ message: "Internal server error." }); // Return error response for server errors
//     }
// };

// const getMeetingsByIds = async (req, res) => {
//     try {
//       const { userId } = req.params;

//       // Fetch user profile from Profile or Enterprise collection
//       let userInfo = await Profile.findById(userId).populate({
//         path: "meetings",
//         strictPopulate: false,
//       });

//       if (!userInfo) {
//         userInfo = await enterprise.findById(userId).populate({
//           path: "meetings",
//           strictPopulate: false,
//         });
//       }
//       console.log("from line no 434",userInfo)

//       if (!userInfo) {
//         return res.status(404).json({ message: "User profile not found." });
//       }

//       // Extract meeting IDs

//       const meetingIds = userInfo.meetings?.map((meeting) =>  meeting._id);
//       // console.log(meetingIds)

//       // Get today's date with time reset to 00:00:00
//       const today = new Date();
//       today.setHours(0, 0, 0, 0);

//       // Fetch meetings for today or in the future
//       const meetings = await MeetingBase.find({
//         _id: { $in: meetingIds },
//         selectedDate: { $gte: today },
//       });

//       // console.log(meetings)

//       if (meetings.length === 0) {
//         return res.status(200).json({ meetings: [] });
//       }

//       // Extract IDs for meeting owners and invited users
//       const meetingOwnerIds = meetings.map((meeting) => meeting.meetingOwner);
//       const invitedPeopleIds = meetings.flatMap((meeting) =>
//         meeting.invitedPeople.map((invitee) => invitee.user)

//       )
//       console.log("frpm line no 473", meetingOwnerIds)
//       console.log("frpm line no 473", invitedPeopleIds)

//       // Fetch profiles of meeting owners and invited users
//       const [ownerProfiles, invitedProfiles] = await Promise.all([
//         Profile.find({ _id: { $in: meetingOwnerIds } }),
//         Profile.find({ _id: { $in: invitedPeopleIds } }),
//       ]);

//       const [enterpriseOwnerProfiles, enterpriseInvitedProfiles] = await Promise.all([
//         enterprise.find({ _id: { $in: meetingOwnerIds } }),
//         enterprise.find({ _id: { $in: invitedPeopleIds } }),
//       ]);

//       // Create a unified profile map for fast lookups
//       const profilesMap = [
//         ...ownerProfiles,
//         ...enterpriseOwnerProfiles,
//         ...invitedProfiles,
//         ...enterpriseInvitedProfiles,
//       ].reduce((map, profile) => {
//         map[profile._id] = {
//           username: profile.username || profile.companyName,
//           email: profile.email,
//           image: profile.image || "",
//           userId: profile._id,
//         };
//         return map;
//       }, {});

//       // Enrich meetings with owner and invited user info
//       const enrichedMeetings = meetings.map((meeting) => {
//         const meetingOwnerInfo = profilesMap[meeting.meetingOwner] || null;

//         // Map invited people with detailed info
//         const invitedInfo = meeting.invitedPeople.map((invitee) => ({
//           ...profilesMap[invitee.user],
//           status: invitee.status,
//           reason: invitee.reason || null,
//         }));

//         return {
//           ...meeting.toObject(),
//           meetingOwnerInfo,
//           invitedInfo,
//         };
//       });

//       // Send enriched meetings
//       return res.status(200).json({ meetings: enrichedMeetings.reverse() });
//     } catch (error) {
//       console.error("Error fetching meetings by IDs:", error);
//       return res.status(500).json({ message: "Internal server error." });
//     }
//   };

const getMeetingsByIds = async (req, res) => {
  try {
    const { userId } = req.params;

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

    const meetings = await MeetingBase.find({
      _id: { $in: meetingIds },
      selectedDate: { $gte: today },
    });

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
    const enrichedMeetings = meetings.map((meeting) => {
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

    return res.status(200).json({ meetings: enrichedMeetings.reverse() });
  } catch (error) {
    console.error("Error fetching meetings by IDs:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// const deleteMeeting = async (req, res) => {
//     const { meetingId } = req.params; // Get the meeting ID from the request parameters

//     try {
//         // Find the meeting by ID
//         var meetingToDelete = await MeetingBase.findById(meetingId);

//         // Check if the meeting exists
//         if (!meetingToDelete) {
//             return res.status(404).json({ message: "Meeting not found." });
//         }

//         const { meetingOwner, invitedPeople } = meetingToDelete;

//         const invitedUserIds = invitedPeople.map(person => person.user);
//         // Delete the meeting
//       const meeting =   await MeetingBase.findByIdAndDelete(meetingId);
//       console.log(meeting)

//         // Remove the meeting ID from the meeting owner's Profile or Enterprise document
//         const ownerUpdated = await Profile.findByIdAndUpdate(
//             meetingOwner,
//             { $pull: { meetings: meetingId } },
//             { new: true }
//         ) || await enterprise.findByIdAndUpdate(
//             meetingOwner,
//             { $pull: { meetings: meetingId } },
//             { new: true }
//         );

//         if (!ownerUpdated) {
//             console.log(`No profile or enterprise found for meeting owner ID: ${meetingOwner}`);
//         }

//         // Remove the meeting ID from each invited user's Profile or Enterprise documents
//         await Promise.all(
//             invitedPeople.map(async ({user}) => {
//               const userId = user.toString()
//                 try {
//                     const userUpdated = await Profile.findByIdAndUpdate(
//                         userId,
//                         { $pull: { meetings: meetingId } },
//                         { new: true }
//                     ) || await enterprise.findByIdAndUpdate(
//                         userId,
//                         { $pull: { meetings: meetingId } },
//                         { new: true }
//                     );

//                     const ownerName = ownerUpdated.username || ownerUpdated.companyName || "Unknown";

//                     // Create the notification content dynamically based on the available information
//                       const notificationContent = `There are no meetings scheduled for the specified time. The meeting titled '${meetingToDelete.meetingTitle}' scheduled for ${meetingToDelete.selectedDate} at ${meetingToDelete.startTime}, created by ${ownerName}, has been cancelled`;

//                      // Create a notification for the invited user
//                       const notification = new Notification({
//                          sender: meetingOwner,
//                          receiver: userId,
//                            type: 'meeting',
//                           content: notificationContent,
//                          status: 'unread'
//                         });
//                        await notification.save();

//                     if (!userUpdated) {
//                         console.log(`No profile or enterprise found for user ID: ${userId}`);
//                     }
//                 } catch (error) {
//                     console.error(`Error updating profile or enterprise for user ID: ${userId}`, error);
//                 }
//             })
//         );

//         // Log confirmation
//         console.log("Meeting deleted and references removed successfully.");

//         return res.status(200).json({ message: "Meeting deleted successfully.", meeting: meetingToDelete });
//     } catch (error) {
//         console.error("Error deleting meeting:", error);
//         return res.status(500).json({ message: "Internal server error." });
//     }
// };

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
    console.log(meeting);

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
            const ownerName =
              ownerUpdated.username || ownerUpdated.companyName || "Unknown";
            const notificationContent = `The meeting titled '${meetingToDelete.meetingTitle}' scheduled for ${meetingToDelete.selectedDate} at ${meetingToDelete.startTime}, created by ${ownerName}, has been cancelled.`;

            // Create and save a notification
            const notification = new Notification({
              sender: meetingOwner,
              receiver: userId,
              type: "meeting",
              content: notificationContent,
              status: "unread",
            });
            await notification.save();
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
    return res
      .status(200)
      .json({
        message: "Meeting deleted successfully.",
        meeting: meetingToDelete,
      });
  } catch (error) {
    console.error("Error deleting meeting:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// const UpdateMeeting = async (req, res) => {
//     try {
//         const { meetingId } = req.params; // Get meeting ID from request parameters
//         const updatedData = req.body; // Get updated meeting data from request body

//         if (updatedData.invitedPeople) {
//           updatedData.invitedPeople = updatedData.invitedPeople.map(user => ({ user, status: "pending" }));
//       }

//         // Find the meeting by ID and update it with the new data
//         const updatedMeeting = await MeetingBase.findByIdAndUpdate(meetingId, updatedData, {
//             new: true, // Return the updated document
//             runValidators: true // Ensure schema validation rules are respected
//         });

//         // Check if the meeting was found and updated
//         if (!updatedMeeting) {
//             return res.status(404).json({ message: "Meeting not found" });
//         }

//         // Update the meeting reference in the meeting owner's profile or enterprise
//         try {
//             var ownerProfileOrEnterprise = await Profile.findById(updatedMeeting.meetingOwner)
//                 || await enterprise.findById(updatedMeeting.meetingOwner);

//             if (ownerProfileOrEnterprise) {
//                 await ownerProfileOrEnterprise.updateOne(
//                     { $addToSet: { meetings: updatedMeeting._id } }, // Ensure no duplicate meeting IDs
//                     { new: true }
//                 );
//             } else {
//                 console.log(`No profile or enterprise found for meeting owner ID: ${updatedMeeting.meetingOwner}`);
//             }
//         } catch (error) {
//             console.error(`Error updating profile or enterprise for meeting owner ID: ${updatedMeeting.meetingOwner}`, error);
//         }

//         // Update each invited user's profile or enterprise to include the meeting ID
//         await Promise.all(
//             updatedMeeting.invitedPeople.map(async ({user}) => {
//               const userId = user.toString()
//                 try {
//                     let updatedProfileOrEnterprise = await Profile.findById(userId)
//                         || await enterprise.findById(userId);

//                         console.log(updatedProfileOrEnterprise)
//                     if (updatedProfileOrEnterprise) {
//                         await updatedProfileOrEnterprise.updateOne(
//                             { $addToSet: { meetings: updatedMeeting._id } }, // Ensure no duplicate meeting IDs
//                             { new: true }
//                         );

//                         // const ownerName = ownerProfileOrEnterprise.username || ownerProfileOrEnterprise.companyName || "Unknown";

//                         // const content =  `You have been invited to a meeting titled "${updatedMeeting.meetingTitle}" on ${updatedMeeting.selectedDate} at ${updatedMeeting.startTime} by ${ownerName} .`

//                         // const notification = new Notification({
//                         //     sender: updatedData.meetingOwner,
//                         //     receiver: userId,
//                         //     type: 'meeting',
//                         //     content: content,
//                         //     status: 'unread'
//                         // });
//                         // await notification.save();

//                         // emitNotification(userId.toString(), notification); // Emit real-time notification

//                     } else {
//                         console.log(`No profile or enterprise found with ID: ${userId}`);
//                     }
//                 } catch (error) {
//                     console.error(`Error updating profile or enterprise for user ID: ${userId}`, error);
//                 }
//             })
//         );

//         // Return the updated meeting information
//         return res.status(200).json({ data: updatedMeeting, success: true, message: "Successfully updated" });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Failed to update meeting", error: error.message });
//     }
// };
const UpdateMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params; // Get the meeting ID from request parameters
    const updatedData = req.body; // Get the updated meeting data from the request body

    // If there are invitedPeople in the updated data, reset their status to "pending"
    if (updatedData.invitedPeople) {
      updatedData.invitedPeople = updatedData.invitedPeople.map((user) => ({
        user,
        status: "pending",
      }));
    }

    // Find the meeting by ID and update it with the new data
    const updatedMeeting = await MeetingBase.findByIdAndUpdate(
      meetingId,
      updatedData,
      {
        new: true, // Return the updated document after modification
        runValidators: true, // Ensure schema validation rules are respected
      }
    );

    // If the meeting is not found, return a 404 response
    if (!updatedMeeting) {
      return res.status(404).json({ message: "Meeting not found" });
    }

    // Update the meeting reference in the meeting owner's profile, enterprise, or individualUserCollection
    try {
      // Look for the meeting owner in Profile, Enterprise, or individualUserCollection
      var ownerProfileOrEnterprise =
        (await Profile.findById(updatedMeeting.meetingOwner)) ||
        (await enterprise.findById(updatedMeeting.meetingOwner)) ||
        (await individualUserCollection.findById(updatedMeeting.meetingOwner));

      // If the meeting owner is found, update their meetings array
      if (ownerProfileOrEnterprise) {
        await ownerProfileOrEnterprise.updateOne(
          { $addToSet: { meetings: updatedMeeting._id } }, // Add the meeting ID only if it does not already exist
          { new: true }
        );
      } else {
        console.log(
          `No profile, enterprise, or individual user found for meeting owner ID: ${updatedMeeting.meetingOwner}`
        );
      }
    } catch (error) {
      console.error(
        `Error updating profile, enterprise, or individual user for meeting owner ID: ${updatedMeeting.meetingOwner}`,
        error
      );
    }

    // Update each invited user's profile, enterprise, or individualUserCollection to include the meeting ID
    await Promise.all(
      updatedMeeting.invitedPeople.map(async ({ user }) => {
        const userId = user.toString(); // Convert the user ID to a string for consistency
        try {
          // Look for the invited user in Profile, Enterprise, or individualUserCollection
          let updatedProfileOrEnterprise =
            (await Profile.findById(userId)) ||
            (await enterprise.findById(userId)) ||
            (await individualUserCollection.findById(userId));

          // If the user is found, update their meetings array
          if (updatedProfileOrEnterprise) {
            await updatedProfileOrEnterprise.updateOne(
              { $addToSet: { meetings: updatedMeeting._id } }, // Add the meeting ID only if it does not already exist
              { new: true }
            );

            // Uncomment the below section to create and emit a notification for the invited user
            /*
                      const ownerName = ownerProfileOrEnterprise.username || ownerProfileOrEnterprise.companyName || "Unknown";

                      const content = `You have been invited to a meeting titled "${updatedMeeting.meetingTitle}" on ${updatedMeeting.selectedDate} at ${updatedMeeting.startTime} by ${ownerName}.`;

                      const notification = new Notification({
                          sender: updatedMeeting.meetingOwner,
                          receiver: userId,
                          type: 'meeting',
                          content: content,
                          status: 'unread'
                      });
                      await notification.save();

                      emitNotification(userId.toString(), notification); // Emit real-time notification
                      */
          } else {
            console.log(
              `No profile, enterprise, or individual user found with ID: ${userId}`
            );
          }
        } catch (error) {
          console.error(
            `Error updating profile, enterprise, or individual user for user ID: ${userId}`,
            error
          );
        }
      })
    );

    // Return the updated meeting information
    return res
      .status(200)
      .json({
        data: updatedMeeting,
        success: true,
        message: "Successfully updated",
      });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Failed to update meeting", error: error.message });
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
