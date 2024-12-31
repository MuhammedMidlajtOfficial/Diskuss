const TicketCategory = require('../../models/ticket/ticketCategoryModel');
const Ticket = require('../../models/ticket/ticketModel');

exports.create = async (data) => {
    const newCategory = new TicketCategory(data);
    return await newCategory.save();
};

exports.update = async (data) => {
    const category = await TicketCategory.findOne({ _id: data.id });

    // Check if category exists
    if (!category) {
        throw new Error("Category not found.");
    }

    // Perform the update
    const updateResult = await TicketCategory.updateOne(
        { _id: data.id },
        {
            categoryName: data.categoryName,
            categoryDescription: data.categoryDescription,
            categoryPriority: data.categoryPriority
        }
    );

    // Return response based on update result
    if (updateResult.modifiedCount > 0) {
        return "Category updated successfully.";
    } else if (updateResult.matchedCount > 0) {
        return "No changes made to the category.";
    } else {
        throw new Error("Category not found.");
    }
};

exports.delete = async (id) => {
    const result = await TicketCategory.deleteOne({ _id: id });
    console.log(result);
    if (result.deletedCount === 0) {
        throw new Error('Category not found');
    }
    return 'Category deleted successfully';
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
