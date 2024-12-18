const ServiceService = require('../services/service.service');


/**
 * Get all Service
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getServices = async (req, res) => {
    try {
        const Services = await ServiceService.findAll();
        return res.status(200).json({ Services });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

/**
 * Create a new Service
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
  * @example
  * {
  * "name": "IOT Monitoring",
 */
const createService = async (req,res)=>{

    try {
         // Destructure data from the request body
    const { name, status } = req.body;

    // Check if required fields are provided
    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    // Prepare Data to pass to the function
    const Data = { name, status };

    // Call the function to create a Service 
    const newService = await ServiceService.createService(Data);

    // Respond with success and the created 
    res.status(201).json({ message: "Service created successfully", service: newService });
        

    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
}


/**
 * Update a Service
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
const updateService = async (req, res) => {
    try {
      const { _id } = req.params; 
      console.log(_id);
      // Extract _id from request parameters
      const updateData = req.body;     // Extract update data from request body
  
      // Check if required fields are provided (if applicable)
      if (!updateData || Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No data provided for update." });
      }
  
      // Call the update function
      const updatedService = await ServiceService.updateServiceById(_id, updateData);
  
        console.log(updateService);
        
      // Respond with success and the updated 
      res.status(200).json({
        message: "Service  updated successfully",
        updatedService,
      });
    } catch (error) {
      console.error("Error updating Service:", error);
      return res.status(500).json({ error: error.message });
    }
  };


  /**
   * Delete a Service
   * @param {Request} req
   * @param {Response} res
   * @returns {Promise<Response>}
   */
  const deleteService = async (req, res) => {
    try {
      const { _id } = req.params; // Extract _id from request parameters
  
      // Call the delete function
      const deletedService = await ServiceService.deleteServiceById(_id);
  
      // Respond with success and the deleted  information
      res.status(200).json({
        message: "Service  deleted successfully",
        deletedService,
      });
    } catch (error) {
      console.error("Error deleting Service:", error);
      return res.status(500).json({ error: error.message });
    }
  };
  
module.exports = {
    getServices,
    createService,
    updateService,
    deleteService
};
