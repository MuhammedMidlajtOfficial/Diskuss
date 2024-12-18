const TicketCategory = require('../../models/ticket/ticketCategoryModel');

exports.create = async (data) => {
    const newCategory = new TicketCategory(data);
    return await newCategory.save();
};

exports.getAll = async () => {
    return await TicketCategory.find();
};

exports.getById = async (id) => {
    return await TicketCategory.findById(id);
}
