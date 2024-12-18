const express = require('express');
const router = express.Router();
const ticketCategoryController = require('../../Controller/Ticket/ticketCategoryController');

// Routes for ticket categories
router.post('/', ticketCategoryController.createCategory);
router.get('/', ticketCategoryController.getAllCategories);
router.get('/:id', ticketCategoryController.getAllCategories);

module.exports = router;
