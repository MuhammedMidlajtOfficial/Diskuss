const express = require('express');
const router = express.Router();
const RefLevelController = require('../../Controller/Referral/referralLevelController');

// Define routes for referrals
router.get('/', RefLevelController.getRefLevels); // Get all referrals
router.get('/:id', RefLevelController.getRefLevelById); // Get referral by ID
router.post('/', RefLevelController.createRefLevel); // Create a new referral
router.patch('/:id', RefLevelController.updateRefLevel); // Update a referral by ID
router.delete('/:id', RefLevelController.deleteRefLevel); // Delete a referral by ID

module.exports = router;