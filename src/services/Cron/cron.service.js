const cron = require('node-cron');
const axios = require('axios');

cron.schedule('0 0 * * *', async () => {
  console.log("Cron job triggered at:", new Date().toLocaleString());
  try {
    console.log("Triggering expired subscriptions deactivation...");
    const response = await axios.post('https://diskuss-1mv4.onrender.com/api/v1/subscription/deactivate-expired-subscriptions');
    console.log("Deactivation response:", response.data);
  } catch (error) {
    console.error("Error triggering deactivation route:", error);
  }
});
