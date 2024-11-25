const MeetingBase = require("../../models/MeetingModel")
const moment = require('moment');
const cron = require('node-cron');
const {individualUserCollection: Profile} = require('../../models/individualUser')
const mongoose = require("mongoose");
const Contact = require('../../models/contact.individul.model')
const Notification = require('../../models/NotificationModel')
const { emitNotification } = require('../../Controller/Socket.io/NotificationSocketIo');




// CreateMeeting controller 
const CreateMeeting = async (req, res) => {
    try {
        const {
            meetingOwner,
            meetingTitle,
            type, // 'online' or 'offline'
            selectedDate,
            startTime,
            endTime,
            invitedPeople,
            description,
            isRemind,
            meetingPlatform, // Only for online
            meetingLink, // Only for online
            meetingPlace, // Only for offline
            roomNo, // Only for offline
            cabinNo // Only for offline
        } = req.body;

        // Validate the required fields
        if (!meetingTitle || !selectedDate || !startTime || !endTime || !invitedPeople) {
            return res.status(400).json({ message: "Meeting title, date, start time, end time, and invited people are required." });
        }

        // Create a new meeting object
        const newMeetingData = {
            meetingOwner,
            meetingTitle,
            type,
            selectedDate,
            startTime,
            endTime,
            invitedPeople :invitedPeople.map(user => ({ user, status: "pending" })),
            description,
            isRemind
        };

        console.log(newMeetingData);
        
        // Add online or offline-specific fields
        if (type === 'online') {
            if (!meetingPlatform || !meetingLink) {
                return res.status(400).json({ message: "Meeting platform and meeting link are required for online meetings." });
            }
            newMeetingData.meetingPlatform = meetingPlatform;
            newMeetingData.meetingLink = meetingLink;
        } else if (type === 'offline') {
            if (!meetingPlace || !roomNo) {
                return res.status(400).json({ message: "Meeting place and room number are required for offline meetings." });
            }
            newMeetingData.meetingPlace = meetingPlace;
            newMeetingData.roomNo = roomNo;
            newMeetingData.cabinNo = cabinNo; // Optional
        } else {
            return res.status(400).json({ message: "Invalid meeting type. Please specify 'online' or 'offline'." });
        }

        // Save the new meeting
        const newMeeting = new MeetingBase(newMeetingData);
        const savedMeeting = await newMeeting.save();
        //  console.log(meetingOwner);
         
        try {
            var ownerProfile = await Profile.findOneAndUpdate(
                { _id: meetingOwner },
                { $push: { meetings: savedMeeting._id } },
                { new: true }
            ).exec();
            console.log("from line 77",ownerProfile);
            

            if (!ownerProfile) {
                console.log(`No profile found for meeting owner ID: ${meetingOwner}`);
            }
        } catch (error) {
            console.error(`Error updating profile for meeting owner ID: ${meetingOwner}`, error);
        }

        // Update each invited user's profile to include the meeting ID
        await Promise.all(
            invitedPeople.map(async (userId) => {
                try {
                    
                    const userIdString = userId.toString(); // Convert to string
                    console.log(`Updating profile for user ID: ${userIdString}`);
                 
                    const updatedProfile = await Profile.findOneAndUpdate(
                        { _id: userIdString },
                        { $push: { meetings: savedMeeting._id } },
                        { new: true }
                    ).exec();

                      // Create a notification for each invited person
                   const notification = new Notification({
                    sender: meetingOwner,
                    receiver: userId,
                    type: 'meeting',
                    content: `You have been invited to a meeting titled "${meetingTitle}" on ${selectedDate} at ${startTime} created by ${ownerProfile.username}.`,
                    status: 'unread'
                });
                await notification.save();

                emitNotification(userId.toString(), notification); // Emit real-time notification
                    
                    if (!updatedProfile) {
                        console.log(`No profile found with ID: ${userId}`);
                    }
                } catch (error) {
                    console.error(`Error updating profile for user ID: ${userId}`, error);
                }
            })
        );

        
       

        return res.status(201).json({ message: "Meeting created successfully.", meeting: savedMeeting });
    } catch (error) {
        console.error("Error creating meeting:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};


const updateMeetingStatus = async (req, res) => {
    const { meetingId, userId, status, reason } = req.body;

    try {
        // Validate input
        if (!meetingId || !userId || !status) {
            return res.status(400).json({ message: "Meeting ID, User ID, and status are required." });
        }

        if (!['pending', 'accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: "Invalid status. Valid options are 'pending', 'accepted', or 'rejected'." });
        }

        if (status === 'rejected' && !reason) {
            return res.status(400).json({ message: "Reason is required for rejection." });
        }

        // Update the meeting status for the user
        const updatedMeeting = await MeetingBase.findOneAndUpdate(
            { _id: meetingId, "invitedPeople.user": userId },
            {
                $set: {
                    "invitedPeople.$.status": status,
                    ...(status === 'rejected' || (status === 'accepted' && reason) 
                        ? { "invitedPeople.$.reason": reason } 
                        : {})
                }
            },
            { new: true }
        );

        if (!updatedMeeting) {
            return res.status(404).json({ message: "Meeting or user not found." });
        }

        // Notify the meeting owner about the user's decision
        const meetingOwner = updatedMeeting.meetingOwner;
        const meetingTitle = updatedMeeting.meetingTitle;
        const decision = status === 'accepted' ? "accepted" : "rejected";
        const notificationContent = `User ${userId} has ${decision} your meeting titled "${meetingTitle}".`;

        res.status(200).json({
            message: `Meeting status updated to '${status}' successfully.`,
            meeting: updatedMeeting
        });
    } catch (error) {
        console.error("Error updating meeting status:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};









        
// getUpcoming controller and its take req.params //
const getUpcomingMeetings = async (req, res) => {
    const { userId } = req.params; // Get the user ID from the request parameters

    try {
        // Get the current date and time
        const currentDateTime = moment();

        // Find all upcoming meetings organized by the user
        const upcomingMeetings = await MeetingBase.find({
            meetingOwner: userId, // Filter by user ID
            selectedDate: { $gte: currentDateTime.toDate() } // Filter for upcoming meetings for today
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
}


// get meeting by ids  //
// const getMeetingsByIds = async (req, res) => {
//     try {
//         const { userId } = req.params; // Extract userId from request parameters
//         //  console.log(userId);
         
//         // Find the user's profile by userId and populate meetings if referenced in schema
//         // console.log(userId);
//         const userInfo = await Profile.findOne({ _id:userId }).populate({
//             path:'meetings',
//             strictPopulate: false, 
//         });
     
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
//         const invitedProfiles = await Profile.find({ _id: { $in: invitedPeopleIds } });
//         // console.log(ownerProfiles);
//         // console.log(invitedProfiles);
        
//         // Create a map for easy lookup of profiles by userId
//         const profilesMap = [...ownerProfiles, ...invitedProfiles].reduce((acc, profile) => {
//             acc[profile._id] = {
  
//                 username: profile.username,
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
const getMeetingsByIds = async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Fetch user profile from Profile or Enterprise collection
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
        return res.status(404).json({ message: "User profile not found." });
      }
  
      // Extract meeting IDs
      const meetingIds = userInfo.meetings?.map((meeting) => meeting._id);
  
      // Get today's date with time reset to 00:00:00
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      // Fetch meetings for today or in the future
      const meetings = await MeetingBase.find({
        _id: { $in: meetingIds },
        selectedDate: { $gte: today },
      });
  
      if (meetings.length === 0) {
        return res.status(200).json({ meetings: [] });
      }
  
      // Extract IDs for meeting owners and invited users
      const meetingOwnerIds = meetings.map((meeting) => meeting.meetingOwner);
      const invitedPeopleIds = meetings.flatMap((meeting) =>
        meeting.invitedPeople.map((invitee) => invitee.user)
      );
  
      // Fetch profiles of meeting owners and invited users
      const [ownerProfiles, invitedProfiles] = await Promise.all([
        Profile.find({ _id: { $in: meetingOwnerIds } }),
        Profile.find({ _id: { $in: invitedPeopleIds } }),
      ]);
  
      
  
      // Create a unified profile map for fast lookups
      const profilesMap = [
        ...ownerProfiles,
        ...invitedProfiles,
      ].reduce((map, profile) => {
        map[profile._id] = {
          username: profile.username,
          email: profile.email,
          image: profile.image || "",
          userId: profile._id,
        };
        return map;
      }, {});
  
      // Enrich meetings with owner and invited user info
      const enrichedMeetings = meetings.map((meeting) => {
        const meetingOwnerInfo = profilesMap[meeting.meetingOwner] || null;
  
        // Map invited people with detailed info
        const invitedInfo = meeting.invitedPeople.map((invitee) => ({
          ...profilesMap[invitee.user],
          status: invitee.status,
          reason: invitee.reason || null,
        }));
  
        return {
          ...meeting.toObject(),
          meetingOwnerInfo,
          invitedInfo,
        };
      });
  
      // Send enriched meetings
      return res.status(200).json({ meetings: enrichedMeetings.reverse() });
    } catch (error) {
      console.error("Error fetching meetings by IDs:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  };
  
 
  





// delete meeting ny meeting id
// const deleteMeeting = async (req, res) => {
//     const { meetingId } = req.params; // Get the meeting ID from the request parameters

//     try {
//         // Find and delete the meeting by ID
//         const meetingToDelete = await MeetingBase.findById(meetingId);
//         console.log(meetingToDelete);
//         const { meetingOwner, invitedPeople } = meetingToDelete;
//          console.log(meetingOwner,invitedPeople);
         


//         // Check if the meeting was found and deleted
//         if (!meetingToDelete) {
//             return res.status(404).json({ message: "Meeting not found." });
//         }

//           // Delete the meeting
//           await MeetingBase.findByIdAndDelete(meetingId);

//           // Remove the meeting ID from the meetingOwner's Profile document
//           await Profile.updateOne(
//               { userId: meetingOwner },
//               { $pull: { meetings: meetingId } }
//           );
  
//           // Remove the meeting ID from each invited user's Profile document
//           await Profile.updateMany(
//               { userId: { $in: invitedPeople } },
//               { $pull: { meetings: meetingId } }
//           );

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

        const invitedUserIds = invitedPeople.map(person => person.user);
        
        // Log the meeting details
        // console.log("Meeting found:", meetingToDelete);
        // console.log("Meeting Owner ID:", meetingOwner);
        // console.log("Invited People IDs:", invitedPeople);

        // Delete the meeting
        await MeetingBase.findByIdAndDelete(meetingId);

        // Remove the meeting ID from the meetingOwner's Profile document
      const newData =  await Profile.updateOne(
            { _id: meetingOwner },
            { $pull: { meetings: meetingId } }
        );

        // console.log(newData);
        

        // Remove the meeting ID from each invited user's Profile document
        const result = await Profile.updateMany(
            { _id: { $in: invitedUserIds } },
            { $pull: { meetings: meetingId } }
        );

        // console.log(result);

        // Log the update result for confirmation
        console.log(`Removed meeting ID from ${result.nModified} invited users' meeting lists`);

        return res.status(200).json({ message: "Meeting deleted successfully.", meeting: meetingToDelete });
    } catch (error) {
        console.error("Error deleting meeting:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};










//update meeting by meeting id
// const UpdateMeeting = async (req, res) => {
//     try {
//       const {meetingId} = req.params; // Get meeting ID from request parameters
//       const updatedData = req.body; // Get updated meeting data from request body
//         // console.log(updatedData);
        
//       // Find the meeting by ID and update it with the new data
//       const updatedMeeting = await MeetingBase.findByIdAndUpdate(meetingId, updatedData, {
//         new: true, // Return the updated document
//         runValidators: true // Ensure the schema validation rules are respected
//       });
  
//       // Check if the meeting was found and updated
//       if (!updatedMeeting) {
//         return res.status(404).json({ message: "Meeting not found" });
//       }
  
//       // Return the updated meeting information
//       res.status(200).json({data:updatedMeeting,sucess:true,message:"sucessfully updated"});
//     } catch (error) {
//       // Handle errors, such as database connection issues or validation errors
//       console.error(error);
//       res.status(500).json({ message: "Failed to update meeting", error: error.message });
//     }
//   };

// const UpdateMeeting = async (req, res) => {
//     try {
//         const { meetingId } = req.params; // Get meeting ID from request parameters
//         const updatedData = req.body; // Get updated meeting data from request body

//         // Find the meeting by ID and update it with the new data
//         const updatedMeeting = await MeetingBase.findByIdAndUpdate(meetingId, updatedData, {
//             new: true, // Return the updated document
//             runValidators: true // Ensure the schema validation rules are respected
//         });

//         // Check if the meeting was found and updated
//         if (!updatedMeeting) {
//             return res.status(404).json({ message: "Meeting not found" });
//         }

//         // Update the meeting reference in the meeting owner's profile
//         try {
//             var ownerProfile = await Profile.findOneAndUpdate(
//                 { _id: updatedMeeting.meetingOwner },
//                 { $addToSet: { meetings: updatedMeeting._id } }, // Ensures no duplicate meeting IDs
//                 { new: true }
//             ).exec();

//             if (!ownerProfile) {
//                 console.log(`No profile found for meeting owner ID: ${updatedMeeting.meetingOwner}`);
//             }
//         } catch (error) {
//             console.error(`Error updating profile for meeting owner ID: ${updatedMeeting.meetingOwner}`, error);
//         }

//         // Update each invited user's profile to include the meeting ID
//         await Promise.all(
//             updatedMeeting.invitedPeople.map(async (userId) => {
//                 try {
//                     const updatedProfile = await Profile.findOneAndUpdate(
//                         { _id: userId },
//                         { $addToSet: { meetings: updatedMeeting._id } }, // Ensures no duplicate meeting IDs
//                         { new: true }
//                     ).exec();

//                     const notification = new Notification({
//                         sender:updatedData.meetingOwner,
//                         receiver: userId,
//                         type: 'meeting',
//                         content: `You have been invited to a meeting titled "${updatedMeeting.meetingTitle}" on ${updatedMeeting.selectedDate} at ${updatedMeeting.startTime} created by ${ownerProfile.username}.`,
//                         status: 'unread'
//                     });
//                     await notification.save();
//                     emitNotification(userId.toString(), notification);

//                     if (!updatedProfile) {
//                         console.log(`No profile found with ID: ${userId}`);
//                     }
//                 } catch (error) {
//                     console.error(`Error updating profile for user ID: ${userId}`, error);
//                 }
//             })
//         );

//         // Return the updated meeting information
//         return res.status(200).json({ data: updatedMeeting, success: true, message: "Successfully updated" });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Failed to update meeting", error: error.message });
//     }
//   };

const UpdateMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params; // Get meeting ID from request parameters
        const updatedData = req.body; // Get updated meeting data from request body

        // Ensure `invitedPeople` follows the structure with `user` and `status`
        if (updatedData.invitedPeople) {
            updatedData.invitedPeople = updatedData.invitedPeople.map(user => ({ user, status: "pending" }));
        }

        // Find the meeting by ID and update it with the new data
        const updatedMeeting = await MeetingBase.findByIdAndUpdate(meetingId, updatedData, {
            new: true, // Return the updated document
            runValidators: true, // Ensure the schema validation rules are respected
        });

        if (!updatedMeeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        // Update the meeting reference in the meeting owner's profile
        try {
            var ownerProfile = await Profile.findOneAndUpdate(
                { _id: updatedMeeting.meetingOwner },
                { $addToSet: { meetings: updatedMeeting._id } }, // Ensures no duplicate meeting IDs
                { new: true }
            ).exec();

            if (!ownerProfile) {
                console.log(`No profile found for meeting owner ID: ${updatedMeeting.meetingOwner}`);
            }
        } catch (error) {
            console.error(`Error updating profile for meeting owner ID: ${updatedMeeting.meetingOwner}`, error);
        }

        // Notify and update each invited user's profile
        await Promise.all(
            updatedMeeting.invitedPeople.map(async ({ user }) => {
                try {
                    const userId = user.toString();
                    console.log(`Processing invited user: ${userId}`);

                    // Update user profile
                    const updatedProfile = await Profile.findOneAndUpdate(
                        { _id: userId },
                        { $addToSet: { meetings: updatedMeeting._id } },
                        { new: true }
                    ).exec();

                    // Create notification
                    const notification = new Notification({
                        sender: updatedMeeting.meetingOwner,
                        receiver: userId,
                        type: "meeting",
                        content: `The meeting titled "${updatedMeeting.meetingTitle}" scheduled for ${updatedMeeting.selectedDate} at ${updatedMeeting.startTime} has been updated by ${ownerProfile?.username || "the owner"}.`,
                        status: "unread",
                    });

                    await notification.save();
                    emitNotification(userId, notification);

                    if (!updatedProfile) {
                        console.log(`No profile found for invited user ID: ${userId}`);
                    }
                } catch (error) {
                    console.error(`Error updating invited user profile for user ID: ${user}`, error);
                }
            })
        );

        return res.status(200).json({ data: updatedMeeting, success: true, message: "Successfully updated meeting" });
    } catch (error) {
        console.error("Error updating meeting:", error);
        return res.status(500).json({ message: "Failed to update meeting", error: error.message });
    }
};





    




// Schedule the cron job to run every minute









module.exports = { CreateMeeting ,getUpcomingMeetings,deleteMeeting,getMeetingsByIds,UpdateMeeting,updateMeetingStatus};

