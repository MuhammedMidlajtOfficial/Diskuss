const { Router } = require('express');
const controller = require('../../Controller/Subscription/UserSubscriptionController');
const authMiddleware = require('../../middleware/authMiddleware');


const router = Router();

router.get('/', authMiddleware.authenticateToken2, controller.getUserSubscriptions);
router.post('/',authMiddleware.authenticateToken2, controller.createUserSubscription);
router.patch('/:userSubscription_id', authMiddleware.authenticateToken, controller.updateUserSubscription);
router.delete('/:userSubscription_id',authMiddleware.authenticateToken, controller.deleteUserSubscription);

module.exports = router;