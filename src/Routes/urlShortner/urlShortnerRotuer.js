const express = require('express');
const router = express.Router();
const urlShortnerController = require('../../Controller/urlShortnerController');

// Routes for urlShortner
router.get('/', urlShortnerController.getAllUrls);
router.get('/:id', urlShortnerController.redirectToUrl);
router.post('/', urlShortnerController.createUrl);

module.exports = router;