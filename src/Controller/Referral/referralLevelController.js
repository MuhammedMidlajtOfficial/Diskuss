const ReferralLevelService = require('../../services/Referral/referralLevel.service');

/**
 * Get all Referral Levels
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getRefLevels = async (req, res) => {
    try {
        const levels = await ReferralLevelService.findAllReferralLevels();
        return res.status(200).json({ levels });
    } catch (error) {
        console.error("Error fetching referral levels:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Get a Referral Level by ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getRefLevelById = async (req, res) => {
    try {
        const { id } = req.params; // Extract ID from request parameters
        const level = await ReferralLevelService.findReferralLevelById(id);

        if (!level) {
            return res.status(404).json({ message: 'Referral Level not found' });
        }

        return res.status(200).json(level);
    } catch (error) {
        console.error("Error fetching referral level by ID:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Create a new Referral Level
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 * @example
 * {
 *   "level": 1,
 *   "referralCountRequired": 5,
 *   "rewardAmount": 50.00
 * }
 */
const createRefLevel = async (req, res) => {
    try {
        const levelData = req.body; // Extract data from request body

        // Check if required fields are provided
        if (!levelData.level || !levelData.referralCountRequired || !levelData.rewardAmount) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const newLevel = await ReferralLevelService.createReferralLevel(levelData);
        return res.status(201).json({ message: "Referral Level created successfully", level: newLevel });
    } catch (error) {
        console.error("Error creating referral level:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Update a Referral Level by ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const updateRefLevel = async (req, res) => {
    try {
        const { id } = req.params; // Extract ID from request parameters
        const updateData = req.body; // Extract update data from request body

        // Check if any data is provided for update
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: "No data provided for update." });
        }

        const updatedLevel = await ReferralLevelService.updateReferralLevelById(id, updateData);

        if (!updatedLevel) {
            return res.status(404).json({ message: 'Referral Level not found' });
        }

        return res.status(200).json({
            message: "Referral Level updated successfully",
            level: updatedLevel,
        });
    } catch (error) {
        console.error("Error updating referral level:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Delete a Referral Level by ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const deleteRefLevel = async (req, res) => {
    try {
        const { id } = req.params; // Extract ID from request parameters

        const deletedLevel = await ReferralLevelService.deleteReferralLevelById(id);

        if (!deletedLevel) {
            return res.status(404).json({ message: 'Referral Level not found' });
        }

        return res.status(200).json({
            message: "Referral Level deleted successfully",
            level: deletedLevel,
        });
    } catch (error) {
        console.error("Error deleting referral level:", error);
        return res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getRefLevels,
    getRefLevelById,
    createRefLevel,
    updateRefLevel,
    deleteRefLevel,
};