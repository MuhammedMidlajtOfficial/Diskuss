

const express = require("express");
const router = express.Router();
const {CreateMeeting, getUpcomingMeetings,deleteMeeting,getMeetingsByIds,meetingList} = require("../../Controller/Meeting/Meeting");

router.post("/Create-Meeting", CreateMeeting); // This should handle POST requests
 // http://localhost:3000/api/v1/meeting/Create-Meeting

router.get('/upcoming/:userId', getUpcomingMeetings);
 // http://localhost:3000/api/v1/meeting/upcoming/603d2c0d5f1b2b3f8c4b7e1b

// Route for deleting a meeting
router.delete('/:meetingId', deleteMeeting); 
 // http://localhost:3000/api/v1/meeting/6721d27a974599b7535c33fa

router.post('/get-meeting/:userId', getMeetingsByIds);  
 // http://localhost:3000/api/v1/meeting/get-meeting

router.post('/get-meeting-list/:userId', meetingList);  



module.exports = router;