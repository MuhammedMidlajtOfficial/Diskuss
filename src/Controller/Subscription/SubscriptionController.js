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

/**
 * Create a new Subscription
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 * @example
 * {
 * "name": "Basic",
 * "price": 100,
 * "features": ["Feature 1", "Feature 2"]
 * }
 * @example
 * {
 * "name": "Pro",
 * "price": 200,
 * "features": ["Feature 1", "Feature 2", "Feature 3"]
 * }
 * @example
 * {
 * "name": "Enterprise",
 * "price": 300,
 * "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
 * }
 */
const createSubscription = async (req,res)=>{

    try {
        
         // Destructure plan data from the request body
    const { name, price, features } = req.body;

    // Check if required fields are provided
    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required." });
    }

    // Prepare planData to pass to the function
    const planData = { name, price, features };

    // Call the function to create a subscription plan
    const newPlan = await subscriptionService.createSubscriptionPlan(planData);

    // Respond with success and the created plan
    res.status(201).json({ message: "Subscription plan created successfully", plan: newPlan });
        

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}


/**
 * Update a Subscription
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
const updateSubscription = async (req, res) => {
    try {
      const { plan_id } = req.params; 
      console.log(plan_id);
      // Extract plan_id from request parameters
      const updateData = req.body;     // Extract update data from request body
  
      // Check if required fields are provided (if applicable)
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No data provided for update." });
      }
  
      // Call the update function
      const updatedSubscription = await subscriptionService.updateSubscriptionByPlanId(plan_id, updateData);
  
        console.log(updateSubscription);
        
      // Respond with success and the updated plan
      res.status(200).json({
        message: "Subscription plan updated successfully",
        updatedSubscription,
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      return res.status(500).json({ error: error.message });
    }
  };


  /**
   * Delete a Subscription
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  const deleteSubscription = async (req, res) => {
    try {
      const { plan_id } = req.params; // Extract plan_id from request parameters
  
      // Call the delete function
      const deletedSubscription = await subscriptionService.deleteSubscriptionByPlanId(plan_id);
  
      // Respond with success and the deleted plan information
      res.status(200).json({
        message: "Subscription plan deleted successfully",
        deletedSubscription,
      });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      return res.status(500).json({ error: error.message });
    }
  };
  
module.exports = {
    getSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription
};
