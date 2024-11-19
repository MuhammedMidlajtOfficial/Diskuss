const express = require('express');
const router = express.Router();
const IndividualCountController = require('../../Controller/CountController/IndividualCountController');


router.get('/:userId/counts', IndividualCountController.getCounts);

module.exports = router;
