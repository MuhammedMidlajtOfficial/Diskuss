const { individualUserCollection } = require('../DBConfig');
const Contact = require('../models/contact.model');
const enterpriseEmployeModel = require('../models/enterpriseEmploye.model');
const enterpriseUser = require('../models/enterpriseUser');
const ContactService = require('../services/contact.service');

/**
 * Get all Contacts
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getAllContacts = async (req, res) => {
    try {
        const contacts = await ContactService.findAllContacts();
        return res.status(200).json({ contacts });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

/**
 * Get a Contact by ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getContactById = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await ContactService.findContactById(id);

        if (!contact) return res.status(404).json({ message: 'Contact not found' });

        return res.status(200).json(contact);
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

/**
 * Create a new Contact
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const createContact = async (req, res) => {
    try {
        const {
            name,
            designation,
            phnNumber,
            email,
            website,
            businessCategory,
            scheduled,
            scheduledTime,
            notes,
            contactOwnerId,
        } = req.body;

        if (!email || !name || !phnNumber || !contactOwnerId) {
            return res.status(400).json({ message: "All fields are required" });
        }
        console.log('contactOwnerId',contactOwnerId);

        let existUser;

        const IndividualUser = await individualUserCollection.findOne({ phnNumber });
        const EnterpriseUser = await enterpriseUser.findOne({ phnNumber });
        const EnterpriseEmpUser = await enterpriseEmployeModel.findOne({ phnNumber });

        existUser = IndividualUser || EnterpriseUser || EnterpriseEmpUser;

        let newContact;

        if (existUser) {
            const contactDetails = {
                contactOwnerId,
                contacts: [{
                    name,
                    designation,
                    phnNumber,
                    email,
                    website,
                    businessCategory,
                    scheduled,
                    scheduledTime,
                    notes,
                    userId: existUser._id,
                    isDiskussUser: true
                }]
            };
            
            newContact = await Contact.create(contactDetails); // Create the document without nesting in another object
        
            await individualUserCollection.updateOne(
                { _id: contactOwnerId },
                { $push: { contacts: newContact._id } }
            );
        } else {
            const contactDetails = {
                contactOwnerId,
                contacts: [{
                    name,
                    designation,
                    phnNumber,
                    email,
                    website,
                    businessCategory,
                    scheduled,
                    scheduledTime,
                    notes,
                    isDiskussUser: false
                }]
            };
        
            newContact = await Contact.create(contactDetails); // Create without an extra nesting level
        }
        return res.status(201).json({ message: "Contact created successfully", contact: newContact });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

/**
 * Update a Contact
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const updateContact = async (req, res) => {
    try {
        const { contact_id } = req.params;
        const updateData = req.body;

        const updatedContact = await ContactService.updateContact(contact_id, updateData);

        if (!updatedContact) return res.status(404).json({ message: 'Contact not found' });

        res.status(200).json({
            message: "Contact updated successfully",
            updatedContact,
        });
    } catch (error) {
        console.error("Error updating Contact:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Delete a Contact
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const deleteContact = async (req, res) => {
    try {
        const { contact_id } = req.params;

        const deletedContact = await ContactService.deleteContact(contact_id);

        if (!deletedContact) return res.status(404).json({ message: 'Contact not found' });

        res.status(200).json({
            message: "Contact deleted successfully",
            deletedContact,
        });
    } catch (error) {
        console.error("Error deleting Contact:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Get Contacts by Owner User ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getContactsByOwnerUserId = async (req, res) => {
    try {
        const { user_id } = req.params;
        const contacts = await ContactService.findContactsByOwnerUserId(user_id);

        if (!contacts || contacts.length === 0) {
            return res.status(404).json({ message: 'No Contacts found for this user' });
        }

        return res.status(200).json(contacts);
    } catch (error) {
        console.error("Error fetching Contacts by user ID:", error);
        return res.status(500).json({ error: error.message });
    }
};

/**
 * Search Contacts by Number
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getSearchedContact = async (req, res) => {
    const { number } = req.query;

    if (!number) {
        return res.status(400).json({ message: 'Number query parameter is required.' });
    }
    try {
        const results = await ContactService.findContactsByNumberSearch(number);
        res.status(200).json(results);
    } catch (error) {
        console.error("Error fetching contacts by search query");
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    getContactsByOwnerUserId,
    getSearchedContact
};