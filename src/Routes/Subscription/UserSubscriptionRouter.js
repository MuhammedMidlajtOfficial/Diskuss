// User Subscription Router
const { Router } = require('express');
const controller = require('../../Controller/Subscription/UserSubscriptionController');
const authMiddleware = require('../../Middleware/authMiddleware');


const router = Router();

router.get('/', authMiddleware.authenticateToken2, controller.getUserSubscriptions);
router.get('/user/:user_id', authMiddleware.authenticateToken2, controller.getUserSubscriptionByUserId);
router.post('/',authMiddleware.authenticateToken2, controller.createUserSubscription);
router.patch('/:userSubscription_id', authMiddleware.authenticateToken2, controller.updateUserSubscription);
router.delete('/:userSubscription_id',authMiddleware.authenticateToken2, controller.deleteUserSubscription);

router.post('/verifyPayment', authMiddleware.authenticateToken2, controller.verifyPayment)
router.get('/deactivate-expired-subscriptions', controller.deactivateSubscriptions)
router.post('/free', controller.createFreeSubscription)

module.exports = router;