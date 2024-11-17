const Subscription = require('../../models/subscriptoin.model');

/**
 * Find all Subscsriptions
 * @returns {Promise<Subscription[]>}
 */
const findAll = async () => {
    return Subscription.find().exec();
  };  


module.exports = {
    findAll
};