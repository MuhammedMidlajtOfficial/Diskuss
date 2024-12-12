const { individualUserCollection } = require('../../DBConfig');
const Contact = require('../../models/contact.individual.model');
const enterpriseEmployeModel = require('../../models/enterpriseEmploye.model');
const enterpriseUser = require('../../models/enterpriseUser');
const ContactService = require('../../services/contact.Individual.service');

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
            companyName,
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

        if ( !name || !phnNumber || !contactOwnerId ) {
            return res.status(400).json({ message: "All fields are required" });
        }
        console.log('contactOwnerId--', contactOwnerId);

        const existIndividualUser = await individualUserCollection.findOne({ phnNumber });
        const existEnterpriseUser = await enterpriseUser.findOne({ phnNumber });
        const existEnterpriseEmploye = await enterpriseEmployeModel.findOne({ phnNumber });

        let userId = null;
        let isDiskussUser = false;

        // Determine the user ID based on the type of user
        if (existIndividualUser) {
            userId = existIndividualUser._id;
            isDiskussUser = true;
        } else if (existEnterpriseUser) {
            userId = existEnterpriseUser._id;
            isDiskussUser = true;
        } else if (existEnterpriseEmploye) {
            userId = existEnterpriseEmploye._id;
            isDiskussUser = true;
        }

        console.log('userId-',userId);

        let newContact;

        const contactDetails = {
            contactOwnerId,
            contacts: [{
                name,
                companyName,
                designation,
                phnNumber,
                email,
                website,
                businessCategory,
                scheduled,
                scheduledTime,
                notes,
                userId: userId,  // Set the userId based on the type of user
                isDiskussUser: isDiskussUser
            }]
        };

        // Create the new contact
        newContact = await Contact.create(contactDetails);

        // Depending on the user type, add the contact to the correct collection
        if (existIndividualUser) {
            // Add the contact to individualUserCollection
            await individualUserCollection.updateOne(
                { _id: contactOwnerId },
                { $push: { contacts: newContact._id } }
            );
        } else if (existEnterpriseUser) {
            // Add the contact to enterpriseUserCollection
            await enterpriseUser.updateOne(
                { _id: contactOwnerId },
                { $push: { contacts: newContact._id } }
            );
        } else if (existEnterpriseEmploye) {
            // Add the contact to enterpriseEmployeeCollection
            await enterpriseEmployeModel.updateOne(
                { _id: contactOwnerId },
                { $push: { contacts: newContact._id } }
            );
        }

        return res.status(201).json({ message: "Contact created successfully", contact: newContact });
    } catch (e) {
        console.log(e);
        return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
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
        const {
            name,
            companyName,
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

        // Validate required fields
        if (!contactOwnerId || !name || !phnNumber) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Find the contact by its ID
        const contact = await Contact.findById(contact_id);
        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        // Check if the phnNumber exists for any user in the relevant collections
        const existIndividualUser = await individualUserCollection.findOne({ phnNumber });
        const existEnterpriseUser = await enterpriseUser.findOne({ phnNumber });
        const existEnterpriseEmploye = await enterpriseEmployeModel.findOne({ phnNumber });

        let userId = null;
        let isDiskussUser = false;

        // Determine the user ID based on the type of user
        if (existIndividualUser) {
            userId = existIndividualUser._id;
            isDiskussUser = true;
        } else if (existEnterpriseUser) {
            userId = existEnterpriseUser._id;
            isDiskussUser = true;
        } else if (existEnterpriseEmploye) {
            userId = existEnterpriseEmploye._id;
            isDiskussUser = true;
        }

        // Update the contact details with the new data
        const updatedContact = await Contact.findByIdAndUpdate(
            contact_id,
            {
                $set: {
                    name,
                    companyName,
                    designation,
                    phnNumber,
                    email,
                    website,
                    businessCategory,
                    scheduled,
                    scheduledTime,
                    notes,
                    userId,  // Update the userId based on the type of user
                    isDiskussUser,  // Update isDiskussUser based on user type
                },
            },
            { new: true } // Return the updated document
        );

        // If no contact is found to update
        if (!updatedContact) {
            return res.status(404).json({ message: 'Contact not found' });
        }

        // Depending on the user type, update the contact in the correct collection
        if (existIndividualUser) {
            // Update the individualUserCollection
            await individualUserCollection.updateOne(
                { _id: contactOwnerId },
                { $set: { "contacts.$[contact].phnNumber": phnNumber } },
                { arrayFilters: [{ "contact._id": contact_id }] }
            );
        } else if (existEnterpriseUser) {
            // Update the enterpriseUserCollection
            await enterpriseUser.updateOne(
                { _id: contactOwnerId },
                { $set: { "contacts.$[contact].phnNumber": phnNumber } },
                { arrayFilters: [{ "contact._id": contact_id }] }
            );
        } else if (existEnterpriseEmploye) {
            // Update the enterpriseEmployeeCollection
            await enterpriseEmployeModel.updateOne(
                { _id: contactOwnerId },
                { $set: { "contacts.$[contact].phnNumber": phnNumber } },
                { arrayFilters: [{ "contact._id": contact_id }] }
            );
        }

        return res.status(200).json({
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

        // Find the contact by its ID
        const contact = await Contact.findById(contact_id);
        if (!contact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        // Find the contactOwnerId
        const { contactOwnerId } = contact;

        // Find the associated user (individualUser, enterpriseUser, or enterpriseEmployee)
        const existIndividualUser = await individualUserCollection.findOne({ _id: contactOwnerId });
        const existEnterpriseUser = await enterpriseUser.findOne({ _id: contactOwnerId });
        const existEnterpriseEmploye = await enterpriseEmployeModel.findOne({ _id: contactOwnerId });

        // Remove the contact from the user's contacts array
        if (existIndividualUser) {
            await individualUserCollection.updateOne(
                { _id: contactOwnerId },
                { $pull: { contacts: contact_id } } // Remove the contact from the contacts array
            );
        } else if (existEnterpriseUser) {
            await enterpriseUser.updateOne(
                { _id: contactOwnerId },
                { $pull: { contacts: contact_id } } // Remove the contact from the contacts array
            );
        } else if (existEnterpriseEmploye) {
            await enterpriseEmployeModel.updateOne(
                { _id: contactOwnerId },
                { $pull: { contacts: contact_id } } // Remove the contact from the contacts array
            );
        }

        // Delete the contact from the Contact collection
        const deletedContact = await Contact.findByIdAndDelete(contact_id);

        // If the contact deletion fails
        if (!deletedContact) {
            return res.status(404).json({ message: "Contact not found" });
        }

        // Return success response
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
        const contacts = await Contact.find({ contactOwnerId: user_id }).exec();

        // if (!contacts || contacts.length === 0) {
        //     return res.status(404).json({ message: 'No Contacts found for this user' });
        // }

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