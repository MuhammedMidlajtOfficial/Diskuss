// Meeting Router
const express = require("express");
const router = express.Router();
const {CreateMeeting, getUpcomingMeetings,deleteMeeting,getMeetingsByIds,UpdateMeeting,updateMeetingStatus} = require("../../Controller/Meeting/Meeting");

// Route for creating a meeting
router.post("/Create-Meeting", CreateMeeting); // This should handle POST requests
 // http://localhost:3000/api/v1/meeting/Create-Meeting

 // Route for geeting a meeting
router.get('/upcoming/:userId', getUpcomingMeetings);
 // http://localhost:3000/api/v1/meeting/upcoming/603d2c0d5f1b2b3f8c4b7e1b

// Route for deleting a meeting
router.delete('/:meetingId', deleteMeeting); 
 // http://localhost:3000/api/v1/meeting/6721d27a974599b7535c33fa

 // Route for get meeting info by id a meeting
router.get('/get-meeting/:userId', getMeetingsByIds);  
 // http://localhost:3000/api/v1/meeting/get-meeting/6721d27a974599b7535c33fa

 // Route for Update  a meeting
router.put('/update-meeting/:meetingId', UpdateMeeting);  
 // http://localhost:3000/api/v1/meeting/update-meeting/6721d27a974599b7535c33fa

 router.patch('/update-meeting-status', updateMeetingStatus);  
 // http://localhost:3000/api/v1/meeting/update-meeting/6721d27a974599b7535c33fa



module.exports = router;