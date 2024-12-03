const cron = require('node-cron');
const axios = require('axios');

// Schedule the task to run every 24 hours (midnight)
cron.schedule('0 0 * * *', async () => {
  try {
    console.log("Triggering expired subscriptions deactivation...");
    const response = await axios.post('https://diskuss-1mv4.onrender.com/api/v1/subscription/deactivate-expired-subscriptions');
    console.log("Deactivation response:", response.data);
  } catch (error) {
    console.error("Error triggering deactivation route:", error);
  }
});
