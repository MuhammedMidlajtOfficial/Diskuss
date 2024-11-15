const { Router } = require('express');
const controller = require('../../Controller/analyticController')


const router = Router();

router.post('/share', controller.createShare)
router.post('/view', controller.createView)
// router.post('/visitor', controller.createVisitor)
router.post('/click', controller.createClick)
router.get('/analytic', controller.getAnalytic)



module.exports = router;