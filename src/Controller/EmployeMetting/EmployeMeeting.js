const MeetingBase = require("../../models/EnterpriseMeetingModel")
const moment = require('moment');
const cron = require('node-cron');
const Profile = require('../../models/enterpriseEmploye.model')
const enterprise = require('../../models/enterpriseUser')

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
            invitedPeople,
            description,
            isRemind
        };

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

        // Update the meeting owner
        const ownerProfile = await Profile.findById(meetingOwner) || await enterprise.findById(meetingOwner);

        if (ownerProfile) {
            await ownerProfile.updateOne({ $push: { meetings: savedMeeting._id } });
        } else {
            return res.status(400).json({ message: `No user found with ID: ${meetingOwner}` });
        }

        // Update each invited user's profile
        await Promise.all(
            invitedPeople.map(async (userId) => {
                

           
                let invitedUserProfile = await Profile.findById(userId) || enterprise.findById(userId);
                

                if (invitedUserProfile) {
                    await invitedUserProfile.updateOne({ $push: { meetings: savedMeeting._id } });

                    // Create a notification for the invited user
                    const ownerName = ownerProfile.username || ownerProfile.companyName || "Unknown";

                 // Create the notification content dynamically based on the available information
                   const notificationContent = `You have been invited to a meeting titled "${meetingTitle}" on ${selectedDate} at ${startTime} created by ${ownerName}.`;

                  // Create a notification for the invited user
                   const notification = new Notification({
                      sender: meetingOwner,
                      receiver: userId,
                        type: 'meeting',
                       content: notificationContent,
                      status: 'unread'
                     });
                    await notification.save();

                    
                    

                    // Emit notification
                    emitNotification(userId, notification);
                }
            })
        );

        return res.status(201).json({ message: "Meeting created successfully.", meeting: savedMeeting });
    } catch (error) {
        console.error("Error creating meeting:", error);
        return res.status(500).json({ message: "Internal server error." });
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
const getMeetingsByIds = async (req, res) => {
    try {
        const { userId } = req.params; // Extract userId from request parameters
        //  console.log(userId);
         
        // Find the user's profile by userId and populate meetings if referenced in schema
        // console.log(userId);
        let userInfo = await Profile.findById(userId).populate({
            path: 'meetings',
            strictPopulate: false, 
        });

        // If not found in Profile collection, check in the enterprise collection
        if (!userInfo) {
            userInfo = await enterprise.findById(userId).populate({
                path: 'meetings',
                strictPopulate: false, 
            });
        }
     
        //  console.log("user info from line no 167",userInfo);
         console.log('userInfo',userInfo);
        // If user profile not found, return an error
        if (!userInfo) {
            return res.status(404).json({ message: "User profile not found." });
        }

        // Extract meeting IDs from the user's profile
        const meetingIds = userInfo?.meetings?.map(meeting => meeting._id);
        // console.log("meeting ids from line no 176",meetingIds);
        
          // Get the current date and set the time to 00:00:00 for accurate filtering
          const today = new Date();
          today.setHours(0, 0, 0, 0);

        // Find meetings in MeetingBase collection that match the extracted meeting IDs
        // const meetings = await MeetingBase.find({ _id: { $in: meetingIds } });

        const meetings = await MeetingBase.find({ 
            _id: { $in: meetingIds },
            selectedDate: { $gte: today } // Filter meetings where date is today or in the future
        });

        // console.log("meetings from  from line no 167",meetings);

        // If no meetings found, return an error message
        if (meetings.length === 0) {
            return res.status(200).json({ message: [] });
        }

        // Extract meetingOwner IDs and invited people IDs from each meeting
        const meetingOwnerIds = meetings.map(meeting => meeting.meetingOwner);
        const invitedPeopleIds = meetings.flatMap(meeting => meeting.invitedPeople);
        // console.log("from line no 190",meetingOwnerIds);
        // console.log("from line no 190",invitedPeopleIds);
        

        // Fetch profiles of meeting owners and invited people based on their IDs
        const ownerProfiles = await Profile.find({ _id: { $in: meetingOwnerIds } });
        const invitedProfiles = await Profile.find({ _id: { $in: invitedPeopleIds } });
        // console.log(ownerProfiles);
        // console.log(invitedProfiles);
          // Additionally check enterprise collection for invited people if needed
          const additionalInvitedProfiles = await enterprise.find({ _id: { $in: invitedPeopleIds } });
        
        // Create a map for easy lookup of profiles by userId
        const profilesMap = [...ownerProfiles, ...invitedProfiles,...additionalInvitedProfiles].reduce((acc, profile) => {
            acc[profile._id] = {
  
                username: profile.username || profile.companyName,
                email: profile.email,
                image: profile.image,
                userId:profile._id
            };; // Store each profile by its userId
            return acc;
        }, {});

        // Enrich each meeting with the meeting owner's profile and invited people's profiles
        const enrichedMeetings = meetings.map(meeting => {
            const meetingOwnerInfo = profilesMap[meeting.meetingOwner] || null; // Find the meeting owner's profile
            const invitedInfo = meeting.invitedPeople.map(id => profilesMap[id] || null); // Map invited IDs to profiles or null if not found
            return {
                ...meeting.toObject(), // Convert mongoose document to plain object
                meetingOwnerInfo, // Add meeting owner's profile info
                invitedInfo // Add invited people's profile info
            };
        });

        // console.log(enrichedMeetings);
        

        // Send back the enriched meetings as the response
        return res.status(200).json({ meetings: enrichedMeetings.reverse()  });

    } catch (error) {
        console.error("Error fetching meetings by IDs:", error); // Log error details for debugging
        return res.status(500).json({ message: "Internal server error." }); // Return error response for server errors
    }
};







const deleteMeeting = async (req, res) => {
    const { meetingId } = req.params; // Get the meeting ID from the request parameters

    try {
        // Find the meeting by ID
        var meetingToDelete = await MeetingBase.findById(meetingId);

        // Check if the meeting exists
        if (!meetingToDelete) {
            return res.status(404).json({ message: "Meeting not found." });
        }

        const { meetingOwner, invitedPeople } = meetingToDelete;

        // Delete the meeting
        await MeetingBase.findByIdAndDelete(meetingId);

        // Remove the meeting ID from the meeting owner's Profile or Enterprise document
        const ownerUpdated = await Profile.findByIdAndUpdate(
            meetingOwner,
            { $pull: { meetings: meetingId } },
            { new: true }
        ) || await enterprise.findByIdAndUpdate(
            meetingOwner,
            { $pull: { meetings: meetingId } },
            { new: true }
        );

        if (!ownerUpdated) {
            console.log(`No profile or enterprise found for meeting owner ID: ${meetingOwner}`);
        }

        // Remove the meeting ID from each invited user's Profile or Enterprise documents
        await Promise.all(
            invitedPeople.map(async (userId) => {
                try {
                    const userUpdated = await Profile.findByIdAndUpdate(
                        userId,
                        { $pull: { meetings: meetingId } },
                        { new: true }
                    ) || await enterprise.findByIdAndUpdate(
                        userId,
                        { $pull: { meetings: meetingId } },
                        { new: true }
                    );

                    const ownerName = ownerUpdated.username || ownerUpdated.companyName || "Unknown";

                    // Create the notification content dynamically based on the available information
                      const notificationContent = `There are no meetings scheduled for the specified time. The meeting titled '${meetingToDelete.meetingTitle}' scheduled for ${meetingToDelete.selectedDate} at ${meetingToDelete.startTime}, created by ${ownerName}, has been cancelled`;
   
                     // Create a notification for the invited user
                      const notification = new Notification({
                         sender: meetingOwner,
                         receiver: userId,
                           type: 'meeting',
                          content: notificationContent,
                         status: 'unread'
                        });
                       await notification.save();
   
                       

                    if (!userUpdated) {
                        console.log(`No profile or enterprise found for user ID: ${userId}`);
                    }
                } catch (error) {
                    console.error(`Error updating profile or enterprise for user ID: ${userId}`, error);
                }
            })
        );

        // Log confirmation
        console.log("Meeting deleted and references removed successfully.");

        return res.status(200).json({ message: "Meeting deleted successfully.", meeting: meetingToDelete });
    } catch (error) {
        console.error("Error deleting meeting:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};













const UpdateMeeting = async (req, res) => {
    try {
        const { meetingId } = req.params; // Get meeting ID from request parameters
        const updatedData = req.body; // Get updated meeting data from request body

        // Find the meeting by ID and update it with the new data
        const updatedMeeting = await MeetingBase.findByIdAndUpdate(meetingId, updatedData, {
            new: true, // Return the updated document
            runValidators: true // Ensure schema validation rules are respected
        });

        // Check if the meeting was found and updated
        if (!updatedMeeting) {
            return res.status(404).json({ message: "Meeting not found" });
        }

        // Update the meeting reference in the meeting owner's profile or enterprise
        try {
            var ownerProfileOrEnterprise = await Profile.findById(updatedMeeting.meetingOwner)
                || await enterprise.findById(updatedMeeting.meetingOwner);

            if (ownerProfileOrEnterprise) {
                await ownerProfileOrEnterprise.updateOne(
                    { $addToSet: { meetings: updatedMeeting._id } }, // Ensure no duplicate meeting IDs
                    { new: true }
                );
            } else {
                console.log(`No profile or enterprise found for meeting owner ID: ${updatedMeeting.meetingOwner}`);
            }
        } catch (error) {
            console.error(`Error updating profile or enterprise for meeting owner ID: ${updatedMeeting.meetingOwner}`, error);
        }

        // Update each invited user's profile or enterprise to include the meeting ID
        await Promise.all(
            updatedMeeting.invitedPeople.map(async (userId) => {
                try {
                    let updatedProfileOrEnterprise = await Profile.findById(userId) 
                        || await enterprise.findById(userId);

                    if (updatedProfileOrEnterprise) {
                        await updatedProfileOrEnterprise.updateOne(
                            { $addToSet: { meetings: updatedMeeting._id } }, // Ensure no duplicate meeting IDs
                            { new: true }
                        );

                        const ownerName = ownerProfileOrEnterprise.username || ownerProfileOrEnterprise.companyName || "Unknown";

                        const content =  `You have been invited to a meeting titled "${updatedMeeting.meetingTitle}" on ${updatedMeeting.selectedDate} at ${updatedMeeting.startTime} by ${ownerName} .`

                        const notification = new Notification({
                            sender: updatedData.meetingOwner,
                            receiver: userId,
                            type: 'meeting',
                            content: content,
                            status: 'unread'
                        });
                        await notification.save();

                        emitNotification(userId.toString(), notification); // Emit real-time notification
                        
                        
                    } else {
                        console.log(`No profile or enterprise found with ID: ${userId}`);
                    }
                } catch (error) {
                    console.error(`Error updating profile or enterprise for user ID: ${userId}`, error);
                }
            })
        );

        // Return the updated meeting information
        return res.status(200).json({ data: updatedMeeting, success: true, message: "Successfully updated" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to update meeting", error: error.message });
    }
};




    




// Schedule the cron job to run every minute









module.exports = { CreateMeeting ,getUpcomingMeetings,deleteMeeting,getMeetingsByIds,UpdateMeeting};

