// Subscription Plan Router
const { Router } = require('express');
const controller = require('../../Controller/Subscription/SubscriptionPlanController');


const router = Router();

router.get('/', controller.getSubscriptionPlans);
router.get('/:id', controller.getSubscriptionPlanById);
router.post('/plan',controller.createSubscriptionPlan)
router.patch('/plan/:plan_id', controller.updateSubscriptionPlan);
router.delete('/plan/:plan_id',controller.deleteSubscriptionPlan)
router.get('/plan/:plan_id', controller.getSubscriptionPlanByPlanId);

module.exports = router; 
