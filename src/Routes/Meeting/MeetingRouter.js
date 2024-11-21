

const express = require("express");
const router = express.Router();
const {CreateMeeting, getUpcomingMeetings,deleteMeeting,getMeetingsByIds, updateMeeting, updateInviteStatus} = require("../../Controller/Meeting/Meeting");

router.post("/Create-Meeting", CreateMeeting); // This should handle POST requests
 // http://localhost:3000/api/v1/meeting/Create-Meeting

router.get('/upcoming/:userId', getUpcomingMeetings);
 // http://localhost:3000/api/v1/meeting/upcoming/603d2c0d5f1b2b3f8c4b7e1b

// router.patch('/invitation-status', updateInviteStatus)
router.patch('/:meetingId', updateMeeting)

// Route for deleting a meeting
router.delete('/:meetingId', deleteMeeting); 
 // http://localhost:3000/api/v1/meeting/6721d27a974599b7535c33fa

router.post('/get-meeting', getMeetingsByIds);  
 // http://localhost:3000/api/v1/meeting/get-meeting


router.patch("/:meetingId/invitees/:userId", updateInviteStatus); // This should handle PATCH requests
 // http://localhost:3000/api/v1/meeting/6721d27a974599b7535c33fa/invitees/603d2c0d5f1b2b3f8c4b7e1b
module.exports = router;
