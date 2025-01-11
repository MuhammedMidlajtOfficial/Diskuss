// log Router
const { Router } = require('express');
const controller = require('../Controller/Logs/logController');

const router = Router();

router.get('/', controller.getAllLogs);

module.exports = router;