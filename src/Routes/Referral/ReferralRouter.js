const express = require('express');
const router = express.Router();
const ReferralController = require('../../Controller/Referral/referralController');

// Referral Routes
router.post('/', ReferralController.createReferral);
router.get('/', ReferralController.getAllReferrals);
router.get('/user/:userId', ReferralController.getReferralsByUserId); // Get referrals by user ID
router.get('/:id', ReferralController.getReferralById);
router.put('/:id', ReferralController.updateReferral);
router.delete('/:id', ReferralController.deleteReferral);

module.exports = router;