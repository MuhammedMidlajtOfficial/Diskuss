// controllers/NotificationPreferencesController.js
const NotificationPreferences = require('../../models/permissionsModel');





// Create a new Notification Preference document when a new user registers or when needed
const createNotificationPreferences = async (req, res) => {
  const { userId } = req.body; // Assuming userId is passed in the body

  try {
    // Check if notification preferences already exist for the user
    const existingPreferences = await NotificationPreferences.findOne({ userId });

    if (existingPreferences) {
      return res.status(400).json({ message: "Notification preferences already exist." });
    }

    // Create new notification preferences with default values
    const newPreferences = new NotificationPreferences({
      userId,
      generalNotifications: false,
      promotion: false,
      discountAvailable: false,
      billReminder: false,
      appUpdate: false,
    });

    // Save the preferences to the database
    await newPreferences.save();

    return res.status(201).json({
      message: "Notification preferences created successfully",
      preferences: newPreferences,
    });
  } catch (error) {
    console.error("Error creating notification preferences:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




// Get notification preferences for a specific user
const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.params.userId;
    const preferences = await NotificationPreferences.findOne({ userId });

    if (!preferences) {
      return res.status(404).json({ message: 'Notification preferences not found' });
    }

    res.status(200).json(preferences);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update notification preferences for a specific user
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { generalNotifications, promotion, discountAvailable, billReminder, appUpdate } = req.body;

    // Check if the user has preferences stored
    let preferences = await NotificationPreferences.findOne({ userId });

    if (!preferences) {
      preferences = new NotificationPreferences({ userId });
    }

    // Update the preferences
    preferences.generalNotifications = generalNotifications !== undefined ? generalNotifications : preferences.generalNotifications;
    preferences.promotion = promotion !== undefined ? promotion : preferences.promotion;
    preferences.discountAvailable = discountAvailable !== undefined ? discountAvailable : preferences.discountAvailable;
    preferences.billReminder = billReminder !== undefined ? billReminder : preferences.billReminder;
    preferences.appUpdate = appUpdate !== undefined ? appUpdate : preferences.appUpdate;

    // Save the updated preferences
    await preferences.save();

    res.status(200).json({ message: 'Notification preferences updated successfully', preferences });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getNotificationPreferences,
  updateNotificationPreferences,
  createNotificationPreferences
};
