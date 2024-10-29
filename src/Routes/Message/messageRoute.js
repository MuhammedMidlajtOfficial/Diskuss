// // routes/messageRoutes.js
// const express = require('express');
// const { sendMessage,getChatHistory, markAsSeen, } = require('../../Controller/Message/Message');
// const router = express.Router();

// router.post('/send', sendMessage);
// router.post('/markAsSeen', markAsSeen);
// router.get('/chat_History/:chatId', getChatHistory);


// module.exports = router;


const express = require("express");
const router = express.Router();
const messageController = require("../../Controller/Message/messageController");

router.post("/sendMessage", messageController.sendMessage); // This should handle POST requests
router.get("/", messageController.getMessages); // For getting messages

module.exports = router;
