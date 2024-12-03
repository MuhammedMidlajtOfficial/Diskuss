const enterpriseEmployeModel = require('../../models/enterpriseEmploye.model');
const enterpriseUser = require('../../models/enterpriseUser');
const UserSubscription = require('../../models/userSubscription.model');
const { individualUserCollection } = require("../../DBConfig");

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
  
      const userSubscriptions = await UserSubscription.find({ userId, status: 'active' }) // Assuming `status` is a field indicating activity
        .sort({ startDate: -1 }) // Sort by `startDate` in descending order (latest first)
        .populate('userId')
        .populate('planId')
        .limit(1) // Fetch only the latest subscription
        .exec();
  
      console.log("Latest active user subscription:", userSubscriptions);
  
      return userSubscriptions.length > 0 ? userSubscriptions : null; // Return the single subscription or null if none found
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

  const updateSubscriptionStatus = async (razorpay_order_id, updateData) => {
    try {
      // Find the user subscription by razorpayOrderId
      const userSubscription = await UserSubscription.findOne({ razorpayOrderId: razorpay_order_id }).exec();
      
      if (!userSubscription) {
        throw new Error("User Subscription plan not found");
      }
  
      // Update the subscription plan status with the new data
      const updatedUserSubscription = await UserSubscription.updateOne(
        { razorpayOrderId: razorpay_order_id }, // Search by razorpayOrderId, not _id
        { $set: updateData }, // Update the subscription with the new data
        { new: true }
      ).exec();
  
      return updatedUserSubscription; // Return the result of the update operation
    } catch (error) {
      console.error("Error updating UserSubscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };
  

  const updateSubscriptionStatusInUsers = async (razorpay_order_id, updateData) => {
    try {
      // Find the user subscription by razorpayOrderId
      const userSubscription = await UserSubscription.findOne({ razorpayOrderId: razorpay_order_id }).exec();
      if (!userSubscription) {
        console.log('User Subscription plan not found');
        throw new Error("User Subscription plan not found");
      }
      
        const userId = userSubscription.userId;

        const isIndividualUserExist = await individualUserCollection.findOne({ _id:userId }).exec();
        const isEnterpriseEmployeExist = await enterpriseEmployeModel.findOne({ _id:userId }).exec();
        const isEnterpriseUserExist = await enterpriseUser.findOne({ _id:userId }).exec();
        
        if (isIndividualUserExist) {
          console.log("IndividualUser isSubscribed:true ---- ", isIndividualUserExist);

          // Deactivate Old Subscriptions of individual user
          await deactivateOldSubscriptions(isIndividualUserExist._id)

          // Update individual user collection
          await individualUserCollection.updateOne({ _id: userId }, {isSubscribed:true});
        } else if (isEnterpriseEmployeExist) {
          console.log("isEnterpriseEmployeExist isSubscribed:true ---- ", isEnterpriseEmployeExist);

          // Deactivate Old Subscriptions of employee 
          await deactivateOldSubscriptions(isEnterpriseEmployeExist._id)

          // Update enterprise employee collection
          await enterpriseEmployeModel.updateOne({ _id: userId }, {isSubscribed:true});
        } else if (isEnterpriseUserExist) {
          console.log("isEnterpriseUserExist isSubscribed:true ---- ", isEnterpriseUserExist);

          // Deactivate Old Subscriptions of enterprise user 
          await deactivateOldSubscriptions(isEnterpriseUserExist._id)

          // Update enterprise user collection
          await enterpriseUser.updateOne({ _id: userId }, {isSubscribed:true});
        } else {
          // Handle case when user doesn't exist in any collection
          console.log("User not found in any collection");
        }
        console.log("subscribed ---------------");
      return;
    } catch (error) {
      console.error("Error updating UserSubscription:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };

  const deactivateOldSubscriptions = async (userId) => {
    try {
      // Fetch all subscriptions for the user, sorted by creation date
      const subscriptions = await UserSubscription.find({ userId }).sort({ createdAt: -1 }).exec();
  
      if (!subscriptions || subscriptions.length === 0) {
        console.log("No subscriptions found for user.");
        return;
      }
  
      // Keep the latest subscription active and deactivate others
      const latestSubscriptionId = subscriptions[0]._id;
      await UserSubscription.updateMany(
        { userId, _id: { $ne: latestSubscriptionId } }, // Exclude the latest subscription
        { $set: { isActive: false } }
      );
  
      console.log("Old subscriptions deactivated, latest subscription remains active.");
    } catch (error) {
      console.error("Error deactivating old subscriptions:", error);
      throw error;
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
  
  
// Import your deactivateExpiredSubscriptions function
const deactivateExpiredSubscriptions = async () => {
  try {
    const currentDate = new Date();

    // Find all subscriptions with endDate in the past and status as 'active'
    const expiredSubscriptions = await UserSubscription.find({
      status: 'active',
      endDate: { $lt: currentDate },
    }).exec();

    if (expiredSubscriptions.length === 0) {
      console.log("No expired subscriptions to deactivate.");
      return { message: "No expired subscriptions found." };
    }

    // Update the status of expired subscriptions to 'inactive'
    const updateResult = await UserSubscription.updateMany(
      { _id: { $in: expiredSubscriptions.map(sub => sub._id) } },
      { $set: { status: 'inactive' } }
    );

    console.log(`${updateResult.nModified} subscriptions deactivated successfully.`);
    return { message: `${updateResult.nModified} subscriptions deactivated successfully.` };
  } catch (error) {
    console.error("Error deactivating expired subscriptions:", error);
    throw error;
  }
};



module.exports = {
    findAll,
    findOneById,
    createUserSubscription,
    updateUserSubscriptionById,
    deleteUserSubscriptionById,
    updateSubscriptionStatus,
    updateSubscriptionStatusInUsers,
    deactivateOldSubscriptions,
    deactivateExpiredSubscriptions,
};