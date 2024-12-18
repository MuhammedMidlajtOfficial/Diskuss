// controllers/actionController.js
const ActionService = require('../../services/Referral/action.service');

/**
 * Get all Actions
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getAllActions = async (req, res) => {
    try {
        const actions = await ActionService.findAllActions();
        return res.status(200).json({ actions });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};


/**
 * Get an Action by ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getActionById = async (req, res) => {
    try {
      const { id } = req.params; // Extract id from request parameters
  
      // Call the service to get the action by ID
      const action = await ActionService.findActionById(id);
  
      if (!action) return res.status(404).json({ message: 'Action not found' });
  
      return res.status(200).json(action);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
};


/**
 * Create a new Action
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 * @example
 * {
 *   "referralId": "ObjectId",
 *   "actionType": "sign-up"
 * }
 */
const createAction = async (req, res) => {
    try {
        const { referralId, actionType } = req.body;

        // Check if required fields are provided
        if (!referralId || !actionType) {
            return res.status(400).json({ message: "All fields are required." });
        }

        // Prepare data to pass to the service function
        const actionData = { referralId, actionType };

        // Call the service to create an action
        const newAction = await ActionService.createAction(actionData);

        // Respond with success and the created action
        res.status(201).json({ message: "Action created successfully", action: newAction });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

/**
 * Update an Action
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const updateAction = async (req, res) => {
    try {
        const { id } = req.params; // Extract id from request parameters
        const updateData = req.body; // Extract update data from request body

        // Check if required fields are provided (if applicable)
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No data provided for update." });
        }

        // Call the service to update the action
        const updatedAction = await ActionService.updateAction(id, updateData);

        if (!updatedAction) return res.status(404).json({ message: 'Action not found' });

        // Respond with success and the updated action
        res.status(200).json({
            message: "Action updated successfully",
            updatedAction,
        });
    } catch (error) {
      console.error("Error updating Action:", error);
      return res.status(500).json({ error: error.message });
    }
};

/**
 * Delete an Action
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const deleteAction = async (req, res) => {
    try {
      const { id } = req.params; // Extract id from request parameters
  
      // Call the service to delete the action
      const deletedAction = await ActionService.deleteAction(id);
  
      if (!deletedAction) return res.status(404).json({ message: 'Action not found' });

      // Respond with success and the deleted information
      res.status(200).json({
          message: "Action deleted successfully",
          deletedAction,
      });
    } catch (error) {
      console.error("Error deleting Action:", error);
      return res.status(500).json({ error: error.message });
    }
};


/**
 * Get Actions by Referral ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getActionsByReferralId = async (req, res) => {
    try {
        const { referralId } = req.params; // Extract referralId from request parameters
        const actions = await ActionService.findActionsByReferralId(referralId);

        if (!actions || actions.length === 0) {
            return res.status(404).json({ message: 'No actions found for this referral' });
        }

        return res.status(200).json(actions);
    } catch (error) {
        console.error("Error fetching actions by referral ID:", error);
        return res.status(500).json({ error: error.message });
    }
};



module.exports = {
    getAllActions,
    getActionById,
    createAction,
    updateAction,
    deleteAction,
    getActionsByReferralId,
};