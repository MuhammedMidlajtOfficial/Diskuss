// services/ContactService.js
const Analytic  = require('../models/analytics/analytic.model');


/**
 * Find all Share
 */
const findAllShareByUserId = async () => {
    try {
        const contacts = await A.find().exec();
        return contacts;
    } catch (error) {
        console.error("Error fetching Contacts:", error);
        throw error; // Re-throw the error for higher-level handling if needed
    }
};

/**
 * Create a new Share
 * @returns {Promise<Object>} - Returns the created Contact.
 */
const createShare = async (ShareData) => {
    try {
        const newShare = await new Analytic.Share(ShareData);
        const savedShare = await newShare.save();
        return savedShare;
    } catch (error) {
        console.error("Error creating Share:", error);
        throw error;
    }
};

/**
 * Get an Contact by ID
 * @param {({ cardId, visitorId })<Object>} ContactId - The unique identifier of the Contact to retrieve.
 * @returns {Promise<Object>} - Returns the found Contact.
 * @throws {Error} - Throws an error if the Contact is not found.
 */
const findVisitor = async ({ cardId, visitorId }) => {
    try {

        const visitor = await Visitor.findOne({ cardId, visitorId });
        // const contact = await Contact.findById(ContactId).exec();
        if (!visitor) {
            throw new Error("Visitor not found");
        }
        return visitor;
    } catch (error) {
        console.error("Error fetching Visitor by ID:", error);
        throw error;
    }
};


module.exports = {
    findAllShareByUserId,
    createShare,
    findVisitor
}