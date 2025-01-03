const express = require('express');
const router = express.Router();
const ReferralController = require('../../Controller/Referral/referralController');
const WithdrawalController = require('../../Controller/Referral/Withdrawal/withdrawalController');

// New Referral Router
router.post('/invite', ReferralController.sendInvite);
router.post('/register', ReferralController.registerInvitee);
router.post('/card', ReferralController.createCardByInvitee);
router.get('/details/:userId', ReferralController.getReferralDetails);
router.get('/code-check/:referralCode', ReferralController.checkReferralCode);

// Incentive Routes
router.get('/withdraw', WithdrawalController.getAllWithdrawalDetails);
router.get('/withdraw/:id', WithdrawalController.getWithdrawalRequestByUserId);
router.post('/withdraw', WithdrawalController.createWithdrawalRequest);

// Dashboard Routes
router.get('/admin', ReferralController.getAllReferrals);
router.get('/admin/monthly', ReferralController.getMonthlyReferralsCounts);


// Old Referral Routes
// router.post('/', ReferralController.createReferral);
// router.get('/', ReferralController.getAllReferrals);
// router.get('/user/:userId', ReferralController.getReferralsByUserId); // Get referrals by user ID
// router.get('/:id', ReferralController.getReferralById);
// router.put('/:id', ReferralController.updateReferral);
// router.delete('/:id', ReferralController.deleteReferral);

// router.get('/invited/:userId', ReferralController.getInvitedUsers);

module.exports = router;
