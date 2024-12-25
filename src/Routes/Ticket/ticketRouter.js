const express = require('express');
const router = express.Router();
const ticketController = require('../../Controller/Ticket/ticketController');

// Routes for tickets
router.post('/', ticketController.createTicket);
router.get('/', ticketController.getAllTickets);
router.get('/stats/', ticketController.getAllStats)
router.get('/:id', ticketController.getTicketById);
router.put('/:id', ticketController.updateTicket);
router.patch('/:id', ticketController.updateTicket);
router.delete('/:id', ticketController.deleteTicket);
router.get('/stats', ticketController.getAllStats)
// // PUT route to add a user ID to assignedTo
// router.put('/:id/assign', ticketController.assignUser);


module.exports = router;
