const { individualUserCollection } = require('../../DBConfig');
const Contact = require('../../models/contact.individual.model');
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
            cardImage,
            contactOwnerId,
        } = req.body;

        if ( !name || !phnNumber || !contactOwnerId) {
            return res.status(400).json({ message: "All fields are required" });
        }

        let existUser;

        const EnterpriseUser = await enterpriseUser.findOne({ phnNumber });
        const EnterpriseEmpUser = await enterpriseEmployeModel.findOne({ phnNumber });

        existUser = EnterpriseUser || EnterpriseEmpUser;

        let imageUrl = cardImage; // Default to provided image URL

        // Upload image to S3 if provided
        if (cardImage) {
        const imageBuffer = Buffer.from(
            cardImage.replace(/^data:image\/\w+;base64,/, ""),
            "base64"
        );
        const fileName = `${contactOwnerId}-${Date.now()}-businessCard.jpg`; // Unique file name

        try {
            const uploadResult = await uploadImageToS3(imageBuffer, fileName);
            imageUrl = uploadResult.Location; // S3 image URL
        } catch (uploadError) {
            throw new Error(`Failed to upload image: ${uploadError.message}`);
        }
        }
        
        let newContact;

        let contactDetails = {
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
                cardImage: imageUrl,
                isDiskussUser: !!existUser,
            }]
        };

        if (existUser && existUser?._id) {
            contactDetails.contacts[0].userId = existUser?._id;
        }

        newContact = await Contact.create(contactDetails);

        if (existUser?.userType !== 'employee') {
            const updateUser = await enterpriseUser.findById(contactOwnerId);
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

            if (updateUser) {
                await enterpriseEmployeModel.updateOne(
                    { _id: contactOwnerId },
                    { $push: { contacts: newContact?._id } }
                );
                console.log('Updated contact owner with new contact ID:', newContact._id);

                const enterpriseUserId = await enterpriseUser.findOne({ 'empIds.empId': contactOwnerId })
                if(!enterpriseUserId){
                    return res.status(400).json({ message: "Enterprise user not found",})
                }
                contactDetails.contactOwnerId = enterpriseUserId._id
                const newContactOfEnterprise = await Contact.create(contactDetails)
                if(newContactOfEnterprise){
                    await enterpriseUser.updateOne(
                        { _id: enterpriseUserId._id },
                        { $push: { contacts: newContactOfEnterprise?._id } }
                    );
                    console.log('Updated contact owner with new contact ID:', newContactOfEnterprise._id);
                }

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

// const createContact = async (req, res) => {
//     try {
//         const {
//             name,
//             companyName,
//             designation,
//             phnNumber,
//             email,
//             website,
//             businessCategory,
//             scheduled,
//             scheduledTime,
//             notes,
//             contactOwnerId,
//         } = req.body;

//         if (!name || !phnNumber || !contactOwnerId) {
//             return res.status(400).json({ message: "All fields are required" });
//         }
//         console.log('contactOwnerId--', contactOwnerId);

//         const existIndividualUser = await individualUserCollection.findOne({ phnNumber });
//         const existEnterpriseUser = await enterpriseUser.findOne({ phnNumber });
//         const existEnterpriseEmploye = await enterpriseEmployeModel.findOne({ phnNumber });

//         let userId = null;
//         let isDiskussUser = false;

//         // Determine the user ID based on the type of user
//         if (existIndividualUser) {
//             userId = existIndividualUser._id;
//             isDiskussUser = true;
//         } else if (existEnterpriseUser) {
//             userId = existEnterpriseUser._id;
//             isDiskussUser = true;
//         } else if (existEnterpriseEmploye) {
//             userId = existEnterpriseEmploye._id;
//             isDiskussUser = true;
//         }

//         const newContact = {
//             name,
//             companyName,
//             designation,
//             phnNumber,
//             email,
//             website,
//             businessCategory,
//             scheduled,
//             scheduledTime,
//             notes,
//             userId: userId,  // Set the userId based on the type of user
//             isDiskussUser: isDiskussUser
//         };

//         // Check if the contactOwnerId already has a contact document
//         const existingContact = await Contact.findOne({ contactOwnerId });
//         let createdContact;
        
//         if (existingContact) {
//             // If the contact document exists, update the contacts array
//             await Contact.updateOne(
//                 { contactOwnerId },
//                 { $push: { contacts: newContact } }
//             );
//         } else {
//             // If no existing contact document, create a new contact document
//             createdContact = await Contact.create({
//                 contactOwnerId,
//                 contacts: [newContact]
//             });
//         }

//         // Add the contact to the user's respective collection
//         if (existIndividualUser) {
//             // Add the contact to individualUserCollection
//             await individualUserCollection.updateOne(
//                 { _id: contactOwnerId },
//                 { $push: { contacts: existingContact ? existingContact._id : createdContact._id } }
//             );
//         } else if (existEnterpriseUser) {
//             // Add the contact to enterpriseUserCollection
//             await enterpriseUser.updateOne(
//                 { _id: contactOwnerId },
//                 { $push: { contacts: existingContact ? existingContact._id : createdContact._id } }
//             );
//         } else if (existEnterpriseEmploye) {
//             // Add the contact to enterpriseEmployeeCollection
//             await enterpriseEmployeModel.updateOne(
//                 { _id: contactOwnerId },
//                 { $push: { contacts: existingContact ? existingContact._id : createdContact._id } }
//             );
//         }

//         return res.status(201).json({ message: "Contact created or updated successfully" });
//     } catch (e) {
//         console.log(e);
//         return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
//     }
// };


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