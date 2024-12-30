const axios = require("axios");
const fetchWatiConfig = require("./watiConfigFetcher");

const watiSender = async (phnNumber, otp) => {
  try {
    const { baseUrl, bearerToken } = await fetchWatiConfig();

    const response = await axios.post(
      `${baseUrl}/api/v1/sendTemplateMessage?whatsappNumber=${phnNumber}`,
      {
        parameters: [
          {
            name: "1",
            value: otp,
          },
        ],
        template_name: "one_time_otp",
        broadcast_name: "one_time_otp",
      },
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("WhatsApp message sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending WhatsApp message:", error.response?.data || error.message);
    throw error;
  }
};

module.exports = watiSender;
