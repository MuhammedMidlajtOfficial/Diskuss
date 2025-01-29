const { individualUserCollection } = require("../../DBConfig");
const Contact = require("../../models/contacts/contact.individual.model");
const enterpriseEmployeModel = require("../../models/users/enterpriseEmploye.model");
const enterpriseUser = require("../../models/users/enterpriseUser");
const ContactService = require("../../services/contact.Individual.service");
const { uploadImageToS3ForContact, deleteImageFromS3ForContact } = require("../../services/AWS/s3Bucket");

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

    if (!contact) return res.status(404).json({ message: "Contact not found" });

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
      location,
      businessCategory,
      scheduled,
      scheduledTime,
      notes,
      cardFrontImage,
      cardBackImage,
      contactOwnerId,
    } = req.body;

    console.log("body:", req.body);

    if (!name || !phnNumber || !contactOwnerId) {
      return res.status(400).json({ message: "All fields are required" });
    }
    console.log("contactOwnerId--", contactOwnerId);

    const existIndividualUserNumber = await individualUserCollection.findOne({
      phnNumber,
    });
    const existEnterpriseUserNumber = await enterpriseUser.findOne({
      phnNumber,
    });
    const existEnterpriseEmployeNumber = await enterpriseEmployeModel.findOne({
      phnNumber,
    });

    let userId = null;
    let isDiskussUser = false;

    // Determine the user ID based on the type of user
    if (existIndividualUserNumber) {
      userId = existIndividualUserNumber._id;
      isDiskussUser = true;
    } else if (existEnterpriseUserNumber) {
      userId = existEnterpriseUserNumber._id;
      isDiskussUser = true;
    } else if (existEnterpriseEmployeNumber) {
      userId = existEnterpriseEmployeNumber._id;
      isDiskussUser = true;
    }

    console.log("userId-", userId);
    const cardImage = {
      front: '',
      back: '',
    };

    // Upload card front image to S3 if provided
    if (cardFrontImage) {
      const frontImageBuffer = Buffer.from(
        cardFrontImage.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const frontFileName = `${contactOwnerId}-${Date.now()}-cardFront.jpg`;

      try {
        const frontUploadResult = await uploadImageToS3ForContact(
          frontImageBuffer,
          frontFileName
        );
        cardImage.front = frontUploadResult.Location; // S3 front image URL
      } catch (uploadError) {
        throw new Error(`Failed to upload front card image: ${uploadError.message}`);
      }
    }

    // Upload card back image to S3 if provided
    if (cardBackImage) {
      const backImageBuffer = Buffer.from(
        cardBackImage.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const backFileName = `${contactOwnerId}-${Date.now()}-cardBack.jpg`;

      try {
        const backUploadResult = await uploadImageToS3ForContact(
          backImageBuffer,
          backFileName
        );
        cardImage.back = backUploadResult.Location; // S3 back image URL
      } catch (uploadError) {
        throw new Error(`Failed to upload back card image: ${uploadError.message}`);
      }
    }

    const contactDetails = {
      contactOwnerId,
      contacts: [
        {
          name,
          companyName,
          designation,
          phnNumber,
          email,
          website,
          businessCategory,
          location,
          scheduled,
          scheduledTime,
          notes,
          cardImage, // Assign the cardImage object here
          userId: userId, // Set the userId based on the type of user
          isDiskussUser: isDiskussUser,
        },
      ],
    };

    // Create the new contact
    const newContact = await Contact.create(contactDetails);

    const existIndividualUser = await individualUserCollection.findOne({
      _id: contactOwnerId,
    });
    const existEnterpriseUser = await enterpriseUser.findOne({
      _id: contactOwnerId,
    });
    const existEnterpriseEmploye = await enterpriseEmployeModel.findOne({
      _id: contactOwnerId,
    });

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

      const enterpriseUserId = await enterpriseUser
        .findOne({ "empIds.empId": contactOwnerId })
        .select("_id");
      if (!enterpriseUserId) {
        return res.status(400).json({ message: "Enterprise user not found" });
      }
      contactDetails.contactOwnerId = enterpriseUserId._id;
      const newContactOfEnterprise = await Contact.create(contactDetails);
      if (newContactOfEnterprise) {
        await enterpriseUser.updateOne(
          { _id: enterpriseUserId._id },
          { $push: { contacts: newContactOfEnterprise?._id } }
        );
        console.log(
          "Updated contact owner with new contact ID:",
          newContactOfEnterprise._id
        );
      } else {
        console.log("Updated contact failed");
      }
    }

    return res
      .status(201)
      .json({ message: "Contact created successfully", contact: newContact });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "An unexpected error occurred. Please try again later.",
    });
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
          location,
          businessCategory,
          scheduled,
          scheduledTime,
          cardFrontImage,
          cardBackImage,
          notes,
          contactOwnerId,
      } = req.body;

      // Validate required fields
      if (!contactOwnerId || !name || !phnNumber) {
          return res.status(400).json({ message: "All fields are required" });
      }

      // Check if the contact exists
      const contact = await Contact.findOne({ _id: contact_id });
      if (!contact) {
          return res.status(404).json({ message: "Contact not found" });
      }

      // Check if the phone number exists in any user
      const existIndividualUser = await individualUserCollection.findOne({ phnNumber });
      const existEnterpriseUser = await enterpriseUser.findOne({ phnNumber });
      const existEnterpriseEmploye = await enterpriseEmployeModel.findOne({ phnNumber });

      let userId = null;
      let isDiskussUser = false;

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

      let cardImage = {
          front: contact?.cardImage?.front || "",
          back: contact?.cardImage?.back || "",
      };

      // Upload front image to S3 if provided
      if (cardFrontImage) {
          if (contact.cardImage?.front) {
              await deleteImageFromS3ForContact(contact.cardImage.front);
          }

          const frontImageBuffer = Buffer.from(
              cardFrontImage.replace(/^data:image\/\w+;base64,/, ""),
              "base64"
          );
          const frontFileName = `${contactOwnerId}-${Date.now()}-cardFront.jpg`;

          try {
              const frontUploadResult = await uploadImageToS3ForContact(frontImageBuffer, frontFileName);
              cardImage.front = frontUploadResult.Location;
          } catch (uploadError) {
              throw new Error(`Failed to upload front card image: ${uploadError.message}`);
          }
      }

      // Upload back image to S3 if provided
      if (cardBackImage) {
          if (contact.cardImage?.back) {
              await deleteImageFromS3ForContact(contact.cardImage.back);
          }

          const backImageBuffer = Buffer.from(
              cardBackImage.replace(/^data:image\/\w+;base64,/, ""),
              "base64"
          );
          const backFileName = `${contactOwnerId}-${Date.now()}-cardBack.jpg`;

          try {
              const backUploadResult = await uploadImageToS3ForContact(backImageBuffer, backFileName);
              cardImage.back = backUploadResult.Location;
          } catch (uploadError) {
              throw new Error(`Failed to upload back card image: ${uploadError.message}`);
          }
      }

      // Update contact details
      const updatedContact = await Contact.updateOne(
          {
              _id: contact_id,
              "contacts._id": contact.contacts[0]._id,
          },
          {
              $set: {
                  "contacts.$.name": name,
                  "contacts.$.companyName": companyName,
                  "contacts.$.designation": designation,
                  "contacts.$.phnNumber": phnNumber,
                  "contacts.$.email": email,
                  "contacts.$.website": website,
                  "contacts.$.location": location,
                  "contacts.$.businessCategory": businessCategory,
                  "contacts.$.scheduled": scheduled,
                  "contacts.$.scheduledTime": scheduledTime,
                  "contacts.$.notes": notes,
                  "contacts.$.cardImage": cardImage,
                  "contacts.$.userId": userId,
                  "contacts.$.isDiskussUser": isDiskussUser,
              },
          }
      );

      if (updatedContact.matchedCount === 0) {
          return res.status(404).json({ message: "No contact found to update" });
      }

      // Depending on the user type, update the contact in the relevant collection
      const updateQuery = { _id: contactOwnerId };
      const updateData = { $set: { "contacts.$[contact].phnNumber": phnNumber } };
      const arrayFilters = [{ "contact._id": contact_id }];

      if (existIndividualUser) {
          await individualUserCollection.updateOne(updateQuery, updateData, { arrayFilters });
      } else if (existEnterpriseUser) {
          await enterpriseUser.updateOne(updateQuery, updateData, { arrayFilters });
      } else if (existEnterpriseEmploye) {
          await enterpriseEmployeModel.updateOne(updateQuery, updateData, { arrayFilters });
      }

      return res.status(200).json({ message: "Contact updated successfully" });

  } catch (error) {
      console.error("Error updating Contact:", error.message);
      return res.status(500).json({ error: "Internal Server Error" });
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
    const existIndividualUser = await individualUserCollection.findOne({
      _id: contactOwnerId,
    });
    const existEnterpriseUser = await enterpriseUser.findOne({
      _id: contactOwnerId,
    });
    const existEnterpriseEmploye = await enterpriseEmployeModel.findOne({
      _id: contactOwnerId,
    });

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

    let imageUrl = contact.image; // Default to existing image if no new image is provided
    
    // Upload new image and delete old image if needed
    if (imageUrl) {
      if (contact.image) {
        await deleteImageFromS3ForContact(contact.image); // Delete old image
      }
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

    // If no contacts are found, return a 404 response (optional, uncomment if needed)
    // if (!contacts || contacts.length === 0) {
    //     return res.status(404).json({ message: 'No Contacts found for this user' });
    // }

    // Fetch user image for each contact's userId
    const enrichedContacts = await Promise.all(
      contacts.map(async (contact) => {
        // Clone the contact object to avoid mutating the original
        const enrichedContact = { ...contact._doc };

        // Iterate over all contacts in the 'contacts' array
        enrichedContact.contacts = await Promise.all(
          contact.contacts.map(async (individualContact) => {
            // Fetch image from one of the collections
            let userWithImage = null;

            if (individualContact.userId) {
              userWithImage =
                (await individualUserCollection.findById(
                  individualContact.userId,
                  "image"
                )) ||
                (await enterpriseUser.findById(
                  individualContact.userId,
                  "image"
                )) ||
                (await enterpriseEmployeModel.findById(
                  individualContact.userId,
                  "image"
                ));
            }

            // Add the image (if found) to the individual contact
            return {
              name: individualContact.name,
              companyName: individualContact.companyName,
              designation: individualContact.designation,
              phnNumber: individualContact.phnNumber,
              email: individualContact.email,
              website: individualContact.website,
              businessCategory: individualContact.businessCategory,
              scheduled: individualContact.scheduled,
              scheduledTime: individualContact.scheduledTime,
              location: individualContact.location,
              notes: individualContact.notes,
              userId: individualContact.userId,
              isDiskussUser: individualContact.isDiskussUser,
              cardImage: individualContact.cardImage,
              image: userWithImage?.image || null, // Include the image or null if not found
            };
          })
        );

        return enrichedContact;
      })
    );

    return res.status(200).json(enrichedContacts);
  } catch (error) {
    console.error("Error fetching Contacts with images by user ID:", error);
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
    return res
      .status(400)
      .json({ message: "Number query parameter is required." });
  }
  try {
    const results = await ContactService.findContactsByNumberSearch(number);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching contacts by search query");
    return res.status(500).json({ error: error.message });
  }
};

const createPhoneContacts = async (req, res) => {
  try {
    const { contactOwnerId, contacts } = req.body;

    if (!contactOwnerId || !Array.isArray(contacts)) {
      return res.status(400).json({ 
        message: "Contact owner ID and contacts array are required" 
      });
    }

    // Array to store valid contacts that match with database users
    const validContacts = [];
    const invalidContacts = [];

    // Check each contact's phone number against all collections
    for (const contact of contacts) {
      const { phnNumber, name } = contact;
      
      if (!phnNumber || !name) {
        invalidContacts.push({ phnNumber, name, reason: "Missing required fields" });
        continue;
      }

      // Check phone number across all collections
      const existIndividualUserNumber = await individualUserCollection.findOne({ phnNumber });
      const existEnterpriseUserNumber = await enterpriseUser.findOne({ phnNumber });
      const existEnterpriseEmployeNumber = await enterpriseEmployeModel.findOne({ phnNumber });

      let userId = null;
      let isDiskussUser = false;

      // Determine the user ID based on the type of user
      if (existIndividualUserNumber) {
        userId = existIndividualUserNumber._id;
        isDiskussUser = true;
      } else if (existEnterpriseUserNumber) {
        userId = existEnterpriseUserNumber._id;
        isDiskussUser = true;
      } else if (existEnterpriseEmployeNumber) {
        userId = existEnterpriseEmployeNumber._id;
        isDiskussUser = true;
      }

      // If phone number exists in any collection, add to valid contacts
      if (isDiskussUser) {
        validContacts.push({
          name,
          phnNumber,
          userId,
          isDiskussUser,
          // Add default empty values for other fields
          companyName: '',
          designation: '',
          email: '',
          website: '',
          businessCategory: '',
          location: '',
          scheduled: false,
          scheduledTime: null,
          notes: '',
          cardImage: {
            front: '',
            back: ''
          }
        });
      } else {
        invalidContacts.push({ 
          phnNumber, 
          name, 
          reason: "Phone number not found in any collection" 
        });
      }
    }

    if (validContacts.length === 0) {
      return res.status(400).json({ 
        message: "No valid contacts found",
        invalidContacts 
      });
    }

    // Create contact document with all valid contacts
    const contactDetails = {
      contactOwnerId,
      contacts: validContacts
    };

    // Create the new contacts
    const newContact = await Contact.create(contactDetails);

    // Update the appropriate collection based on contact owner type
    const existIndividualUser = await individualUserCollection.findOne({
      _id: contactOwnerId
    });
    const existEnterpriseUser = await enterpriseUser.findOne({
      _id: contactOwnerId
    });
    const existEnterpriseEmploye = await enterpriseEmployeModel.findOne({
      _id: contactOwnerId
    });

    if (existIndividualUser) {
      await individualUserCollection.updateOne(
        { _id: contactOwnerId },
        { $push: { contacts: newContact._id } }
      );
    } else if (existEnterpriseUser) {
      await enterpriseUser.updateOne(
        { _id: contactOwnerId },
        { $push: { contacts: newContact._id } }
      );
    } else if (existEnterpriseEmploye) {
      // Update enterprise employee
      await enterpriseEmployeModel.updateOne(
        { _id: contactOwnerId },
        { $push: { contacts: newContact._id } }
      );

      // Also update the enterprise user
      const enterpriseUserId = await enterpriseUser
        .findOne({ "empIds.empId": contactOwnerId })
        .select("_id");
        
      if (enterpriseUserId) {
        contactDetails.contactOwnerId = enterpriseUserId._id;
        const newContactOfEnterprise = await Contact.create(contactDetails);
        
        if (newContactOfEnterprise) {
          await enterpriseUser.updateOne(
            { _id: enterpriseUserId._id },
            { $push: { contacts: newContactOfEnterprise._id } }
          );
        }
      }
    }

    return res.status(201).json({
      message: "Contacts created successfully",
      contact: newContact,
      summary: {
        totalSubmitted: contacts.length,
        validContacts: validContacts.length,
        invalidContacts: invalidContacts
      }
    });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      message: "An unexpected error occurred. Please try again later."
    });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getContactsByOwnerUserId,
  getSearchedContact,
  createPhoneContacts
};
