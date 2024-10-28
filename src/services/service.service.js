const Service = require('../models/service.model');

/**
 * Find all Subscsriptions
 * @returns {Promise<Service[]>}
 */
const findAll = async () => {
  try {
    const Services = await Service.find().exec();
    // console.log(Services);
    return Services;
  } catch (error) {
    console.error("Error fetching Services plan:", error);
    throw error; // Re-throw the error for higher-level handling if needed
  }
  };  

  
/**
 * Create al Service
 * * Create a new Service plan.
 * @param {Object} planData - The Service plan data.
 * @param {String} planData.name - Name of the plan.
 * @param {Decimal128} planData.price - Price of the plan.
 * @param {Mixed} planData.features - JSON object for plan features.
 * @returns {Promise<Object>} - Returns the created Service plan.
 */
  const createService = async (planData) => {
    try {
      // Prepare the Service data with unique plan_id
      const newPlan = new Service({
        name: planData.name,
        price: planData.price,
        features: planData.features || {}
      });
  
      // Save the new Service plan to the database
      const savedPlan = await newPlan.save();
      return savedPlan;
    } catch (error) {
      console.error("Error creating Service plan:", error);
      throw error;
    }
  };


/**
 * Update a Service plan by plan_id.
 * @param {String} plan_id - The unique identifier of the Service plan to update.
 * @param {Object} updateData - The data to update the Service plan.
 * @param {String} [updateData.name] - New name of the plan (optional).
 * @param {Decimal128} [updateData.price] - New price of the plan (optional).
 * @param {Mixed} [updateData.features] - New features for the plan (optional).
 * @returns {Promise<Object>} - Returns the updated Service plan.
 * @throws {Error} - Throws an error if the Service plan is not found or if there's an issue with the update.
 */
  const updateServiceById = async (plan_id, updateData) => {
    try {
      console.log(plan_id);
      
      const Service = await Service.findOne({plan_id:plan_id}).exec();
       
      console.log(Service);
      
      if (!Service) {
        throw new Error("Service plan not found");
      }
      const updatedService = await Service.findOneAndUpdate(
        { plan_id },
        { $set: updateData },
        { new: true }
      ).exec(); // Find and update the Service plan

      updatedService.save(); // Save the updated Service plan

  
      return updatedService; // Return the updated Service
    } catch (error) {
      console.error("Error updating Service:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };

  
/**
 * Delete a Service plan by plan_id.
 * @param {String} plan_id - The unique identifier of the Service plan to delete.
 * @returns {Promise<Object>} - Returns the deleted Service plan for confirmation.
 * @throws {Error} - Throws an error if the Service plan is not found or if there's an issue with the deletion.
 */
  const deleteServiceById = async (plan_id) => {
    try {
      const deletedService = await Service.findOneAndDelete({ plan_id }).exec();
  
      if (!deletedService) {
        throw new Error("Service plan not found");
      }
  
      return deletedService; // Return the deleted Service for confirmation
    } catch (error) {
      console.error("Error deleting Service:", error);
      throw error; // Re-throw the error for higher-level handling
    }
  };
  
  




module.exports = {
    findAll,
    createService,
    updateServiceById,
    deleteServiceById
};