const { individualUserCollection } = require("../../DBConfig");
const Contact = require("../../models/contacts/contact.individual.model");
const enterpriseEmployeModel = require("../../models/users/enterpriseEmploye.model");
const enterpriseUser = require("../../models/users/enterpriseUser");
const ContactService = require("../../services/contact.Individual.service");
const { uploadImageToS3ForContact, deleteImageFromS3ForContact } = require("../../services/AWS/s3Bucket");
const mongoose = require ('mongoose')
const Notification = require("../../models/notification/NotificationModel");
const { emitNotification } = require("../../Controller/Socket.io/NotificationSocketIo");
const axios = require("axios");

/**
 * Get all Contacts
 * @param {Request} req
 * @param {Response} res
 * @returns {Promise<Response>}
 */
const getAllContacts = async (req, res) => {
  try {
    let { page, limit } = req.query;

    const contacts = await ContactService.findAllContacts(page, limit);
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

    if (!contact) return res.status(404).json({ message: "Contact not Added" });

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
      contactOwnerName = "Unknown",
      contactOwnerPhnNumber
    } = req.body;

    console.log("body:", req.body);

    if (!name || !phnNumber || !contactOwnerId || !contactOwnerName || !contactOwnerId ) {
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
    console.log(phnNumber)

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
      contactOwnerName,
      contactOwnerPhnNumber,
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

    // if The contect is Know Connections user 
    const SendNotification = async (userId, contactOwnerId, contactOwnerName)=>{
      
      try {
        if (isDiskussUser && userId && contactOwnerName) {
          const notificationContent = `
            <h3>
              <strong>${contactOwnerName}</strong> has saved your contact.
              You can now chat and create a meeting with them.
            </h3>
          `;

          const notificationContentForMobile = `${contactOwnerName} has saved your contact You can now chat and create a meeting with them.`

          const userArray = [userId.toString()]
          console.log(userArray)

          try {
             const repose = await axios.post(
                    "http://13.203.24.247:9000/api/v1/fcm/sendContactNotification",
                    {
                      userIds: userArray,
                      notification: {
                        title: "Contact Saved",
                        body: notificationContentForMobile,
                      },
                    }
                  );
                  console.log("Notification sent to mobile:", repose.data);
          } catch (error) {
            console.log("Error in sending notification to mobile:", error.message);
          }


          const notification = new Notification({
            sender: contactOwnerId,
            receiver: userId,
            type: "contact_saved",
            content: notificationContent,
            status: "unread",
          });

          await notification.save();

          try {
            emitNotification(userId, notification);
          } catch (emitError) {
            console.error("Failed to emit notification:", emitError.message);
          }
        }
      } catch (notificationError) {
        console.error("Error in SendNotification:", notificationError.message);
      }
    };



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

      const ContactOwner = await individualUserCollection.findById(contactOwnerId)
      if (ContactOwner && userId) {
        const userObject = existIndividualUserNumber || existEnterpriseUserNumber || existEnterpriseEmployeNumber;
        const contactDetails = createContactDetails(userId, userObject, ContactOwner);

        // Create the new contact
        const newContact = await Contact.create(contactDetails);
        // Send Notification
         SendNotification( userId, ContactOwner?._id, contactOwnerName )
      }

      // if (ContactOwner && userId) {
      //   const contactDetails = {
      //     contactOwnerId: userId,
      //     contactOwnerName: existIndividualUserNumber?.username,
      //     contactOwnerPhnNumber: existIndividualUserNumber?.phnNumber,
      //     contacts: [
      //       {
      //         name: ContactOwner?.username,
      //         companyName: ContactOwner?.companyName,
      //         designation: ContactOwner?.role,
      //         phnNumber: ContactOwner?.phnNumber,
      //         email: ContactOwner?.email,
      //         website: ContactOwner?.website,
      //         // businessCategory,
      //         location: ContactOwner?.address,
      //         // scheduled,
      //         // scheduledTime,
      //         // notes,
      //         // cardImage, // Assign the cardImage object here
      //         userId: ContactOwner?._id, // Set the userId based on the type of user
      //         isDiskussUser: true,
      //       },
      //     ],
      //   };
        
        // // Create the new contact
        // const newContact = await Contact.create(contactDetails);
      // }

    } else if (existEnterpriseUser ) {
      // Add the contact to enterpriseUserCollection
      await enterpriseUser.updateOne(
        { _id: contactOwnerId },
        { $push: { contacts: newContact._id } }
      );

      const ContactOwner = await enterpriseUser.findById(contactOwnerId)

      if (ContactOwner && userId) {
        const userObject = existIndividualUserNumber || existEnterpriseUserNumber || existEnterpriseEmployeNumber;
        const contactDetails = createContactDetails(userId, userObject, ContactOwner);
        
        // Create the new contact
        const newContact = await Contact.create(contactDetails);
        // Send Notification
         SendNotification( userId, ContactOwner?._id, contactOwnerName )
      }
    } else if (existEnterpriseEmploye) {

      const ContactOwner = await enterpriseEmployeModel.findById(contactOwnerId)

      if (ContactOwner && userId) {
        const userObject = existIndividualUserNumber || existEnterpriseUserNumber || existEnterpriseEmployeNumber;
        const contactDetails = createContactDetails(userId, userObject, ContactOwner);
        
        // Create the new contact
        const newContact = await Contact.create(contactDetails);
        // Send Notification
         SendNotification( userId, ContactOwner?._id, contactOwnerName)
      }

      // Add the contact to enterpriseEmployeeCollection
      await enterpriseEmployeModel.updateOne(
        { _id: contactOwnerId },
        { $push: { contacts: newContact._id } }
      );

      const enterpriseUserId = await enterpriseUser
      .findOne({ "empIds.empId": new mongoose.Types.ObjectId(contactOwnerId) }) // Ensure ObjectId conversion
      .select("_id");
      if (!enterpriseUserId) {
        console.log("status(400) - Enterprise user not Added");
        return res.status(400).json({ message: "Enterprise user not Added" });
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

const createContactDetails = ( userId, userObject, contactsData ) => {
  return {
    contactOwnerId: userId,
    contactOwnerName: userObject?.username || "",
    contactOwnerPhnNumber: userObject?.phnNumber || "",
    contacts: [{
      name: contactsData?.username || "",
      companyName: contactsData?.companyName || "",
      designation: contactsData?.role || "",
      phnNumber: contactsData?.phnNumber || "",
      email: contactsData?.email || "",
      website: contactsData?.website || "",
      location: contactsData?.address || "",
      userId: contactsData?._id || "",
      isDiskussUser: true,
    }],
  };


  // Send Notification
  SendNotification()
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
      cardFrontImage = null,
      cardBackImage = null,
      notes,
      contactOwnerId,
      contactOwnerName
    } = req.body;

    // Validate required fields
    if (!contactOwnerId || !name || !phnNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the contact exists
    const contact = await Contact.findOne({ _id: new mongoose.Types.ObjectId(contact_id) });
    if (!contact) {
      return res.status(404).json({ message: "Contact not found using this contact id" });
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

    let cardFrontImageS3;
    let cardBackImageS3;

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
        cardFrontImageS3 = frontUploadResult.Location;
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
        cardBackImageS3 = backUploadResult.Location;
      } catch (uploadError) {
        throw new Error(`Failed to upload back card image: ${uploadError.message}`);
      }
    }

    // Update contact details
    const updatedContact = await Contact.updateOne(
      {
        _id: contact_id,
        contacts: { $exists: true, $ne: [] }, // Ensure contacts array exists
        "contacts._id": contact.contacts[0]._id
      },
      {
        $set: {
          contactOwnerName: contactOwnerName,
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
          "contacts.$.cardImage.0.front": cardFrontImageS3,
          "contacts.$.cardImage.0.back": cardBackImageS3,
          "contacts.$.userId": userId,
          "contacts.$.isDiskussUser": isDiskussUser
        }
      }
    );

    if (updatedContact.matchedCount === 0) {
      return res.status(404).json({ message: "No contact Added to update" });
    }

    // Depending on the user type, update the contact in the relevant collection
    const updateQuery = { _id: contactOwnerId };
    const updateData = { $push: { "contacts": contact_id } };
    // const arrayFilters = [{ "contact._id": contact_id }];

    // console.log('updateQuery-',updateQuery);
    console.log('updateData-',updateData);
    // console.log('arrayFilters-',arrayFilters);
    
    if (existIndividualUser) {
      await individualUserCollection.updateOne(updateQuery, updateData);
    } else if (existEnterpriseUser) {
      await enterpriseUser.updateOne(updateQuery, updateData);
    } else if (existEnterpriseEmploye) {
      await enterpriseEmployeModel.updateOne(updateQuery, updateData);
    }

    return res.status(200).json({ message: "Contact updated successfully" });

  } catch (error) {
    console.error("Error updating Contact:", error);
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
      return res.status(404).json({ message: "Contact not Added" });
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
      return res.status(404).json({ message: "Contact not Added" });
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

    // If no contacts are Added, return a 404 response (optional, uncomment if needed)
    // if (!contacts || contacts.length === 0) {
    //     return res.status(404).json({ message: 'No Contacts Added for this user' });
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

            // Add the image (if Added) to the individual contact
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
              image: userWithImage?.image || null, // Include the image or null if not Added
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
  let { page, limit } = req.query;

  if (!number) {
    return res
      .status(400)
      .json({ message: "Number query parameter is required." });
  }
  try {
    const results = await ContactService.findContactsByNumberSearch(number, page, limit);
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching contacts by search query");
    return res.status(500).json({ error: error.message });
  }
};

const createPhoneContacts = async (req, res) => {
  try {
    const { contactOwnerName, contactOwnerId, contacts } = req.body;

    if (!contactOwnerId || !Array.isArray(contacts)) {
      return res.status(400).json({ 
        message: "Contact owner ID and contacts array are required" 
      });
    }

    const formatPhoneNumber = (number) => {
      if (!number) return '';
      return number.replace(/\s+/g, '').replace(/-/g, '').replace(/^\+91/, '');
    };

    const validContacts = [];
    const invalidContacts = [];
    const createdContacts = [];

    // Validate and process contacts
    for (const contact of contacts) {
      let { phnNumber, name } = contact;
      
      if (!phnNumber || !name) {
        invalidContacts.push({ phnNumber, name, reason: "Missing required fields" });
        continue;
      }

      phnNumber = formatPhoneNumber(phnNumber);

      // Check for existing contact with same name and number
      const existingContact = await Contact.findOne({
        contactOwnerId,
        'contacts': {
          $elemMatch: {
            name: name,
            phnNumber: phnNumber
          }
        }
      });

      if (existingContact) {
        invalidContacts.push({ 
          phnNumber, 
          name, 
          reason: "Contact with same name and number already exists" 
        });
        continue;
      }

      const existIndividualUserNumber = await individualUserCollection.findOne({ phnNumber });
      const existEnterpriseUserNumber = await enterpriseUser.findOne({ phnNumber });
      const existEnterpriseEmployeNumber = await enterpriseEmployeModel.findOne({ phnNumber });

      let userId = null;
      let isDiskussUser = false;

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

      if (isDiskussUser) {
        validContacts.push({
          name,
          phnNumber,
          userId,
          isDiskussUser,
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
          reason: "Phone number not Added in any collection" 
        });
      }
    }

    if (validContacts.length === 0) {
      return res.status(400).json({ 
        message: "No valid contacts Added",
        invalidContacts 
      });
    }

    // Create separate document for each valid contact
    for (const validContact of validContacts) {
      const contactDetails = {
        contactOwnerName,
        contactOwnerId,
        contacts: [validContact] // Single contact in array
      };

      const newContact = await Contact.create(contactDetails);
      createdContacts.push(newContact);

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
          .findOne({ "empIds.empId": new mongoose.Types.ObjectId(contactOwnerId) })
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
    }

   


    return res.status(201).json({
      message: "Contacts created successfully",
      contacts: createdContacts,
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

const getNetworkById = async (req, res) => {
  try {
    const { user_id } = req.params;

    const contacts = await Contact.find({
      $or: [
        { contactOwnerId: user_id },
        { 'contacts.userId': user_id }
      ]
    }).exec();

    const fetchUserImage = async (userId) => {
      if (!userId) return '';

      try {
        const objectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

        // Check each collection sequentially for the user
        const individualUser = await individualUserCollection.findOne({ _id: objectId }).select("image");
        if (individualUser?.image) return individualUser.image;

        const enterpriseUsers = await enterpriseUser.findOne({ _id: objectId }).select("image");
        if (enterpriseUsers?.image) return enterpriseUsers.image;

        const employeeUsers = await enterpriseEmployeModel.findOne({ _id: objectId }).select("image");
        if (employeeUsers?.image) return employeeUsers.image;

        return '';
      } catch (error) {
        console.error(`Error fetching image for user ${userId}:`, error);
        return '';
      }
    };
    console.log("image");
    
    const processedContacts = await Promise.all(
      contacts.map(async (contact) => {
        // Case 1: User is the contact owner
        if (contact.contactOwnerId.toString() === user_id) {
          const ownerImage = await fetchUserImage(user_id);
          
          // Process each contact in the contacts array
          const processedContactList = await Promise.all(
            contact.contacts.map(async (c) => {
              const contactImage = await fetchUserImage(c.userId);
              return {
                userId: c.userId,
                name: c.name || 'Not Added',
                companyName: c.companyName || '',
                designation: c.designation || '',
                phnNumber: c.phnNumber || '',
                email: c.email || '',
                website: c.website || '',
                location: c.location || '',
                image: contactImage  // Fetched from user collections
              };
            })
          );

          return {
            type: 'owner',
            userId: contact.contactOwnerId,
            name: contact.contactOwnerName || 'Not Added',
            image: ownerImage,  // Fetched from user collections
            contacts: processedContactList
          };
        }
        // Case 2: User is in the contacts array
        else {
          const matchingContact = contact.contacts.find(
            c => c.userId?.toString() === user_id
          );

          if (matchingContact) {
            const ownerImage = await fetchUserImage(contact.contactOwnerId);
            const userImage = await fetchUserImage(user_id);

            return {
              type: 'contact',
              contactOwnerId: contact.contactOwnerId,
              contactOwnerName: contact.contactOwnerName || 'Not Added',
              ownerImage: ownerImage,  // Fetched from user collections
              tag: contact.tag || 'Need to save this contact',
              matchingContactDetails: {
                userId: matchingContact.userId,
                name: matchingContact.name || 'Not Added',
                email: matchingContact.email || '',
                phnNumber: matchingContact.phnNumber || '',
                image: userImage  // Fetched from user collections
              }
            };
          }
        }
        return null;
      })
    );

    // Filter out null values and remove duplicates
    const uniqueContacts = Array.from(new Set(
      processedContacts
        .filter(Boolean)
        .map(contact => JSON.stringify(contact))
    )).map(contact => JSON.parse(contact));

    if (uniqueContacts.length === 0) {
      return res.status(404).json({ 
        message: 'No matching contacts found' 
      });
    }

    return res.status(200).json(uniqueContacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
};

module.exports = getNetworkById;

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  getContactsByOwnerUserId,
  getSearchedContact,
  createPhoneContacts,
  getNetworkById
};
