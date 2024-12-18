const {ReferralLevel} = require('../../models/referral.model');

/**
 * Find all Referral Levels
 * @returns {Promise<ReferralLevel[]>}
 */
const findAllReferralLevels = async () => {
    try {
        return await ReferralLevel.find().exec();
    } catch (error) {
        console.error("Error fetching referral levels:", error);
        throw error;
    }
};

/**
 * Get a Referral Level by ID
 * @param {String} levelId - The unique identifier of the Referral Level to retrieve.
 * @returns {Promise<Object>} - Returns the found Referral Level.
 * @throws {Error} - Throws an error if the Referral Level is not found.
 */
const findReferralLevelById = async (levelId) => {
    try {
        const level = await ReferralLevel.findById(levelId).exec();
        if (!level) {
            throw new Error("Referral Level not found");
        }
        return level;
    } catch (error) {
        console.error("Error fetching referral level by ID:", error);
        throw error;
    }
};

/**
 * Create a new Referral Level
 * @param {Object} levelData - The data for the new Referral Level.
 * @returns {Promise<Object>} - Returns the created Referral Level.
 */
const createReferralLevel = async (levelData) => {
    try {
        const newLevel = new ReferralLevel(levelData);
        return await newLevel.save();
    } catch (error) {
        console.error("Error creating referral level:", error);
        throw error;
    }
};

/**
 * Update a Referral Level by ID
 * @param {String} levelId - The unique identifier of the Referral Level to update.
 * @param {Object} updateData - The data to update the Referral Level.
 * @returns {Promise<Object>} - Returns the updated Referral Level.
 * @throws {Error} - Throws an error if the Referral Level is not found or if there's an issue with the update.
 */
const updateReferralLevelById = async (levelId, updateData) => {
    try {
        const updatedLevel = await ReferralLevel.findByIdAndUpdate(levelId, updateData, { new: true }).exec();
        if (!updatedLevel) {
            throw new Error("Referral Level not found");
        }
        return updatedLevel;
    } catch (error) {
        console.error("Error updating referral level:", error);
        throw error;
    }
};

/**
 * Delete a Referral Level by ID
 * @param {String} levelId - The unique identifier of the Referral Level to delete.
 * @returns {Promise<Object>} - Returns the deleted Referral Level for confirmation.
 * @throws {Error} - Throws an error if the Referral Level is not found or if there's an issue with the deletion.
 */
const deleteReferralLevelById = async (levelId) => {
    try {
        const deletedLevel = await ReferralLevel.findByIdAndDelete(levelId).exec();
        if (!deletedLevel) {
            throw new Error("Referral Level not found");
        }
        return deletedLevel; // Return the deleted Referral Level for confirmation
    } catch (error) {
        console.error("Error deleting referral level:", error);
        throw error; // Re-throw the error for higher-level handling
    }
};

module.exports = {
    findAllReferralLevels,
    findReferralLevelById,
    createReferralLevel,
    updateReferralLevelById,
    deleteReferralLevelById,
};