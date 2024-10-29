// routes/messageRoutes.js
const express = require('express');
const { sendMessage,getChatHistory, markAsSeen, } = require('../../Controller/Message/Message');
const router = express.Router();

router.post('/send', sendMessage);
router.post('/markAsSeen', markAsSeen);
router.get('/chat_History/:chatId', getChatHistory);


module.exports = router;
