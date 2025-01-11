// ticket category routes
const express = require('express');
const router = express.Router();
const ticketCategoryController = require('../../Controller/Ticket/ticketCategoryController');

// Routes for ticket categories
router.get('/', ticketCategoryController.getAllCategories);
router.get('/:id', ticketCategoryController.getCategoryById);

router.post('/', ticketCategoryController.createCategory);
router.patch('/', ticketCategoryController.updateCategory);

router.delete('/:id', ticketCategoryController.deleteCategory);


module.exports = router;
