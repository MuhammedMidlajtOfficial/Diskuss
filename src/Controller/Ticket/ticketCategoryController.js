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
        const category = await TicketCategoryService.update(req.body);
        res.status(200).json( category ); // Use 200 for success
    } catch (error) {
        res.status(400).json({ message: error.message });
        console.log(error);
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        console.log('hererererer');
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: 'ID is required' });
        }
        
        const message = await TicketCategoryService.delete(id);
        res.status(200).json({ message }); // Success response
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
