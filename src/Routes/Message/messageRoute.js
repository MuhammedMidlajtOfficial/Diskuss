const express = require("express");
const router = express.Router();
const messageController = require("../../Controller/Message/messageController");

router.post("/sendMessage", messageController.sendMessage); // This should handle POST requests
router.post("/markMessagesAsRead",messageController.markMessagesAsRead );
router.get("/", messageController.getMessages); // For getting messages

module.exports = router;
