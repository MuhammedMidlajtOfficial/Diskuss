const router = require('express').Router();
const urlShortnerController = require('../../Controller/urlShortenerController');

router.post('/', urlShortnerController.shortenUrl);

router.get('/:shortCode', urlShortnerController.getOriginalUrl);

module.exports = router;