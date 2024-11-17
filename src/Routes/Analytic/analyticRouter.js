const { Router } = require('express');
const controller = require('../../Controller/analyticController')


const router = Router();

router.get('/', controller.getAnalytics)
router.post('/share', controller.logShare)
router.post('/view', controller.logView)
router.post('/click', controller.logClick)

router.get('/meeting/:enterpriseId', controller.getMeetings)

module.exports = router;
