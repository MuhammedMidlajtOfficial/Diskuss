// Action Router
const express = require('express');
const router = express.Router();
const ActionController = require('../../Controller/Referral/actionController');

// Action Routes
router.post('/', ActionController.createAction);
router.get('/', ActionController.getAllActions);
router.get('/:id', ActionController.getActionById);
router.put('/:id', ActionController.updateAction);
router.delete('/:id', ActionController.deleteAction);

// routes for finding actions by referral ID and user ID
router.get('/referral/:referralId', ActionController.getActionsByReferralId); // Get actions by referral ID

module.exports = router;