// Analytic Router
const { Router } = require('express');
const controller = require('../../Controller/analyticController')


const router = Router();

router.get('/', controller.getAnalytics)
router.get('/all', controller.getAllAnalytics)
router.get('/card/:cardId', controller.getCardAnalytics)
router.get('/card/:cardId/date', controller.getCardAnalyticsByDateFrame)
router.get('/overview/:userId', controller.getOverview)

router.post('/share', controller.logShare)
router.post('/view', controller.logView)
router.post('/click', controller.logClick)


router.get('/meeting/enterprise/:enterpriseId', controller.getEnterpriseMeetings)
router.get('/meeting/individual/:individualId', controller.getIndividualMeetings)
router.get('/card/:enterpriseId', controller.getCards)
router.get('/employee/:enterpriseId', controller.getEmployees)
router.get('/count/:enterpriseId', controller.getCounts);

router.get('/meeting/:userId', controller.getMeetingsAnalytics)


module.exports = router;

