// controllers/ContactController.js
const ContactService = require('../services/contact.service');
const Joi = require('joi');

// Define a schema for validating contact data
const contactSchema = Joi.object({
    name: Joi.string().required(),
    designation: Joi.string().optional(),
    mobile: Joi.string().required(),
    email: Joi.string().email().required(),
    website: Joi.string().optional(),
    businessCategory: Joi.string(),
    scheduled: Joi.boolean().default(false),
    scheduledTime: Joi.date().optional(),
    notes: Joi.string().optional(),
    userId: Joi.string(), // Optional if not required during creation
    contactOwnerId: Joi.string().required()
  });


/**
 * Get all Contacts
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getAllContacts = async (req, res) => {
    try {
        const Contacts = await ContactService.findAllContacts();
        return res.status(200).json({ Contacts });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};


/**
 * Get an Contact by ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getContactById = async (req, res) => {
    try {
      const { id } = req.params; // Extract id from request parameters
  
      // Call the service to get the Contact by ID
      const Contact = await ContactService.findContactById(id);
  
      if (!Contact) return res.status(404).json({ message: 'Contact not found' });
  
      return res.status(200).json(Contact);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
};


/**
 * Create a new Contact
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 * @example
 */
const createContact = async (req, res) => {
    try {

         // Validate incoming request body
        const { error } = contactSchema.validate(req.body);

        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const newContact = await ContactService.createContact(req.body);

        // Check if required fields are provided
        if (!newContact) {
            return res.status(400).json({ message: "All fields are required." });
        }

 
        // Respond with success and the created Contact
        res.status(201).json({ message: "Contact created successfully", Contact: newContact });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};

/**
 * Update an Contact
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const updateContact = async (req, res) => {
    try {

        // const { error } = contactSchema.validate(req.body);
  
        // if (error) {
        //   return res.status(400).json({ message: error.details[0].message });
        // }
        
        const { contact_id } = req.params; // Extract id from request parameters
        const updateData = req.body; // Extract update data from request body


        // Call the service to update the Contact
        const updatedContact = await ContactService.updateContact(contact_id, updateData);

        if (!updatedContact) return res.status(404).json({ message: 'Contact not found' });

        // Respond with success and the updated Contact
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
 * Delete an Contact
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const deleteContact = async (req, res) => {
    try {
      const { contact_id } = req.params; // Extract id from request parameters
  
      // Call the service to delete the Contact
      const deletedContact = await ContactService.deleteContact(contact_id);
  
      if (!deletedContact) return res.status(404).json({ message: 'Contact not found' });

      // Respond with success and the deleted information
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
 * Get Contacts by User ID
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getContactsByOwnerUserId = async (req, res) => {
    try {
        const { user_id } = req.params; // Extract referralId from request parameters
        const Contacts = await ContactService.findContactsByOwnerUserId(user_id);

        if (!Contacts || Contacts.length === 0) {
            return res.status(404).json({ message: 'No Contacts found for this user' });
        }

        return res.status(200).json(Contacts);
    } catch (error) {
        console.error("Error fetching Contacts by user ID:", error);
        return res.status(500).json({ error: error.message });
    }
};



module.exports = {
    getAllContacts,
    getContactById,
    createContact,
    updateContact,
    deleteContact,
    getContactsByOwnerUserId,
};