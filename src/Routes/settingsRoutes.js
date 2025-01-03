const { Router } = require('express');
const controller = require('../Controller/adminController');


const router = Router();

router.get('/', controller.getSettings);
router.put('/', controller.setSettings);

module.exports = router;