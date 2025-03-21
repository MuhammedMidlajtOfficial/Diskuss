const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    ticketNumber: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true // You may want to use a user reference here
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        default: Date.now
    },
    comments: {
        type: String,
        default: ""
    },
    category: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: "TicketCategory",
        default: null
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved'],
        default: 'Open'
    },
    replayBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
    },
    replayDescription: {
        type: String
    },
    replayedTime :{
        type: Date,
    }
});

const Ticket = mongoose.model('Ticket', ticketSchema);
module.exports = Ticket;
