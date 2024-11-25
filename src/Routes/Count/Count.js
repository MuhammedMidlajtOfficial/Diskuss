const express = require('express');
const router = express.Router();
const CountController = require('../../Controller/CountController/CountController');


router.get('/:enterpriseId/counts', CountController.getCounts);

module.exports = router;
