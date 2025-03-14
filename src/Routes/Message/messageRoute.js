// messageRouter 
const express = require("express");
const router = express.Router();
const messageController = require("../../Controller/Message/messageController");

router.post("/sendMessageOld", messageController.sendMessage); // This should handle POST requests
router.post("/sendMessage", messageController.sendMessageNew); // This should handle POST requests
router.post("/sendAdminMessage", messageController.sendAdminMessage); // This should handle POST requests
router.post("/markMessagesAsRead",messageController.markMessagesAsRead );
router.post("/markAdminMessagesAsRead",messageController.markAdminMessagesAsRead );
router.get("/old", messageController.getMessages); // For getting messages
router.get("/", messageController.getMessagesNew); // For getting messages


module.exports = router;
