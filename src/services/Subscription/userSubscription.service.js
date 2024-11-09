const UserSubscription = require('../../models/userSubscription.model');

/**
 * Find all Subscsriptions
 * @returns {Promise<UserSubscription[]>}
 */
const findAll = async () => {
  try {
    const userSubscriptions = await UserSubscription.find().exec();
    // console.log(UserSubscriptions);
    return userSubscriptions;
  } catch (error) {
    console.error("Error fetching UserSubscriptions plan:", error);
    throw error; // Re-throw the error for higher-level handling if needed
  }
  };  

const findOneById = async (userId) => {
  try {
    console.log("user id :", userId);

    const userSubscriptions =  await UserSubscription.find({userId}).exec();
    console.log("user subscription : ", userSubscriptions);

    return userSubscriptions;
    return
  } catch (error) {
    console.error("Error fetching User Subscriptions plan:", error);
    throw error; // Re-throw the error for higher-level handling if needed
  }
  };  



  
/**
 * Create al UserSubscription
 * * Create a new UserSubscription plan.
 * @param {Object} planData - The UserSubscription plan data.
 * @param {String} planData.name - Name of the plan.
 * @param {Decimal128} planData.price - Price of the plan.
 * @param {Mixed} planData.features - JSON object for plan features.
 * @returns {Promise<Object>} - Returns the created UserSubscription plan.
 */
  const createUserSubscription = async (data) => {
    try {
      // Prepare the UserSubscription data with unique plan_id

      // console.log("data", data);
      const newSubscription = new UserSubscription({
        planId: data.planId,
        userId: data.userId,
        razorpayOrderId:data.razorpayOrderId,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status
      });
  
      // Save the new UserSubscription plan to the database
      const savedSubscription = await newSubscription.save();
      return savedSubscription;
    } catch (error) {
      console.error("Error creating UserSubscription plan:", error);
      throw error;
    }
  };


/**
 * Update a UserSubscription plan by plan_id.
 * @param {String} plan_id - The unique identifier of the UserSubscription plan to update.
 * @param {Object} updateData - The data to update the UserSubscription plan.
 * @param {String} [updateData.name] - New name of the plan (optional).
 * @param {Decimal128} [updateData.price] - New price of the plan (optional).
 * @param {Mixed} [updateData.features] - New features for the plan (optional).
 * @returns {Promise<Object>} - Returns the updated UserSubscription plan.
 * @throws {Error} - Throws an error if the UserSubscription plan is not found or if there's an issue with the update.
 */
  const updateUserSubscriptionById = async (id, updateData) => {
    try {
      // console.log("id : ",id);
      
      const userSubscription = await UserSubscription.findById({_id : id}).exec();
       
      // console.log(userSubscription);
      
      if (!userSubscription) {
        throw new Error("User Subscription plan not found");
      }
      const updatedUserSubscription = await UserSubscription.findOneAndUpdate(
        { _id: id },
        { $set: updateData },
        { new: true }
      ).exec(); // Find and update the UserSubscription plan

      updatedUserSubscription.save(); // Save the updated UserSubscription plan

  
      return updatedUserSubscription; // Return the updated UserSubscription
    } catch (error) {
      console.error("Error updating UserSubscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };

  
/**
 * Delete a UserSubscription plan by plan_id.
 * @param {String} plan_id - The unique identifier of the UserSubscription plan to delete.
 * @returns {Promise<Object>} - Returns the deleted UserSubscription plan for confirmation.
 * @throws {Error} - Throws an error if the UserSubscription plan is not found or if there's an issue with the deletion.
 */
  const deleteUserSubscriptionById = async (plan_id) => {
    try {
      const deletedUserSubscription = await UserSubscription.findOneAndDelete({ plan_id }).exec();
  
      if (!deletedUserSubscription) {
        throw new Error("User Subscription plan not found");
      }
  
      return deletedUserSubscription; // Return the deleted UserSubscription for confirmation
    } catch (error) {
      console.error("Error deleting User Subscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };
  
  




module.exports = {
    findAll,
    findOneById,
    createUserSubscription,
    updateUserSubscriptionById,
    deleteUserSubscriptionById
};