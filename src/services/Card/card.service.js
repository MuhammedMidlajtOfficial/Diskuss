const { individualUserCollection } = require("../../DBConfig");
const enterpriseUser = require("../../models/users/enterpriseUser");
const enterpriseEmployee = require("../../models/users/enterpriseEmploye.model");
const EnterpriseEmployeeCard = require("../../models/cards/enterpriseEmployeCard.model");
const Card = require("../../models/cards/card");
const { ObjectId } = require("mongodb");
const Contact = require("../../models/contacts/contact.individual.model");
const {
  uploadImageToS3,
  deleteImageFromS3,
} = require("../../services/AWS/s3Bucket");
const enterpriseEmployeModel = require("../../models/users/enterpriseEmploye.model");
const { Types } = require("mongoose");

module.exports.getCard = async (userId, page = null, limit = null) => {
  // Check user existence in collections
  const [isIndividualUserExist, isEnterpriseUserExist, isEmployeeUserExist] = await Promise.all([
    individualUserCollection.findOne({ _id: userId }).lean(),
    enterpriseUser.findOne({ _id: userId }).populate("empCards.empCardId").lean(),
    enterpriseEmployee.findOne({ _id: userId }).lean(),
  ]);

  if (!isIndividualUserExist && !isEnterpriseUserExist && !isEmployeeUserExist) {
    throw new Error("Invalid user ID");
  }

  let cards = [];

  if (isEnterpriseUserExist) {
    // Fetch enterprise user cards
    const enterpriseCardsFromEmpCards = isEnterpriseUserExist.empCards.map(empCard => empCard.empCardId);
    const enterpriseCardsFromCardCollection = await Card.find({ userId });
    cards = [...enterpriseCardsFromCardCollection, ...enterpriseCardsFromEmpCards];
  } else if (isIndividualUserExist) {
    // Fetch individual user cards
    cards = await Card.find({ userId });
  } else if (isEmployeeUserExist) {
    // Fetch employee-specific card
    const employeeCard = await EnterpriseEmployeeCard.findOne({ userId });
    if (!employeeCard) {
      throw new Error("Card not found for employee");
    }
    cards = [employeeCard];
  }

  // Apply pagination if page and limit are provided
  if (page !== null && limit !== null) {
    const startIndex = (page - 1) * limit;
    cards = cards.slice(startIndex, startIndex + limit);
  }

  return cards;
};

module.exports.createCard = async (cardData) => {
  const {
    userId,
    businessName,
    businessType,
    yourName,
    designation,
    mobile,
    email,
    location,
    services,
    image,
    position,
    cardType,
    color,
    website,
    theme,
    topServices,
    whatsappNo,
    facebookLink,
    instagramLink,
    twitterLink,
  } = cardData;

  // Validate userId format
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user ID format");
  }

  // Check if user exists
  const isUserExist = await individualUserCollection.findOne({ _id: userId });
  if (!isUserExist) {
    throw new Error("Invalid user ID");
  }

  let imageUrl = image; // Default to provided image URL

  // Upload image to S3 if provided
  if (image) {
    const imageBuffer = Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const fileName = `${userId}-${Date.now()}-businessCard.jpg`; // Unique file name

    try {
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // S3 image URL
    } catch (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
  }

  // Create a new card
  const newCard = new Card({
    userId,
    businessName,
    businessType,
    yourName,
    designation,
    mobile,
    email,
    location,
    services,
    image: imageUrl,
    position,
    cardType,
    color,
    website,
    theme,
    topServices,
    whatsappNo,
    facebookLink,
    instagramLink,
    twitterLink,
  });

  try {
    // Save card to the database
    const result = await newCard.save();

    // Increment cardNo for the user
    await individualUserCollection.updateOne(
      { _id: userId },
      { $inc: { cardNo: 1 } }
    );

    return result;
  } catch (error) {
    throw new Error(`Failed to create card: ${error.message}`);
  }
};

module.exports.updateCard = async (updateData) => {
  const {
    userId,
    cardId,
    businessName,
    businessType,
    yourName,
    designation,
    mobile,
    email,
    location,
    services,
    image,
    position,
    color,
    cardType,
    website,
    theme,
    topServices,
    whatsappNo,
    facebookLink,
    instagramLink,
    twitterLink,
  } = updateData;

  // Validate cardId format
  if (!Types.ObjectId.isValid(cardId)) {
    throw new Error("Invalid card ID format");
  }

  // Check if the card exists in Card or EnterpriseEmployeeCard collection
  let existingCard = await Card.findOne({ _id: cardId });
  let cardCollection = Card;

  if (!existingCard) {
    existingCard = await EnterpriseEmployeeCard.findOne({ _id: cardId });
    cardCollection = EnterpriseEmployeeCard;
  }

  if (!existingCard) {
    throw new Error("Card not found");
  }

  let imageUrl = existingCard.image; // Default to existing image if no new image is provided

  // Upload new image and delete old image if needed
  if (image) {
    if (existingCard.image) {
      await deleteImageFromS3(existingCard.image); // Delete old image
    }

    const imageBuffer = Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const fileName = `${userId}-${Date.now()}-businessCard.jpg`;

    try {
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // New S3 image URL
    } catch (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
  }

  // Update the card in the respective collection
  const result = await cardCollection.updateOne(
    { _id: cardId },
    {
      $set: {
        businessName,
        businessType,
        yourName,
        designation,
        mobile,
        email,
        location,
        services,
        image: imageUrl,
        position,
        color,
        cardType,
        website,
        theme,
        topServices,
        whatsappNo,
        facebookLink,
        instagramLink,
        twitterLink,
      },
    }
  );

  if (result.modifiedCount === 0) {
    throw new Error("Card not found or no changes detected");
  }

  // If the card belongs to an enterprise employee, update EnterpriseEmployeeModel
  if (cardCollection === EnterpriseEmployeeCard) {
    const updateEnterpriseEmployee = await enterpriseEmployeModel.updateOne(
      { _id: userId },
      {
        $set: {
          companyName: businessName,
          email,
          website,
          phnNumber: mobile,
          address: location,
          role: designation,
          theme,
          socialMedia: {
            whatsappNo,
            facebookLink,
            instagramLink,
            twitterLink,
          },
        },
      }
    );

    if (updateEnterpriseEmployee.modifiedCount === 0) {
      throw new Error("Failed to update Enterprise Employee details");
    }
  }

  return result;
};

module.exports.updateLogo = async (cardId, image) => {
  // Validate cardId format
  if (!Types.ObjectId.isValid(cardId)) {
    throw new Error("Invalid card ID format");
  }

  // Check if the card exists in Card or EnterpriseEmployeeCard collection
  let existingCard = await Card.findOne({ _id: cardId });
  let cardCollection = Card;

  if (!existingCard) {
    existingCard = await EnterpriseEmployeeCard.findOne({ _id: cardId });
    cardCollection = EnterpriseEmployeeCard;
  }

  if (!existingCard) {
    throw new Error("Card not found");
  }

  let imageUrl = existingCard.image; // Default to existing image if no new image is provided

  // Upload new image and delete old image if needed
  if (image) {
    if (existingCard.image) {
      // Delete old image if it exists
      await deleteImageFromS3(existingCard.image);
    }

    const imageBuffer = Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const fileName = `${cardId}-${Date.now()}-businessCard.jpg`;

    try {
      // Upload the new image to S3
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // New S3 image URL
    } catch (uploadError) {
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }
  }

  // Update the card in the respective collection
  const result = await cardCollection.updateOne(
    { _id: cardId },
    {
      $set: {
        image: imageUrl,
      },
    }
  );

  if (result.modifiedCount === 0) {
    throw new Error("Card not found or no changes detected");
  }

  return result;
};

// module.exports.deleteCard = async (cardId) => {
//   try {
//     const card = await Card.findOne({ _id: cardId });
//     const employeeCard = await EnterpriseEmployeeCard.findOne({ _id: cardId });
//     if (!card && !employeeCard) {
//       throw new Error("Card not found");
//     }
//     let userId;
//     let enterpriseId;

//     if (employeeCard) {
//       userId = employeeCard.userId;
//       enterpriseId = employeeCard.enterpriseId;
//     } else {
//       userId = card.userId;
//     }

//     const isIndividualUser = await individualUserCollection.findOne({ _id: userId });
//     const isEnterpriseUser = await enterpriseUser.findOne({ _id: userId });
//     const isEnterpriseEmployee = await enterpriseEmployee.findOne({ _id: userId });

//     if (!isIndividualUser && !isEnterpriseUser && !isEnterpriseEmployee) {
//       throw new Error("Invalid user ID associated with the card");
//     }

//     if (isEnterpriseEmployee) {
//       const employeePhoneNumber = isEnterpriseEmployee.phnNumber;

//       const existingContact = await Contact.findOne({
//         "contacts.phnNumber": employeePhoneNumber,
//       });

//       if (existingContact) {
//         await Contact.updateOne(
//           { "contacts.phnNumber": employeePhoneNumber },
//           {
//             $set: {
//               "contacts.$.isDiskussUser": false,
//               "contacts.$.userId": null,
//             },
//           }
//         );
//       }

//       await EnterpriseEmployeeCard.deleteOne({ _id: cardId });

//       const employeeExists = await enterpriseEmployee.deleteOne({ _id: userId });
//       if (!employeeExists.deletedCount) {
//         throw new Error("Employee not found in EnterpriseEmployee model");
//       }

//       await enterpriseUser.updateOne(
//         { _id: enterpriseId },
//         { $pull: { empCards: cardId, empId : userId } }
//       );

//       return { message: "Employee card deleted successfully" };
//     }

//     if (card) {
//       await Card.deleteOne({ _id: cardId });

//       if (isIndividualUser) {
//         await individualUserCollection.updateOne(
//           { _id: userId },
//           { $inc: { cardNo: -1 } }
//         );
//       }

//       if (isEnterpriseUser) {
//         await enterpriseUser.updateOne(
//           { _id: userId },
//           { $inc: { cardNo: -1 } }
//         );
//       }

//       return { message: "Card deleted successfully" };
//     }

//     throw new Error("Card deletion failed");
//   } catch (error) {
//     throw error;
//   }
// };

module.exports.deleteCard = async (cardId) => {
  try {
    const card = await Card.findOne({ _id: cardId });
    const employeeCard = await EnterpriseEmployeeCard.findOne({ _id: cardId });
    if (!card && !employeeCard) {
      throw new Error("Card not found");
    }
    let userId;
    let enterpriseId;

    if (employeeCard) {
      userId = employeeCard.userId;
      enterpriseId = employeeCard.enterpriseId;
    } else {
      userId = card.userId;
    }

    const isIndividualUser = await individualUserCollection.findOne({ _id: userId });
    const isEnterpriseUser = await enterpriseUser.findOne({ _id: userId });
    const isEnterpriseEmployee = await enterpriseEmployee.findOne({ _id: userId });

    if (!isIndividualUser && !isEnterpriseUser && !isEnterpriseEmployee) {
      throw new Error("Invalid user ID associated with the card");
    }

    if (isEnterpriseEmployee) {
      // Get the current status of the employee card
      const card = await EnterpriseEmployeeCard.findOne({ _id: cardId });
      if (!card) {
        throw new Error("Employee card not found");
      }
    
      const newStatus = card.status === "active" ? "inactive" : "active";
    
      // Update the status of the employee card
      await EnterpriseEmployeeCard.updateOne(
        { _id: cardId },
        { $set: { status: newStatus } }
      );
    
      // Update the status of the employee in the EnterpriseEmployee model
      const employeeExists = await enterpriseEmployee.updateOne(
        { _id: userId },
        { $set: { status: newStatus } }
      );
      if (!employeeExists.modifiedCount) {
        throw new Error("Employee not found in EnterpriseEmployee model");
      }
    
      // Update the status of the empCards and empIds in the EnterpriseUser model
      await enterpriseUser.updateOne(
        { _id: enterpriseId }, // Filter to find the correct enterprise user
        {
          $set: {
            "empCards.$[card].status": newStatus, // Update the status of a specific empCard
            "empIds.$[emp].status": newStatus,   // Update the status of a specific empId
          },
        },
        {
          arrayFilters: [
            { "card.empCardId": cardId }, // Condition to match the empCard with the given cardId
            { "emp.empId": userId },      // Condition to match the empId with the given userId
          ],
        }
      );
    
      return { message: `Employee card status updated to ${newStatus} successfully` };
    }

    if (card) {
      await Card.deleteOne({ _id: cardId });

      if (isIndividualUser) {
        await individualUserCollection.updateOne(
          { _id: userId },
          { $inc: { cardNo: -1 } }
        );
      }

      if (isEnterpriseUser) {
        await enterpriseUser.updateOne(
          { _id: userId },
          { $inc: { cardNo: -1 } }
        );
      }

      return { message: "Card deleted successfully" };
    }

    throw new Error("Card deletion failed");
  } catch (error) {
    throw error;
  }
};

module.exports.getCardsByNum = async (phnNumber, page = null, limit = null) => {
  // Check if a card exists in either Card or EnterpriseEmployeeCard collections
  const [cardsFromCardCollection, employeeCard] = await Promise.all([
    Card.find({ mobile: phnNumber }).lean(), // Find all cards with matching phone number
    EnterpriseEmployeeCard.findOne({ mobile: phnNumber }).lean() // Find single employee card
  ]);

  if (!cardsFromCardCollection.length && !employeeCard) {
    throw new Error("No cards found with the provided phone number");
  }

  let cards = [];

  // Add personal/business cards if found
  if (cardsFromCardCollection.length) {
    cards = [...cardsFromCardCollection];
  }

  // Add employee card if found
  if (employeeCard) {
    cards.push(employeeCard);
  }

  // Apply pagination if page and limit are provided
  if (page !== null && limit !== null) {
    const startIndex = (page - 1) * limit;
    cards = cards.slice(startIndex, startIndex + limit);
  }

  return cards;
};

module.exports.changeStatus = async (cardId) => {
  try {
    const card = await Card.findOne({ _id: cardId });
    const employeeCard = await EnterpriseEmployeeCard.findOne({ _id: cardId });
    if (!card && !employeeCard) {
      throw new Error("Card not found");
    }
    let userId;
    let enterpriseId;

    if (employeeCard) {
      userId = employeeCard.userId;
      enterpriseId = employeeCard.enterpriseId;
    } else {
      userId = card.userId;
    }

    const isIndividualUser = await individualUserCollection.findOne({ _id: userId });
    const isEnterpriseUser = await enterpriseUser.findOne({ _id: userId });
    const isEnterpriseEmployee = await enterpriseEmployee.findOne({ _id: userId });

    if (!isIndividualUser && !isEnterpriseUser && !isEnterpriseEmployee) {
      throw new Error("Invalid user ID associated with the card");
    }

    if (isEnterpriseEmployee) {
      // Get the current status of the employee card
      const card = await EnterpriseEmployeeCard.findOne({ _id: cardId });
      if (!card) {
        throw new Error("Employee card not found");
      }
    
      const newStatus = card.status === "active" ? "inactive" : "active";
    
      // Update the status of the employee card
      await EnterpriseEmployeeCard.updateOne(
        { _id: cardId },
        { $set: { status: newStatus } }
      );
    
      // Update the status of the employee in the EnterpriseEmployee model
      const employeeExists = await enterpriseEmployee.updateOne(
        { _id: userId },
        { $set: { status: newStatus } }
      );
      if (!employeeExists.modifiedCount) {
        throw new Error("Employee not found in EnterpriseEmployee model");
      }
    
      // Update the status of the empCards and empIds in the EnterpriseUser model
      await enterpriseUser.updateOne(
        { _id: enterpriseId }, // Filter to find the correct enterprise user
        {
          $set: {
            "empCards.$[card].status": newStatus, // Update the status of a specific empCard
            "empIds.$[emp].status": newStatus,   // Update the status of a specific empId
          },
        },
        {
          arrayFilters: [
            { "card.empCardId": cardId }, // Condition to match the empCard with the given cardId
            { "emp.empId": userId },      // Condition to match the empId with the given userId
          ],
        }
      );
    
      return { message: `Employee card status updated to ${newStatus} successfully` };
    }

    if (card) {
      const newStatus = card.status === "active" ? "inactive" : "active";

      // Update the card status
      await Card.updateOne(
        { _id: cardId },
        { $set: { status: newStatus } }
      );

      return { message: `Card status updated to ${newStatus} successfully` };
    }

    throw new Error("Card Status change failed");
  } catch (error) {
    throw error;
  }
}