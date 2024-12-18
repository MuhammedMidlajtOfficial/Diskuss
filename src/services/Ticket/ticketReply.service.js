const TicketReply = require('../../models/ticket/ticketReplyModel');

exports.create = async (data) => {
    const newReply = new TicketReply(data);
    return await newReply.save();
};

exports.getByTicketId = async (ticketId) => {
    return await TicketReply.find({ ticketId });
};
