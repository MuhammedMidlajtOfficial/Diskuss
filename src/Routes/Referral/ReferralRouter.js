const express = require('express');
const router = express.Router();
const ReferralController = require('../../Controller/Referral/referralController');

// New Referral Router
router.post('/invite', ReferralController.sendInvite);
router.post('/register', ReferralController.registerInvitee);
router.post('/card', ReferralController.createCardByInvitee);
router.get('/details/:userId', ReferralController.getReferralDetails);

// Old Referral Routes
// router.post('/', ReferralController.createReferral);
// router.get('/', ReferralController.getAllReferrals);
// router.get('/user/:userId', ReferralController.getReferralsByUserId); // Get referrals by user ID
// router.get('/:id', ReferralController.getReferralById);
// router.put('/:id', ReferralController.updateReferral);
// router.delete('/:id', ReferralController.deleteReferral);

// router.get('/invited/:userId', ReferralController.getInvitedUsers);

module.exports = router;