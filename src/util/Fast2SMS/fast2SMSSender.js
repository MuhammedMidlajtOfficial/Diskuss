const fetchFast2SMSConfig = require("./fast2SMSConfigFetcher");

module.exports.sendOtpFast2SMS = async (phnNumber, name, otp) => {
  try {
    const config = await fetchFast2SMSConfig();

    const response = await axios.post(
      config["Fast 2 SMS Base URL"],
      {
        route: config.Route,
        sender_id: config["Sender Id"],
        message: config["OTP ID"],
        flash:0,
        variables_values: `${name}|${otp}|`,
        numbers: phnNumber,
      },
      {
        headers: {
          authorization: config["API KEY"],
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    throw error;
  }
};

module.exports.sendResentOtpFast2SMS = async (phnNumber, name, otp) => {
  try {
    const config = await fetchFast2SMSConfig();

    const response = await axios.post(
      config["Fast 2 SMS Base URL"],
      {
        route: config.Route,
        sender_id: config["Sender Id"],
        message: config["Resent OTP ID"],
        flash:0,
        variables_values: `${name}|${otp}|`,
        numbers: phnNumber,
      },
      {
        headers: {
          authorization: config["API KEY"],
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    throw error;
  }
};

module.exports.sendSubscriptionSuccessFast2SMS = async (phnNumber, name, amount, date) => {
  try {
    const config = await fetchFast2SMSConfig();

    const response = await axios.post(
      config["Fast 2 SMS Base URL"],
      {
        route: config.Route,
        sender_id: config["Sender Id"],
        message: config["Transaction Success ID:"],
        flash:0,
        variables_values: `${name}|Rs.${amount}|${date}|`,
        numbers: phnNumber,
      },
      {
        headers: {
          authorization: config["API KEY"],
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    throw error;
  }
};

module.exports.sendSubscriptionFailedFast2SMS = async (phnNumber, name, amount, date) => {
  try {
    const config = await fetchFast2SMSConfig();

    const response = await axios.post(
      config["Fast 2 SMS Base URL"],
      {
        route: config.Route,
        sender_id: config["Sender Id"],
        message: config["Transaction Failed ID:"],
        flash:0,
        variables_values: `${name}|Rs.${amount}|${date}|`,
        numbers: phnNumber,
      },
      {
        headers: {
          authorization: config["API KEY"],
          "Content-Type": "application/json",
        },
      }
    );

    console.log("SMS sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error sending SMS:", error.message);
    throw error;
  }
};