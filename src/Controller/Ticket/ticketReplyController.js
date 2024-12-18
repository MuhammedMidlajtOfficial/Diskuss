const TicketReplyService = require('../../services/Ticket/ticketReply.service');

exports.createReply = async (req, res) => {
    try {   
        const newReply = await TicketReplyService.create(req.body);
        res.status(201).json(newReply);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getRepliesByTicketId = async (req, res) => {
    try {
        const replies = await TicketReplyService.getByTicketId(req.params.ticketId);
        res.status(200).json(replies);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
