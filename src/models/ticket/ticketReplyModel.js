const mongoose = require('mongoose');

const ticketReplySchema = new mongoose.Schema({
    ticketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ticket',
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    ticketCategoryType: {
        type: String,
        required: true // This can be a reference to a category model if you implement one
    },
    status: {
        type: String,
        enum: ['Ongoing', 'Pending', 'Completed'],
        default: 'Ongoing'
    },
    shortDescription: {
        type: String,
        required: true
    },
    repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const TicketReply = mongoose.model('TicketReply', ticketReplySchema);
module.exports = TicketReply;
