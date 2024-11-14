const Contact = require('../models/contact.individul.model');

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
 * Get a Contact by Owner ID and Contact ID
 * @param {String} contactOwnerId - The unique identifier of the contact owner.
 * @param {String} contactId - The unique identifier of the individual contact within contacts array.
 * @returns {Promise<Object>} - Returns the found contact object.
 * @throws {Error} - Throws an error if the contact is not found.
 */
const findContactById = async (contactOwnerId, contactId) => {
    try {
        const contactOwner = await Contact.find(contactOwnerId).exec();
        if (!contactOwner) {
            throw new Error("Contact owner not found");
        }
        const contact = contactOwner.contacts.id(contactId);
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
 * Create a new Contact for a Contact Owner
 * @param {String} contactOwnerId - The unique identifier of the contact owner.
 * @param {Object} contactData - The contact data to add.
 * @returns {Promise<Object>} - Returns the created Contact within the contacts array.
 */
const createContact = async (contactOwnerId, contactData) => {
    try {
        const contactOwner = await Contact.findById(contactOwnerId).exec();
        if (!contactOwner) {
            throw new Error("Contact owner not found");
        }
        contactOwner.contacts.push(contactData);
        await contactOwner.save();
        return contactOwner.contacts[contactOwner.contacts.length - 1]; // Return the last added contact
    } catch (error) {
        console.error("Error creating Contact:", error);
        throw error;
    }
};

/**
 * Update a Contact by Owner ID and Contact ID
 * @param {String} contactOwnerId - The unique identifier of the contact owner.
 * @param {String} contactId - The unique identifier of the contact to update.
 * @param {Object} updateData - The data to update the contact with.
 * @returns {Promise<Object>} - Returns the updated Contact within the contacts array.
 * @throws {Error} - Throws an error if the Contact is not found.
 */
const updateContact = async (contactOwnerId, contactId, updateData) => {
    try {
        const contactOwner = await Contact.findOne(contactOwnerId).exec();
        if (!contactOwner) {
            throw new Error("Contact owner not found");
        }
        const contact = contactOwner.contacts.id(contactId);
        if (!contact) {
            throw new Error("Contact not found");
        }
        Object.assign(contact, updateData); // Update contact fields with new data
        await contactOwner.save();
        return contact;
    } catch (error) {
        console.error("Error updating Contact:", error);
        throw error;
    }
};

/**
 * Delete a Contact by Owner ID and Contact ID
 * @param {String} contactOwnerId - The unique identifier of the contact owner.
 * @param {String} contactId - The unique identifier of the contact to delete.
 * @returns {Promise<Object>} - Returns the deleted Contact for confirmation.
 * @throws {Error} - Throws an error if the Contact is not found.
 */
const deleteContact = async (contactOwnerId, contactId) => {
    try {
        // Find the contact owner document
        const contactOwner = await Contact.findById(contactOwnerId).exec();
        
        // If the contact owner is not found, throw an error
        if (!contactOwner) {
            throw new Error("Contact owner not found");
        }
        
        // Find the specific contact in the contacts array
        const contact = contactOwner.contacts.id(contactId);
        
        // If the contact is not found, throw an error
        if (!contact) {
            throw new Error("Contact not found");
        }
        
        // Remove the contact from the array
        contact.remove();
        
        // Save the updated contact owner document
        await contactOwner.save();
        
        // Return the deleted contact for confirmation
        return contact;
    } catch (error) {
        console.error("Error deleting contact:", error);
        throw error;
    }
};


/**
 * Find all Contacts by Owner User ID
 * @param {String} userId - The unique identifier of the contact owner.
 * @returns {Promise<Object[]>} - Returns all contacts for a given owner.
 */
const findContactsByOwnerUserId = async (userId) => {
    try {
        const contactOwner = await Contact.findOne({ contactOwnerId: userId }).exec();
        if (!contactOwner) {
            throw new Error("Contact owner not found");
        }
        return contactOwner.contacts;
    } catch (error) {
        console.error("Error fetching contacts by user id:", error);
        throw error;
    }
};

/**
 * Find Contacts by Phone Number Search
 * @param {String} number - The phone number to search.
 * @returns {Promise<Object[]>} - Returns contacts matching the search.
 */
const findContactsByNumberSearch = async (number) => {
    try {
        const regex = new RegExp(number, 'i'); // 'i' for case-insensitive search
        const contactOwners = await Contact.find({ "contacts.phnNumber": regex }).populate('contactOwnerId').exec();
        
        // Flatten results to just matching contacts
        const matchingContacts = contactOwners.flatMap(contactOwner => 
            contactOwner.contacts.filter(contact => regex.test(contact.phnNumber))
        );

        return matchingContacts;
    } catch (error) {
        console.error("Error fetching contacts by phone number:", error);
        throw error;
    }
};

module.exports = {
    findAllContacts,
    findContactById,
    createContact,
    updateContact,
    deleteContact,
    findContactsByOwnerUserId,
    findContactsByNumberSearch
};