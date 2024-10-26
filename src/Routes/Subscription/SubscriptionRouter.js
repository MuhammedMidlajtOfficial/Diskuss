const { Router } = require('express');
const controller = require('../../Controller/Subscription/SubscriptionController');


const router = Router();

router.get('/', controller.getSubscriptions);
router.post('/',controller.createSubscription)
router.patch('/:plan_id', controller.updateSubscription);
router.delete('/:plan_id',controller.deleteSubscription)

module.exports = router;