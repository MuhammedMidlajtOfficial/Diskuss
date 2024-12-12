const SubscriptionPlan = require('../../models/subscriptionPlan.model');


/**
 * Find all Subscsriptions
 * @returns {Promise<SubscriptionPlan[]>}
 */
const findAll = async () => {
  try {
    const subscriptionPlans = await SubscriptionPlan.find().exec();
    // console.log(SubscriptionPlans);
    return subscriptionPlans;
  } catch (error) {
    console.error("Error fetching SubscriptionPlans plan:", error);
    throw error; // Re-throw the error for higher-level handling if needed
  }
  };
  
  
/**
 * Find a SubscriptionPlan id.
 * @param {String} id - The unique identifier of the SubscriptionPlan plan to find.
 * @returns {Promise<Object>} - Returns the found SubscriptionPlan plan.
 * @throws {Error} - Throws an error if the SubscriptionPlan plan is not found.
 */
const findOneById = async (id) => {
  try {
    // console/log(id);
  const subscriptionPlan = await SubscriptionPlan.findById(id).exec();

  if (!subscriptionPlan) {
  throw new Error("Subscription Plan not found");
}

return subscriptionPlan;
} catch (error) {
console.error("Error fetching Subscription Plan:", error);
throw error; // Re-throw the error for higher-level handling if needed
}
};



/**
 * Find a SubscriptionPlan plan by plan_id.
 * @param {String} plan_id - The unique identifier of the SubscriptionPlan plan to find.
 * @returns {Promise<Object>} - Returns the found SubscriptionPlan plan.
 * @throws {Error} - Throws an error if the SubscriptionPlan plan is not found.
 */
  const findOneByPlanId = async (planId) => {
      try {
        // console
      const subscriptionPlan = await SubscriptionPlan.findOne({ _id:planId }).exec();
    
      if (!subscriptionPlan) {
      throw new Error("Subscription Plan not found");
      }
    
      return subscriptionPlan;
    } catch (error) {
      console.error("Error fetching Subscription Plan:", error);
      throw error; // Re-throw the error for higher-level handling if needed
    }
    };
    

  
/**
 * Create al SubscriptionPlan
 * * Create a new SubscriptionPlan plan.
 * @param {Object} planData - The SubscriptionPlan plan data.
 * @param {String} planData.name - Name of the plan.
 * @param {Decimal128} planData.price - Price of the plan.
 * @param {Mixed} planData.features - JSON object for plan features.
 * @returns {Promise<Object>} - Returns the created SubscriptionPlan plan.
 */
  const createSubscriptionPlan = async (planData) => {
    try {
      // Prepare the SubscriptionPlan data with unique plan_id
      const newPlan = new SubscriptionPlan({
        name: planData.name,
        price: planData.price,
        features: planData.features || {},
        type:planData.type,
        duration: planData.duration
      });
  
      // Save the new SubscriptionPlan plan to the database
      const savedPlan = await newPlan.save();
      return savedPlan;
    } catch (error) {
      console.error("Error creating Subscription Plan :", error);
      throw error;
    }
  };


/**
 * Update a SubscriptionPlan plan by plan_id.
 * @param {String} plan_id - The unique identifier of the SubscriptionPlan plan to update.
 * @param {Object} updateData - The data to update the SubscriptionPlan plan.
 * @param {String} [updateData.name] - New name of the plan (optional).
 * @param {Decimal128} [updateData.price] - New price of the plan (optional).
 * @param {Mixed} [updateData.features] - New features for the plan (optional).
 * @returns {Promise<Object>} - Returns the updated SubscriptionPlan plan.
 * @throws {Error} - Throws an error if the SubscriptionPlan plan is not found or if there's an issue with the update.
 */
  const updateSubscriptionPlanByPlanId = async (planId, updateData) => {
    try {
      // console.log("service plan  id: ", planId);
      
      const subscriptionPlan = await SubscriptionPlan.findOne({planId}).exec();
      
      // console.log("Subscription Plan: ", subscriptionPlan);
      // console.log(SubscriptionPlan);
      
      if (!subscriptionPlan) {
        throw new Error("Subscription Plan not found");
      }
      const updatedSubscriptionPlan = await SubscriptionPlan.findOneAndUpdate(
        { planId  },
        { $set: updateData },
        { new: true }
      ).exec(); // Find and update the SubscriptionPlan plan

      updatedSubscriptionPlan.save(); // Save the updated SubscriptionPlan plan

  
      return updatedSubscriptionPlan; // Return the updated SubscriptionPlan
    } catch (error) {
      console.error("Error updating Subscription Plan:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };

  
/**
 * Delete a SubscriptionPlan plan by plan_id.
 * @param {String} plan_id - The unique identifier of the SubscriptionPlan plan to delete.
 * @returns {Promise<Object>} - Returns the deleted SubscriptionPlan plan for confirmation.
 * @throws {Error} - Throws an error if the SubscriptionPlan plan is not found or if there's an issue with the deletion.
 */
  const deleteSubscriptionPlanByPlanId = async (planId) => {
    try {
      const deletedSubscriptionPlan = await SubscriptionPlan.findOneAndDelete({ planId }).exec();
  
      if (!deletedSubscriptionPlan) {
        throw new Error("SubscriptionPlan plan not found");
      }
  
      return deletedSubscriptionPlan; // Return the deleted SubscriptionPlan for confirmation
    } catch (error) {
      console.error("Error deleting Subscription Plan:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };
  
  




module.exports = {
    findAll,
    findOneById,
    findOneByPlanId,
    createSubscriptionPlan,
    updateSubscriptionPlanByPlanId,
    deleteSubscriptionPlanByPlanId
};