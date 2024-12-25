const mongoose = require('mongoose');

const ticketCategorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        required: true,
        unique: true
    },
    categoryDescription: {
        type: String,
        required: true
    },
    categoryPriority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: false 
    },
}, {timestamp : true});

const TicketCategory = mongoose.model('TicketCategory', ticketCategorySchema);
module.exports = TicketCategory;
