const TicketCategory = require('../../models/ticket/ticketCategoryModel');
const Ticket = require('../../models/ticket/ticketModel');

exports.create = async (data) => {
    const newCategory = new TicketCategory(data);
    return await newCategory.save();
};

exports.getAll = async () => {
    const categories =  await TicketCategory.find();
    // Map through categories to get stats
    const stats = await Promise.all(categories.map(async (category) => {
        const activeCount = await Ticket.countDocuments({ status: 'Open', category: category._id });
        const inprogressCount = await Ticket.countDocuments({ status: 'In Progress', category: category._id });
        const solvedCount = await Ticket.countDocuments({ status: 'Resolved', category: category._id });

        return {
            _id: category._id,
            categoryName: category.categoryName,
            categoryDescription: category.categoryDescription,
            categoryPriority: category.categoryPriority,
            activeTickets: activeCount+inprogressCount,
            resolveTickets: solvedCount,
            sla:"90% on-time",
            __v: category.__v // Include version key if needed
        };
    }));
    return stats;
};

exports.getById = async (id) => {
    return await TicketCategory.findById(id);
}
