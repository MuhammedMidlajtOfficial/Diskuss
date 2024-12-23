const { individualUserCollection } = require("../../DBConfig");
const Card = require("../../models/card");
const { ObjectId } = require("mongodb");
const Contact = require("../../models/contact.individual.model");
const enterpriseUser = require("../../models/enterpriseUser");
const enterpriseEmployee = require("../../models/enterpriseEmploye.model");
const EnterpriseEmployeeCard = require("../../models/enterpriseEmployeCard.model");
const {
  uploadImageToS3,
  deleteImageFromS3,
} = require("../../services/AWS/s3Bucket");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");

module.exports.getCards = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the user exists in different collections
    const isIndividualUserExist = await individualUserCollection
      .findOne({ _id: userId })
      .lean();
    const isEnterpriseUserExist = await enterpriseUser
      .findOne({ _id: userId })
      .populate("empCards")
      .lean();
    const isEmployeeUserExist = await enterpriseEmployee
      .findOne({ _id: userId })
      .lean();
    console.log("employee id:", isEmployeeUserExist);

    // If user doesn't exist in any of the collections
    if (
      !isIndividualUserExist &&
      !isEnterpriseUserExist &&
      !isEmployeeUserExist
    ) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    let card = [];

    if (isEnterpriseUserExist) {
      // If enterprise user, fetch their cards and empCards
      const cardOfEnterprise = await Card.find({ userId });
      card = [...cardOfEnterprise, ...isEnterpriseUserExist.empCards];
    } else if (isIndividualUserExist) {
      // If individual user, fetch their cards
      card = await Card.find({ userId });
    } else if (isEmployeeUserExist) {
      // If employee user, fetch their employee-specific card
      const employeeCard = await EnterpriseEmployeeCard.findOne({ userId });
      console.log("crad:", employeeCard);

      if (!employeeCard) {
        return res.status(404).json({ message: "Card not found for employee" });
      }
      card = [employeeCard];
    }

    return res.status(200).json(card);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get cards", error });
  }
};

module.exports.createCard = async (req, res) => {
  console.log(req.body);
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
  } = req.body;

  const isUserExist = individualUserCollection.findOne({ _id: userId });
  if (!isUserExist) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  let imageUrl = image; // Default to provided image URL if no new image upload is needed

  // Upload image to S3 if a new image is provided
  if (image) {
    const imageBuffer = Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    const fileName = `${userId}-${Date.now()}-businessCard.jpg`; // Unique file name based on user ID and card purpose
    try {
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // S3 URL of the uploaded image
    } catch (uploadError) {
      console.log("Error uploading image to S3:", uploadError);
      return res
        .status(500)
        .json({ message: "Failed to upload image", error: uploadError });
    }
  }

  console.log("imageUrl of new card logo - ", imageUrl);

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
    image: imageUrl, // Use S3 image URL
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
    const result = await newCard.save();
    if (result) {
      await individualUserCollection.updateOne(
        { _id: userId },
        { $inc: { cardNo: 1 } } // Increment cardNo by 1
      );
    }
    res
      .status(201)
      .json({ message: "Card added successfully", entryId: result._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add card", error });
  }
};

module.exports.updateCard = async (req, res) => {
  try {
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
    } = req.body;

    // // Check if the user exists
    // const isUserExist = await individualUserCollection.findOne({ _id: userId });
    // if (!isUserExist) {
    //   return res.status(400).json({ message: 'Invalid user ID' });
    // }

    // Check if the card exists in Card collection
    let existingCard = await Card.findOne({ _id: cardId });
    let cardCollection = Card;

    // If card is not found in Card collection, check EnterpriseEmployeeCard collection
    if (!existingCard) {
      existingCard = await EnterpriseEmployeeCard.findOne({ _id: cardId });
      cardCollection = EnterpriseEmployeeCard; // Change the collection to EnterpriseEmployeeCard
    }
    console.log("Update individual card- image", image);
    if (!existingCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    let imageUrl = existingCard.image; // Default to existing image if no new image is provided

    // Upload image to S3 if a new image is provided
    if (image) {
      // Delete the old image from S3 (if exists)
      if (existingCard?.image) {
        await deleteImageFromS3(existingCard.image); // Delete the old image from S3
      }
      const imageBuffer = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const fileName = `${userId}-${Date.now()}-businessCard.jpg`; // Unique file name based on user ID and card ID
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location; // URL of the uploaded image
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res
          .status(500)
          .json({ message: "Failed to upload image", error: uploadError });
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
          image: imageUrl, // Use the S3 URL for the image
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
      return res
        .status(404)
        .json({ message: "Card not found or no changes detected" });
    }

    res.status(200).json({ message: "Card updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update card . Please try again later.",
      error,
    });
  }
};

module.exports.deleteCard = async (req, res) => {
  const { cardId } = req.body;

  try {
    // Step 1: Search for the card in the two collections
    const card = await Card.findOne({ _id: cardId });
    const employeeCard = await EnterpriseEmployeeCard.findOne({ _id: cardId });

    if (!card && !employeeCard) {
      return res.status(404).json({ message: "Card not found" });
    }

    // Extract userId and handle employee-specific logic
    let userId;
    let enterpriseId;

    if (employeeCard) {
      userId = employeeCard.userId;
      enterpriseId = employeeCard.enterpriseId;
    } else {
      userId = card.userId;
    }

    // Step 2: Check if the user exists in any of the collections
    const isIndividualUser = await individualUserCollection.findOne({
      _id: userId,
    });
    const isEnterpriseUser = await enterpriseUser.findOne({ _id: userId });
    const isEnterpriseEmployee = await enterpriseEmployee.findOne({
      _id: userId,
    });

    if (!isIndividualUser && !isEnterpriseUser && !isEnterpriseEmployee) {
      return res
        .status(400)
        .json({ message: "Invalid user ID associated with the card" });
    }

    // Step 3: Handle employee card-specific logic
    if (isEnterpriseEmployee) {
      console.log("phone:", isEnterpriseEmployee.phnNumber);
      console.log("just message");

      // Find the contact containing the matching phone number in the nested contacts array
      const existingContact = await Contact.findOne({
        "contacts.phnNumber": isEnterpriseEmployee.phnNumber,
      });

      if (existingContact) {
        console.log("contact", existingContact);

        // Update the specific contact inside the contacts array using the positional $ operator
        await Contact.updateOne(
          { "contacts.phnNumber": isEnterpriseEmployee.phnNumber },
          {
            $set: {
              "contacts.$.isDiskussUser": false, // Update the matched contact's isDiskussUser flag
              "contacts.$.userId": null, // Remove the userId from the matched contact
              "contacts.$.name": "Deleted User",
            },
          }
        );

        console.log("Contact updated successfully.");
      }

      // Remove the employee card from the EnterpriseEmployeeCard collection
      await EnterpriseEmployeeCard.deleteOne({ _id: cardId });

      // Remove the card reference from the enterprise user
      await enterpriseUser.updateOne(
        { _id: enterpriseId },
        { $pull: { empCards: cardId } }
      );

      return res
        .status(200)
        .json({ message: "Employee card deleted successfully" });
    }

    // Step 4: For individual or enterprise users, delete the card and decrement card count
    if (card) {
      await Card.deleteOne({ _id: cardId });

      // Update card count for the individual user
      if (isIndividualUser) {
        await individualUserCollection.updateOne(
          { _id: userId },
          { $inc: { cardNo: -1 } }
        );
      }

      // Update card count for the enterprise user
      if (isEnterpriseUser) {
        await enterpriseUser.updateOne(
          { _id: userId },
          { $inc: { cardNo: -1 } }
        );
      }

      return res.status(200).json({ message: "Card deleted successfully" });
    }

    return res.status(404).json({ message: "Card deletion failed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete card", error });
  }
};

async function isValidUserId(userId) {
  try {
    const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!objectId) return false; // If userId is not a valid ObjectId, return false

    const user = await individualUserCollection.findOne({ _id: objectId });
    return user !== null;
  } catch (error) {
    console.error("Error checking user ID:", error);
    return false;
  }
}
