// routes/notificationPreferences.js
const express = require('express');
const router = express.Router();
const { getNotificationPreferences, updateNotificationPreferences ,createNotificationPreferences} = require('../../Controller/Permissions/PermissionController');

// Route to get notification preferences for a user
router.get('/:userId', getNotificationPreferences);

router.post('/',createNotificationPreferences)

// Route to update notification preferences for a user
router.put('/:userId', updateNotificationPreferences);

module.exports = router;
