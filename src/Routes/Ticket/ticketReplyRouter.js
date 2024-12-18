const express = require('express');
const router = express.Router();
const ticketReplyController = require('../../Controller/Ticket/ticketReplyController');

// Routes for ticket replies
router.post('/', ticketReplyController.createReply);
router.get('/:ticketId', ticketReplyController.getRepliesByTicketId);

module.exports = router;
