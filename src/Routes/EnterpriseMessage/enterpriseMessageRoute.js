const express = require("express");
const router = express.Router();
const enterpriseMessageController = require("../../Controller/EnterpriseMessage/enterpriseMessageController");

router.post("/sendMessage", enterpriseMessageController.sendMessage); // This should handle POST requests
router.post("/markEnterpriseMessagesAsRead",enterpriseMessageController.markMessagesAsRead );
router.get("/", enterpriseMessageController.getMessages); // For getting messages

module.exports = router;