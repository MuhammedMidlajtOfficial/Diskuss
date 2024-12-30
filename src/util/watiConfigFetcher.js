const axios = require("axios");

const fetchWatiConfig = async () => {
  try {
    const response = await axios.get("http://13.203.24.247:9000/api/v1/wati");
    if (response.data && response.data.length > 0) {
      const { url: baseUrl, apiKey: bearerToken } = response.data[0];
      console.log("Base URL:", baseUrl);
      console.log("Bearer Token:", bearerToken);
      return { baseUrl, bearerToken };
    } else {
      throw new Error("No data found in the WATI API response.");
    }
  } catch (error) {
    console.error("Error fetching WATI configuration:", error.message);
    throw error;
  }
};

module.exports = fetchWatiConfig;
