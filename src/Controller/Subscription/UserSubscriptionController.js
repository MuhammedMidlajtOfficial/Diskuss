const UserSubscriptionService = require('../../services/Subscription/userSubscription.service');
const { findOneByPlanId } = require('../../services/Subscription/subscriptionPlan.service');
/**
 * Get all UserSubscription
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getUserSubscriptions = async (req, res) => {
    try {
        const userSubscriptions = await UserSubscriptionService.findAll();
        return res.status(200).json({ userSubscriptions });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

<<<<<<< HEAD
const getUserSubscriptionByUserId = async (req, res) => {
    try {
        const { user_id } = req.params;
        const userSubscriptions = await UserSubscriptionService.findOneById(user_id);
        return res.status(200).json({ userSubscriptions });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}
=======
>>>>>>> Naren

/**
 * Create a new UserSubscription
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
    */
const createUserSubscription = async (req,res)=>{
    try {
    // Destructure plan data from the request body
    const { planId } = req.body;

    const userId = req.user._id; 

    console.log(`userId : ${userId} and planId : ${planId}`);
    // Check if required fields are provided
    if (!userId || !planId) {
      return res.status(400).json({ message: "User id and Plan id are required." });
    }

    const {startDate, endDate, newPlanId} = await getStartEndDate(planId);

    // Prepare userSubscription Data to pass to the function
    const userSubsciptionData = { userId: userId, planId : newPlanId, startDate: startDate, endDate : endDate, status: 'active' };

    // Call the function to create a UserSubscription plan
    const newUserSubsciptionData = await UserSubscriptionService.createUserSubscription(userSubsciptionData);

    // Respond with success and the created plan
    res.status(201).json({ message: "User Subscription plan created successfully", plan: newUserSubsciptionData });
        

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}


/**
 * Update a UserSubscription
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 * @example 
 * {
 * "name": "Basic",
 * "price": 100,
 * "features": ["Feature 1", "Feature 2"]
 * }
 */
const updateUserSubscription = async (req, res) => {
    try {
<<<<<<< HEAD
      const { userSubscription_id } = req.params; 
      // console.log("userSubscriptionId : ", userSubscription_id); // Extract userSubscriptionId from request parameters
=======
      const { userSubscriptionId } = req.params; 
      console.log(userSubscriptionId); // Extract userSubscriptionId from request parameters
>>>>>>> Naren
      const updateData = req.body;     // Extract update data from request body
  
      // Check if required fields are provided (if applicable)
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No data provided for update." });
      }
  
<<<<<<< HEAD
      //make it error free if we found the iinvalid enum in updateData
      if(updateData.status && !['active', 'inactive', 'canceled'].includes(updateData.status)){
        return res.status(400).json({ message: "Invalid status provided for update." });
      }

      // Call the update function
      const updatedUserSubscription = await UserSubscriptionService.updateUserSubscriptionById(userSubscription_id, updateData);
  
        // console.log(updateUserSubscription);
=======
      // Call the update function
      const updatedUserSubscription = await UserSubscriptionService.updateUserSubscriptionByPlanId(userSubscriptionId, updateData);
  
        console.log(updateUserSubscription);
>>>>>>> Naren
        
      // Respond with success and the updated plan
      res.status(200).json({
        message: "User Subscription plan updated successfully",
        updatedUserSubscription,
      });
    } catch (error) {
      console.error("Error updating User Subscription:", error);
      return res.status(500).json({ error: error.message });
    }
  };


  /**
   * Delete a UserSubscription
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  const deleteUserSubscription = async (req, res) => {
    try {
      const { plan_id } = req.params; // Extract plan_id from request parameters
  
      // Call the delete function
<<<<<<< HEAD
      const deletedUserSubscription = await UserSubscriptionService.deleteUserSubscriptionById(plan_id);
=======
      const deletedUserSubscription = await UserSubscriptionService.deleteUserSubscriptionByPlanId(plan_id);
>>>>>>> Naren
  
      // Respond with success and the deleted plan information
      res.status(200).json({
        message: "UserSubscription plan deleted successfully",
        deletedUserSubscription,
      });
    } catch (error) {
      console.error("Error deleting UserSubscription:", error);
      return res.status(500).json({ error: error.message });
    }
  };
  

const getStartEndDate = async (planId) => {

    console.log("deriving start and end date")
    const plan = (await findOneByPlanId(planId))
    const duration = plan.duration;
    const newPlanId = plan.id
    console.log(`Duration : ${duration}`);  
    console.log(`plan _id : ${newPlanId}`);  

     // Check if duration is a valid number
     if (typeof duration !== 'number' || isNaN(duration)) {
      throw new Error(`Invalid duration retrieved: ${duration}`);
  }

    const startDate = new Date();

    // Add duration to start date to get end date
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + duration);
  
    console.log(`Start Date : ${startDate} and End Date : ${endDate}`);
    return {startDate, endDate, newPlanId};
};

module.exports = {
    getUserSubscriptions,
<<<<<<< HEAD
    getUserSubscriptionByUserId,
=======
>>>>>>> Naren
    createUserSubscription,
    updateUserSubscription,
    deleteUserSubscription
};
