const subscriptionService = require('../../services/Subscription/subscription.service');


/**
 * Get all Subscription
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getSubscriptions = async (req, res) => {
    try {
        const subscription = await subscriptionService.findAll();
        return res.status(200).json({ subscription });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

module.exports = {
    getSubscriptions
};
