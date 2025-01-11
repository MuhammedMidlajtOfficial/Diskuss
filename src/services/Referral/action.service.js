// services/actionService.js
const {Action} = require('../../models/referral/referral.model');

/**
 * Find all Actions
 * @returns {Promise<Action[]>}
 */
const findAllActions = async () => {
    try {
        const actions = await Action.find().exec();
        return actions;
    } catch (error) {
        console.error("Error fetching actions:", error);
        throw error; // Re-throw the error for higher-level handling if needed
    }
};


/**
 * Get an Action by ID
 * @param {String} actionId - The unique identifier of the Action to retrieve.
 * @returns {Promise<Object>} - Returns the found Action.
 * @throws {Error} - Throws an error if the Action is not found.
 */
const findActionById = async (actionId) => {
    try {
        const action = await Action.findById(actionId).exec();
        if (!action) {
            throw new Error("Action not found");
        }
        return action;
    } catch (error) {
        console.error("Error fetching action by ID:", error);
        throw error;
    }
};


/**
 * Create a new Action
 * @param {Object} actionData - The action data.
 * @param {String} actionData.referralId - ID of the associated referral.
 * @param {String} actionData.actionType - Type of action performed.
 * @returns {Promise<Object>} - Returns the created Action.
 */
const createAction = async (actionData) => {
    try {
        const newAction = new Action(actionData);
        const savedAction = await newAction.save();
        return savedAction;
    } catch (error) {
        console.error("Error creating action:", error);
        throw error;
    }
};

/**
 * Update an Action by ID
 * @param {String} actionId - The unique identifier of the Action to update.
 * @param {Object} updateData - The data to update the Action.
 * @returns {Promise<Object>} - Returns the updated Action.
 * @throws {Error} - Throws an error if the Action is not found or if there's an issue with the update.
 */
const updateActionById = async (actionId, updateData) => {
    try {
        const updatedAction = await Action.findByIdAndUpdate(actionId, updateData, { new: true }).exec();
        if (!updatedAction) {
            throw new Error("Action not found");
        }
        return updatedAction;
    } catch (error) {
        console.error("Error updating action:", error);
        throw error;
    }
};

/**
 * Delete an Action by ID
 * @param {String} actionId - The unique identifier of the Action to delete.
 * @returns {Promise<Object>} - Returns the deleted Action for confirmation.
 * @throws {Error} - Throws an error if the Action is not found or if there's an issue with the deletion.
 */
const deleteActionById = async (actionId) => {
    try {
        const deletedAction = await Action.findByIdAndDelete(actionId).exec();
        if (!deletedAction) {
            throw new Error("Action not found");
        }
        return deletedAction; // Return the deleted Action for confirmation
    } catch (error) {
        console.error("Error deleting action:", error);
        throw error;
    }
};



/**
 * Find Actions by Referral ID
 * @param {String} referralId - The unique identifier of the referral.
 * @returns {Promise<Action[]>}
 */
const findActionsByReferralId = async (referralId) => {
    try {
        return await Action.find({ referralId }).exec(); // Query actions based on referralId
    } catch (error) {
        console.error("Error fetching actions for referral:", error);
        throw error;
    }
};




module.exports = {
    findAllActions,
    findActionById,
    createAction,
    updateActionById,
    deleteActionById,
    findActionsByReferralId,
};