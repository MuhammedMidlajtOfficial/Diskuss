const TicketService = require('../../services/Ticket/ticket.service');

exports.createTicket = async (req, res) => {
    try {
        const newTicket = await TicketService.create(req.body);
        
        res.status(201).json({message:"Ticket Created Successfully" ,newTicket})
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

// exports.getAllTickets = async (req, res) => {
//     const { page, limit, noPagination, status, priority, category } = req.query;
    
//     try {
//         const tickets = await TicketService.getAll(page, limit, noPagination === 'true', { status, priority, category });
//         res.status(200).json(tickets);
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }
// };

exports.getAllTickets = async (req, res) => {
    const { page, limit, noPagination, status, userId = null } = req.query;

    try {
        // Ensure status is passed as a string
        const tickets = await TicketService.getAll(page, limit, noPagination === 'true', userId, { status: status || undefined });
        res.status(200).json({ tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getOpenTicket = async (req, res) => {
    const { page, limit, noPagination, } = req.query;
    
    try {
        const tickets = await TicketService.getOpenTicket(page, limit, noPagination === 'true', );
        res.status(200).json(tickets);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getTicketById = async (req, res) => {
    try {
        const ticket = await TicketService.getById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.status(200).json(ticket);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getNewTickets = async (req, res) => {
    try {
        const ticket = await TicketService.getById(req.params.id);
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
        res.status(200).json(ticket);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllStats = async (req, res) => {
    try {
        const stats = await TicketService.getAllStats();
        if (!stats) return res.status(404).json({ message: 'Stats not found' });
        res.status(200).json(stats);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAllTicketsByCategory = async (req, res) => {
    try {
        const tickets = await TicketService.getAllByCategory(req.params.categoryId);
        res.status(200).json(tickets);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

exports.updateTicket = async (req, res) => {
    try {
        const updatedTicket = await TicketService.update(req.params.id, req.body);
        if (!updatedTicket) return res.status(404).json({ message: 'Ticket not found' });
        res.status(200).json(updatedTicket);
    } catch (error) {
        console.log(error);
        res.status(400).json({ message: error.message });
    }
};

exports.assignUser = async (req, res) => {
    const { ticketId, employeeId } = req.body;
    
    // Validate ticketId and employeeId as ObjectIds
    if (!ticketId) {
        return res.status(400).json({ message: 'Invalid or missing ticket ID' });
    }
    if (!employeeId) {
        return res.status(400).json({ message: 'Invalid or missing employee ID' });
    }

    try {
        const updatedTicket = await TicketService.addUserToAssigned(ticketId, employeeId);
        return res.status(200).json({ message:"Ticket Assigned", updatedTicket});
    } catch (error) {
        if (error.message === 'Ticket not found') {
            return res.status(404).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.replay = async (req, res) => {
    const { ticketId, status, replayBy, replayDescription } = req.body;
    
    // Validate ticketId and employeeId as ObjectIds
    if (!ticketId || !status || !replayBy || !replayDescription) {
        return res.status(400).json({ message: 'All fields required' });
    }

    try {
        const updatedTicket = await TicketService.replayService(ticketId, status, replayBy, replayDescription);
        return res.status(200).json({ message:"Replay Succesfully Sent", updatedTicket});
    } catch (error) {
        if (error.message === 'Ticket not found') {
            return res.status(404).json({ message: error.message });
        }
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const deletedTicket = await TicketService.delete(req.params.id);
        if (!deletedTicket) return res.status(404).json({ message: 'Ticket not found' });
        res.status(204).send();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};
