const SubscriptionPlanService = require('../../services/Subscription/subscriptionPlan.service');


/**
 * Get all SubscriptionPlan
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getSubscriptionPlans = async (req, res) => {
    try {
        const SubscriptionPlans = await SubscriptionPlanService.findAll();
        return res.status(200).json({ SubscriptionPlans });
    } catch (e) {
      const getSubscriptionPlanByPlanId = async (req, res) => {
      try { 
        const { plan_id } = req.params; // Extract plan_id from request parameters
  
        console.log(plan_id);
    
        // Call the function to get a SubscriptionPlan plan by plan_id
        const SubscriptionPlan = await SubscriptionPlanService.findOneByPlanId(plan_id);
    
        // Respond with the found plan
        res.status(200).json({ SubscriptionPlan });
      } catch (error) {
        console.error("Error getting Subscription Plan:", error);
        return res.status(500).json({ error: error.message });
      }
    };
  
        return res.status(500).json({ error: e.message });
    }
};


/**
 * get a single SubscriptionPlan by id
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getSubscriptionPlanById = async (req, res) => {
  try { 
    const { id } = req.params; // Extract plan_id from request parameters

    console.log("id: ", id);

    // Call the function to get a SubscriptionPlan plan by plan_id
    const SubscriptionPlan = await SubscriptionPlanService.findOneById(id);

    // Respond with the found plan
    res.status(200).json({ SubscriptionPlan });
  } catch (error) {
    console.error("Error getting Subscription Plan:", error);
    return res.status(500).json({ error: error.message });
  }
};



/**
 * get a single SubscriptionPlan
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getSubscriptionPlanByPlanId = async (req, res) => {
    try { 
      const { plan_id } = req.params; // Extract plan_id from request parameters

      console.log(plan_id);
  
      // Call the function to get a SubscriptionPlan plan by plan_id
      const SubscriptionPlan = await SubscriptionPlanService.findOneByPlanId(plan_id);
  
      // Respond with the found plan
      res.status(200).json({ SubscriptionPlan });
    } catch (error) {
      console.error("Error getting Subscription Plan:", error);
      return res.status(500).json({ error: error.message });
    }
  };



/**
 * Create a new SubscriptionPlan
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
const createSubscriptionPlan = async (req,res)=>{

    try {
        
         // Destructure plan data from the request body
    const { name, price, features, duration } = req.body;

    // Check if required fields are provided
    if (!name || !price || ! duration) {
      return res.status(400).json({ message: "Name, price and duration are required." });
    }

    // Prepare planData to pass to the function
    const planData = { name, price, features, duration };

    // Call the function to create a SubscriptionPlan plan
    const newPlan = await SubscriptionPlanService.createSubscriptionPlan(planData);

    // Respond with success and the created plan
    res.status(201).json({ message: "Subscription Plan created successfully", plan: newPlan });
        

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}


/**
 * Update a SubscriptionPlan
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
const updateSubscriptionPlan = async (req, res) => {
    try {
      const { plan_id } = req.params; 
      console.log("plain id: ",plan_id);
      // Extract plan_id from request parameters
      const updateData = req.body;     // Extract update data from request body
  
      // Check if required fields are provided (if applicable)
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No data provided for update." });
      }
  
      // Call the update function
      const updatedSubscriptionPlan = await SubscriptionPlanService.updateSubscriptionPlanByPlanId(plan_id, updateData);
  
        console.log(updateSubscriptionPlan);
        
      // Respond with success and the updated plan
      res.status(200).json({
        message: "Subscription Plan updated successfully",
        updatedSubscriptionPlan,
      });
    } catch (error) {
      console.error("Error updating SubscriptionPlan:", error);
      return res.status(500).json({ error: error.message });
    }
  };


  /**
   * Delete a SubscriptionPlan
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  const deleteSubscriptionPlan = async (req, res) => {
    try {
      const { plan_id } = req.params; // Extract plan_id from request parameters
  
      // Call the delete function
      const deletedSubscriptionPlan = await SubscriptionPlanService.deleteSubscriptionPlanByPlanId(plan_id);
  
      // Respond with success and the deleted plan information
      res.status(200).json({
        message: "Subscription Plan deleted successfully",
        deletedSubscriptionPlan,
      });
    } catch (error) {
      console.error("Error deleting SubscriptionPlan:", error);
      return res.status(500).json({ error: error.message });
    }
  };
  
module.exports = {
    getSubscriptionPlans,
    getSubscriptionPlanById,
    getSubscriptionPlanByPlanId,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan
};
