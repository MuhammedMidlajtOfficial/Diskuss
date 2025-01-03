const { individualUserCollection } = require("../../DBConfig");
const enterpriseUser = require("../../models/enterpriseUser");
const enterpriseEmployee = require("../../models/enterpriseEmploye.model");
const EnterpriseEmployeeCard = require("../../models/enterpriseEmployeCard.model");
const Card = require("../../models/card");
const { ObjectId } = require("mongodb");
const Contact = require("../../models/contact.individual.model");
const {
  uploadImageToS3,
  deleteImageFromS3,
} = require("../../services/AWS/s3Bucket");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const { Types } = require("mongoose");

module.exports.getCard = async (userId) => {
  // Check user existence in collections
  const [isIndividualUserExist, isEnterpriseUserExist, isEmployeeUserExist] = await Promise.all([
    individualUserCollection.findOne({ _id: userId }).lean(),
    enterpriseUser.findOne({ _id: userId }).populate("empCards").lean(),
    enterpriseEmployee.findOne({ _id: userId }).lean(),
  ]);

  if (!isIndividualUserExist && !isEnterpriseUserExist && !isEmployeeUserExist) {
    throw new Error("Invalid user ID");
  }

  let cards = [];

  if (isEnterpriseUserExist) {
    // Fetch enterprise user cards
    const enterpriseCards = await Card.find({ userId });
    cards = [...enterpriseCards, ...isEnterpriseUserExist.empCards];
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

  return result;
};

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
      const employeePhoneNumber = isEnterpriseEmployee.phnNumber;

      const existingContact = await Contact.findOne({
        "contacts.phnNumber": employeePhoneNumber,
      });

      if (existingContact) {
        await Contact.updateOne(
          { "contacts.phnNumber": employeePhoneNumber },
          {
            $set: {
              "contacts.$.isDiskussUser": false,
              "contacts.$.userId": null,
            },
          }
        );
      }

      await EnterpriseEmployeeCard.deleteOne({ _id: cardId });

      const employeeExists = await enterpriseEmployee.deleteOne({ _id: userId });
      if (!employeeExists.deletedCount) {
        throw new Error("Employee not found in EnterpriseEmployee model");
      }

      await enterpriseUser.updateOne(
        { _id: enterpriseId },
        { $pull: { empCards: cardId, empId : userId } }
      );

      return { message: "Employee card deleted successfully" };
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