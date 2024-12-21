const TicketCategory = require('../../models/ticket/ticketCategoryModel');

exports.create = async (data) => {
    const newCategory = new TicketCategory(data);
    return await newCategory.save();
};

exports.getAll = async () => {
    const categories =  await TicketCategory.find();
    const stats = []

    for (const category of categories) {
        const activeCount = await Ticket.countDocuments({ status: 'Open', category });
        const solvedCount = await Ticket.countDocuments({ status: 'Resolved', category });

        stats.push({
            category,
            activeTickets: activeCount,
            solvedTickets: solvedCount
        });
    }

    return stats;
};

exports.getById = async (id) => {
    return await TicketCategory.findById(id);
}
