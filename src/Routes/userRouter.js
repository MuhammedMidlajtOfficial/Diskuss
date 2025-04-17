const router = require('express').Router();

const { getUserById, getUserByPhoneNo } = require('../Controller/userController');

router.get('/:id', getUserById);
router.get('/phone/:phoneNo', getUserByPhoneNo);

module.exports = router;