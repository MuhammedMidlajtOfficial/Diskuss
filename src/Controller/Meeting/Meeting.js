const MeetingBase = require("../../models/MeetingModel")
const moment = require('moment');
const cron = require('node-cron');
const Profile = require('../../models/profile')
const mongoose = require("mongoose");
const Contact = require('../../models/contact.model')









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

        try {
            const ownerProfile = await Profile.findOneAndUpdate(
                { userId: meetingOwner },
                { $push: { meetings: savedMeeting._id } },
                { new: true }
            ).exec();

            if (!ownerProfile) {
                console.log(`No profile found for meeting owner ID: ${meetingOwnerId}`);
            }
        } catch (error) {
            console.error(`Error updating profile for meeting owner ID: ${meetingOwnerId}`, error);
        }

        // Update each invited user's profile to include the meeting ID
        await Promise.all(
            invitedPeople.map(async (userId) => {
                try {
                    
                    const userIdString = userId.toString(); // Convert to string
                    console.log(`Updating profile for user ID: ${userIdString}`);
                 
                    const updatedProfile = await Profile.findOneAndUpdate(
                        { userId: userIdString },
                        { $push: { meetings: savedMeeting._id } },
                        { new: true }
                    ).exec();
                    
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



        


          

    


const getUpcomingMeetings = async (req, res) => {
    const { userId } = req.params; // Get the user ID from the request parameters

    try {
        // Get the current date and time
        const currentDateTime = moment();

        // Find all upcoming meetings organized by the user
        const upcomingMeetings = await MeetingBase.find({
            meetingOwner: userId, // Filter by user ID
            // selectedDate: { $gte: currentDateTime.toDate() } // Filter for upcoming meetings for today
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





const getMeetingsByIds = async (req, res) => {
    // const { meetingIds } = req.body; // Assuming an array of meeting IDs is provided in the request body

    try {
        const { userId } = req.params;
      
        
        // Find the user's profile
        console.log(userId);
        
        const userInfo = await Profile.findOne({ userId }).populate('meetings'); // Populate meetings directly if referenced in schema
        console.log(userInfo);
        
        // Extract meeting IDs
        const meetingIds = userInfo.meetings.map(meeting => meeting._id);
        // Filter out invalid ObjectIds from the provided meetingIds array
        // const validMeetingIds = meetingIds.filter(id => mongoose.Types.ObjectId.isValid(id));

        // Find meetings that match the valid IDs
        const meetings = await MeetingBase.find({ _id: { $in: meetingIds } });

        // Check if there are any found meetings
        if (meetings.length === 0) {
            return res.status(404).json({ message: "No meetings found for the provided IDs." });
        }

// Extract invited people's IDs from the meetings
        const invitedPeopleIds = meetings.flatMap(meeting => meeting.invitedPeople);

        // Fetch user profiles based on invited people IDs
        const invitedProfiles = await Profile.find({ userId: { $in: invitedPeopleIds } });

        // Create a map for easy access to profiles by ID
        const profilesMap = invitedProfiles.reduce((acc, profile) => {
            acc[profile.userId] = profile; // Assuming profile has a unique _id
            return acc;
        }, {});

        // Augment meetings with invited people's profiles
        const enrichedMeetings = meetings.map(meeting => {
            const invitedInfo = meeting.invitedPeople.map(id => profilesMap[id] || null); // Map to user profiles or null if not found
            return {
                ...meeting.toObject(), // Convert mongoose document to plain object
                invitedInfo // Add invitedInfo array
            };
        });

        // Return the enriched meetings
        return res.status(200).json({ meetings: enrichedMeetings });

    } catch (error) {
        console.error("Error fetching meetings by IDs:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};


const contects = async (req, res) => {
    try {
        // Assuming the user ID is available in req.user (after authentication)
        const userId = req.user._id; // Adjust according to your authentication setup

        // Fetch all contacts associated with the user
        const contacts = await Contact.find({ contactOwnerId: userId });

        // Send the contacts in the response
        res.status(200).json({
            success: true,
            data: contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching contacts.',
            error: error.message
        });
    }
};


const deleteMeeting = async (req, res) => {
    const { meetingId } = req.params; // Get the meeting ID from the request parameters

    try {
        // Find and delete the meeting by ID
        const deletedMeeting = await MeetingBase.findByIdAndDelete(meetingId);

        // Check if the meeting was found and deleted
        if (!deletedMeeting) {
            return res.status(404).json({ message: "Meeting not found." });
        }

        return res.status(200).json({ message: "Meeting deleted successfully.", meeting: deletedMeeting });
    } catch (error) {
        console.error("Error deleting meeting:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};





const meetingList = async (req, res) => {
        try {
            const { userId } = req.params;
    
            // Find the user's profile
            const userInfo = await Profile.findOne({ userId }).populate('meetings'); // Populate meetings directly if referenced in schema
    
            // Extract meeting IDs
            const meetingIds = userInfo.meetings.map(meeting => meeting._id);
    
            // Find all meetings based on extracted IDs
            // const meetingDetails = await MeetingBase.find({ _id: { $in: meetingIds } });
    
            // Send response with user info and full meeting details
            res.status(200).send({ info: userInfo, meetingsIds:meetingIds });


        } catch (error) {
            console.error("Error fetching meetings:", error);
            res.status(500).send({ error: "Failed to retrieve meeting information" });
        }
    };

    




// Schedule the cron job to run every minute
cron.schedule('* * * * *', async () => {
    try {
        const currentTime = new Date();
        

        // Fetch all meetings from the database
        const meetings = await MeetingBase.find({});

        for (const meeting of meetings) {
            // Combine `selectedDate` and `endTime` to create a full `meetingEndDateTime`
            const meetingEndDateTime = moment(
                `${meeting.selectedDate.toISOString().split('T')[0]} ${meeting.endTime}`,
                "YYYY-MM-DD hh:mm A"
            ).toDate();

            

            // Check if the `meetingEndDateTime` is before `currentTime`
            if (meetingEndDateTime < currentTime) {
                // Delete the expired meeting
                await MeetingBase.deleteOne({ _id: meeting._id });
                
            } else {
                
            }
        }
    } catch (error) {
        console.error('Error deleting expired meetings:', error);
    }
});














module.exports = { CreateMeeting ,getUpcomingMeetings,deleteMeeting,getMeetingsByIds,meetingList};

