const Subscription = require('../../models/subscription.model');


/**
 * Find all Subscsriptions
 * @returns {Promise<Subscription[]>}
 */
const findAll = async () => {
  try {
    const subscriptions = await Subscription.find().exec();
    console.log(subscriptions);
    return subscriptions;
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw error; // Re-throw the error for higher-level handling if needed
  }
  };  

  
/**
 * Create al subscription
 * * Create a new subscription plan.
 * @param {Object} planData - The subscription plan data.
 * @param {String} planData.name - Name of the plan.
 * @param {Decimal128} planData.price - Price of the plan.
 * @param {Mixed} planData.features - JSON object for plan features.
 * @returns {Promise<Object>} - Returns the created subscription plan.
 */
  const createSubscriptionPlan = async (planData) => {
    try {
      // Prepare the subscription data with unique plan_id
      const newPlan = new Subscription({
        name: planData.name,
        price: planData.price,
        features: planData.features || {}
      });
  
      // Save the new subscription plan to the database
      const savedPlan = await newPlan.save();
      return savedPlan;
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      throw error;
    }
  };


/**
 * Update a subscription plan by plan_id.
 * @param {String} plan_id - The unique identifier of the subscription plan to update.
 * @param {Object} updateData - The data to update the subscription plan.
 * @param {String} [updateData.name] - New name of the plan (optional).
 * @param {Decimal128} [updateData.price] - New price of the plan (optional).
 * @param {Mixed} [updateData.features] - New features for the plan (optional).
 * @returns {Promise<Object>} - Returns the updated subscription plan.
 * @throws {Error} - Throws an error if the subscription plan is not found or if there's an issue with the update.
 */
  const updateSubscriptionByPlanId = async (plan_id, updateData) => {
    try {
      console.log(plan_id);
      
      const subscription = await Subscription.findOne({plan_id:plan_id}).exec();
       
      console.log(subscription);
      
      if (!subscription) {
        throw new Error("Subscription plan not found");
      }
      const updatedSubscription = await Subscription.findOneAndUpdate(
        { plan_id },
        { $set: updateData },
        { new: true }
      ).exec(); // Find and update the subscription plan

      updatedSubscription.save(); // Save the updated subscription plan

  
      return updatedSubscription; // Return the updated subscription
    } catch (error) {
      console.error("Error updating subscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };

  
/**
 * Delete a subscription plan by plan_id.
 * @param {String} plan_id - The unique identifier of the subscription plan to delete.
 * @returns {Promise<Object>} - Returns the deleted subscription plan for confirmation.
 * @throws {Error} - Throws an error if the subscription plan is not found or if there's an issue with the deletion.
 */
  const deleteSubscriptionByPlanId = async (plan_id) => {
    try {
      const deletedSubscription = await Subscription.findOneAndDelete({ plan_id }).exec();
  
      if (!deletedSubscription) {
        throw new Error("Subscription plan not found");
      }
  
      return deletedSubscription; // Return the deleted subscription for confirmation
    } catch (error) {
      console.error("Error deleting subscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };
  
  




module.exports = {
    findAll,
    createSubscriptionPlan,
    updateSubscriptionByPlanId,
    deleteSubscriptionByPlanId
};