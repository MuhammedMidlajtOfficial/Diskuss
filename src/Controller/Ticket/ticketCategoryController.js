const TicketCategoryService = require('../../services/Ticket/ticketCategory.service');

exports.createCategory = async (req, res) => {
    try {
        const newCategory = await TicketCategoryService.create(req.body);
        res.status(201).json(newCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
        console.log(error);
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const message = await TicketCategoryService.update(req.body);
        res.status(201).json({message});
    } catch (error) {
        res.status(400).json({ message: error.message });
        console.log(error);
    }
};

exports.getAllCategories = async (req, res) => {

    try {
        const categories = await TicketCategoryService.getAll();

        res.status(200).json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await TicketCategoryService.getById(req.params.id);
        if (!category){
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
