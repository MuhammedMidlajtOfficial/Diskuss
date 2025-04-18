// Notification Router
const express = require("express");
const router = express.Router();

const {getNotification,deleteNotification,MarkedAsRead,MarkedAllAsRead} = require("../../Controller/Notification/NotificationController")

router.get('/get-Notifiy/:userId',getNotification)

router.delete('/delete-Notifiy/:notifyId',deleteNotification)

router.put('/update-Notifiy/:notifyId',MarkedAsRead)

router.patch('/markAllAsRead/:receiverId', MarkedAllAsRead); 

module.exports = router;