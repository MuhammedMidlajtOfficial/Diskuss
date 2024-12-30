const express = require('express');
const router = express.Router();
const ticketController = require('../../Controller/Ticket/ticketController');

// Routes for tickets
router.get('/', ticketController.getAllTickets);
router.get('/stats', ticketController.getAllStats)
router.get('/getOpenTicket', ticketController.getOpenTicket);
router.get('/:id', ticketController.getTicketById);

router.post('/', ticketController.createTicket);

router.put('/:id', ticketController.updateTicket);

router.patch('/assignUser', ticketController.assignUser);
router.patch('/replay', ticketController.replay);

router.delete('/:id', ticketController.deleteTicket);


module.exports = router;
