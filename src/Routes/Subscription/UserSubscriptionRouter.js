const { Router } = require('express');
const controller = require('../../Controller/Subscription/UserSubscriptionController');
<<<<<<< HEAD
const authMiddleware = require('../../middleware/authMiddleware');
=======
const authMiddleware = require('../../Middleware/authMiddleware');
>>>>>>> Naren


const router = Router();

router.get('/', authMiddleware.authenticateToken2, controller.getUserSubscriptions);
<<<<<<< HEAD
router.get('/user/:user_id', authMiddleware.authenticateToken2, controller.getUserSubscriptionByUserId);
router.post('/',authMiddleware.authenticateToken2, controller.createUserSubscription);
router.patch('/:userSubscription_id', authMiddleware.authenticateToken2, controller.updateUserSubscription);
router.delete('/:userSubscription_id',authMiddleware.authenticateToken2, controller.deleteUserSubscription);
=======
router.post('/',authMiddleware.authenticateToken2, controller.createUserSubscription);
router.patch('/:userSubscription_id', authMiddleware.authenticateToken, controller.updateUserSubscription);
router.delete('/:userSubscription_id',authMiddleware.authenticateToken, controller.deleteUserSubscription);
>>>>>>> Naren

module.exports = router;