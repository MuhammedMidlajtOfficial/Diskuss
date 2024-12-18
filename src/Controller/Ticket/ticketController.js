const TicketService = require('../../services/Ticket/ticket.service');


exports.createTicket = async (req, res) => {
    try {
        const newTicket = await TicketService.create(req.body);
        res.status(201).json(newTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllTickets = async (req, res) => {
    const { page, limit, noPagination } = req.query;
    
    try {
        const tickets = await TicketService.getAll(page, limit, noPagination);
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await TicketService.getById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTicket = async (req, res) => {
    try {
        const updatedTicket = await TicketService.update(req.params.id, req.body);
        if (!updatedTicket) return res.status(404).json({ message: 'Ticket not found' });
        res.status(200).json(updatedTicket);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const deletedTicket = await TicketService.delete(req.params.id);
        if (!deletedTicket) return res.status(404).json({ message: 'Ticket not found' });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
