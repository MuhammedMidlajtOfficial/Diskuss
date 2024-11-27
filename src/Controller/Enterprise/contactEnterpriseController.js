const Contact = require('../../models/contact.enterprise.model');
const enterpriseEmployeModel = require('../../models/enterpriseEmploye.model');
const enterpriseUser = require('../../models/enterpriseUser');
const ContactService = require('../../services/contact.enterprise.service');

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

        if ( !name || !phnNumber || !contactOwnerId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        console.log('contactOwnerId:', contactOwnerId);

        let existUser;

        const EnterpriseUser = await enterpriseUser.findOne({ phnNumber });
        console.log('EnterpriseUser:', EnterpriseUser);
        const EnterpriseEmpUser = await enterpriseEmployeModel.findOne({ phnNumber });
        console.log('EnterpriseEmpUser:', EnterpriseEmpUser);

        existUser = EnterpriseUser || EnterpriseEmpUser;
        console.log('existUser:', existUser);

        let newContact;

        const contactDetails = {
            contactOwnerId,
            contactOwnerType: EnterpriseUser ? 'EnterpriseUser' : 'EnterpriseEmployee',
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
                isDiskussUser: !!existUser,
            }]
        };

        console.log('existUser._id:', existUser ? existUser?._id : 'existUser is null');
        console.log('contactDetails:', contactDetails);

        if (existUser && existUser?._id) {
            contactDetails.contacts[0].userId = existUser?._id;
        }

        newContact = await Contact.create(contactDetails);
        console.log('newContact:', newContact);

        console.log('existUser:', existUser);
        if (existUser?.userType !== 'employee') {
            const updateUser = await enterpriseUser.findById(contactOwnerId);
            console.log('updateUser:', updateUser);
            if (updateUser) {
                await enterpriseUser.updateOne(
                    { _id: contactOwnerId },
                    { $push: { contacts: newContact?._id } }
                );
                console.log('Updated contact owner with new contact ID:', newContact._id);
            } else {
                console.log('Contact owner not found');
                return res.status(404).json({ message: "Contact owner not found" });
            }
        }else{
            const updateUser = await enterpriseEmployeModel.findById(contactOwnerId);
            console.log('updateUser:', updateUser);
            if (updateUser) {
                await enterpriseEmployeModel.updateOne(
                    { _id: contactOwnerId },
                    { $push: { contacts: newContact?._id } }
                );
                console.log('Updated contact owner with new contact ID:', newContact._id);
            } else {
                console.log('Contact owner not found');
                return res.status(404).json({ message: "Contact owner not found" });
            }
        }

        return res.status(201).json({ message: "Contact created successfully", contact: newContact });
    } catch (e) {
        console.log('Error:', e);
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
        console.log(contacts);
        // if (!contacts || contacts.length === 0) {
        //     return res.status(200).json({ message: 'No Contacts found for this user' });
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