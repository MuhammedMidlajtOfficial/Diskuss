const { Router } = require('express');
const controller = require('../../Controller/Subscription/SubscriptionController');


const router = Router();

router.get('/', controller.getSubscriptions);

module.exports = router;