const cron = require('node-cron');
const axios = require('axios');

cron.schedule('0 0 * * *', async () => {
  console.log("Cron job triggered at:", new Date().toLocaleString());
  try {
    console.log("Triggering expired subscriptions deactivation...");
    const response = await axios.get('http://13.203.24.247:2000/api/v1/subscription/deactivate-expired-subscriptionsns');
    console.log("Deactivation response:", response.data);
  } catch (error) {
    console.error("Error triggering deactivation route:", error);
  }
});
