const configModel = require("../../models/config/config.model");

const fetchFast2SMSConfig = async () => {
  try {
    // Fetch configuration from the database
    const configData = await configModel.findOne({ "config.Fast 2 SMS Base URL": { $exists: true } });

    if (!configData) {
      throw new Error("Fast 2 SMS configuration not found in the database.");
    }

    // Return the config object
    return configData.config;
  } catch (error) {
    console.error("Error fetching Fast 2 SMS configuration:", error.message);
    throw error;
  }
};

module.exports = fetchFast2SMSConfig;