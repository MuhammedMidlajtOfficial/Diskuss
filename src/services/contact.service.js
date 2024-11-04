// services/ContactService.js
const Contact  = require('../models/contact.model');


/**
 * Find all Contacts
 * @returns {Promise<Contact[]>}
 */
const findAllContacts = async () => {
    try {
        const contacts = await Contact.find().exec();
        return contacts;
    } catch (error) {
        console.error("Error fetching Contacts:", error);
        throw error; // Re-throw the error for higher-level handling if needed
    }
};


/**
 * Get an Contact by ID
 * @param {String} ContactId - The unique identifier of the Contact to retrieve.
 * @returns {Promise<Object>} - Returns the found Contact.
 * @throws {Error} - Throws an error if the Contact is not found.
 */
const findContactById = async (ContactId) => {
    try {
        const contact = await Contact.findById(ContactId).exec();
        if (!contact) {
            throw new Error("Contact not found");
        }
        return contact;
    } catch (error) {
        console.error("Error fetching Contact by ID:", error);
        throw error;
    }
};


/**
 * Create a new Contact
 * @returns {Promise<Object>} - Returns the created Contact.
 */
const createContact = async (ContactData) => {
    try {
        const newContact = await new Contact(ContactData);
        const savedContact = await newContact.save();
        return savedContact;
    } catch (error) {
        console.error("Error creating Contact:", error);
        throw error;
    }
};

/**
 * Update an Contact by ID
 * @param {String} ContactId - The unique identifier of the Contact to update.
 * @param {Object} updateData - The data to update the Contact.
 * @returns {Promise<Object>} - Returns the updated Contact.
 * @throws {Error} - Throws an error if the Contact is not found or if there's an issue with the update.
 */
const updateContactById = async (ContactId, updateData) => {
    try {
        const updatedContact = await Contact.findByIdAndUpdate(ContactId, updateData, { new: true }).exec();
        if (!updatedContact) {
            throw new Error("Contact not found");
        }
        return updatedContact;
    } catch (error) {
        console.error("Error updating Contact:", error);
        throw error;
    }
};

/**
 * Delete an Contact by ID
 * @param {String} ContactId - The unique identifier of the Contact to delete.
 * @returns {Promise<Object>} - Returns the deleted Contact for confirmation.
 * @throws {Error} - Throws an error if the Contact is not found or if there's an issue with the deletion.
 */
const deleteContactById = async (ContactId) => {
    try {
        const deletedContact = await Contact.findByIdAndDelete(ContactId).exec();
        if (!deletedContact) {
            throw new Error("Contact not found");
        }
        return deletedContact; // Return the deleted Contact for confirmation
    } catch (error) {
        console.error("Error deleting Contact:", error);
        throw error;
    }
};

const findContactsByUserId = async (userId) => {
    try{
        const contact = await Contact.find ({userId: userId}).exec();
        if (!contact) {
            throw new Error("Contact not found");
        }
        return contact;
        
    } catch(error){
        console.error("Error fetching contacts by user id: ", error)
        throw error
    }
}


module.exports = {
    findAllContacts,
    findContactById,
    createContact,
    updateContactById,
    deleteContactById,
};