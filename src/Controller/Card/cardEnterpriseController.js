const enterpriseUser = require("../../models/users/enterpriseUser");
const Card = require("../../models/cards/card");
const { ObjectId } = require("mongodb");
const enterpriseEmployeModel = require("../../models/users/enterpriseEmploye.model");
const enterpriseEmployeCardModel = require("../../models/cards/enterpriseEmployeCard.model");
const mailSender = require("../../util/mailSender");
const bcrypt = require("bcrypt");
const { uploadImageToS3, deleteImageFromS3 } = require("../../services/AWS/s3Bucket");
const { individualUserCollection } = require("../../DBConfig");

module.exports.getCards = async (req, res) => {
  try {
    const userId = req.params.id;

    let { page, limit } = req.query;

    const isUserExist = enterpriseUser.find({ _id: userId });
    if (!isUserExist) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const card = await Card.find({ userId });
    // if (!card[0]) {
    //   console.log(Error('Error:Card not found'));
    //   return res.status(404).json({ message: 'Card not found' });
    // }

    // Apply pagination if page and limit are provided
    if (page !== null && limit !== null) {
      const startIndex = (page - 1) * limit;
      card = card.slice(startIndex, startIndex + limit);
    }

    console.log(card);
    return res.status(200).json(card);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get cards", error });
  }
};

module.exports.createCard = async (req, res) => {
  try {
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
    const passwordRaw = "123";
    
    // Check if user email exists
    const isEmailExist = await enterpriseEmployeModel.findOne({ email }).exec();
    const isEmailExistInEnterpriseUser = await enterpriseUser
      .findOne({ email })
      .exec();
    if (isEmailExist) {
      return res.status(409).json({
        message:
          "A user with this email address already exists. Please use another email",
      });
    }

    // Check if Enterprise ID exists
    const isEnterpriseIDExist = await enterpriseUser
      .findOne({ _id: userId })
      .exec();
    if (!isEnterpriseIDExist) {
      return res.status(409).json({ message: "Enterprise user not found" });
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
    // CREATE CARD FOR ENTERPRISE
    if (isEmailExistInEnterpriseUser) {
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
      const result = await newCard.save();
      if (result) {
        await enterpriseUser.updateOne(
          { _id: userId },
          { $inc: { cardNo: 1 } } // Increment cardNo by 1
        );
      }

      // Update firstCardCreated
      if (isEmailExistInEnterpriseUser?.cardNo === 0 && isEmailExistInEnterpriseUser?.firstCardCreated === false) {
        await enterpriseUser.updateOne(
          { _id: userId },
          { $set: { firstCardCreated: true } } // Use $set to update the field
        );
      }
      
      return res.status(201).json({
        message: "Card added for enterprise successfully",
        entryId: result._id,
      });
    } else {
      // CREATE CARD FOR ENTERPRISE EMPLOYEE

      // Check for missing fields
      if ( !mobile) {
        return res.status(400).json({ message :"phnNumber is required"}); 
      }

      let isIndividualExist;
      let isEnterpriseExist;
      let isEnterpriseEmployeeExist;

      if(mobile){
        // Check if phone number exists in any of the collections
        isIndividualExist = await individualUserCollection.findOne({ phnNumber:mobile }).exec();
        isEnterpriseExist = await enterpriseUser.findOne({ phnNumber:mobile }).exec();
        isEnterpriseEmployeeExist = await enterpriseEmployeModel.findOne({ phnNumber:mobile }).exec();
      }

      if (isIndividualExist) {
        return res.status(409).json({ message: "This phone number is already associated with an individual user" });
      }

      if (isEnterpriseExist) {
        return res.status(409).json({ message: "This phone number is already associated with an enterprise user" });
      }

      if (isEnterpriseEmployeeExist) {
        return res.status(409).json({ message: "This phone number is already associated with an enterprise employee" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(passwordRaw, 10);
      // Create a new user
      const newUser = await enterpriseEmployeModel.create({
        username: yourName,
        email,
        companyName: businessName,
        phnNumber: mobile,
        password: hashedPassword,
        role: designation,
        cardNo: 0,
        theme
      });
      if (!newUser) {
        return res.status(404).json({ message: "User creation failed" });
      }
      // Create new card for Enterprise Employee
      const newCard = new enterpriseEmployeCardModel({
        userId: newUser._id,
        businessName,
        businessType,
        email,
        yourName: yourName,
        designation,
        mobile,
        location,
        services,
        image: imageUrl,
        position,
        color,
        website,
        enterpriseId: userId,
        theme,
        topServices,
        whatsappNo,
        facebookLink,
        instagramLink,
        twitterLink,
      });
      const result = await newCard.save();
      if (result) {
        const enterpriseUpdate = await enterpriseUser.updateOne(
          { _id: userId },
          {
            $push: {
              empCards: {
                empCardId: result._id,
                status: 'active', // Default value
              },
              empIds: {
                empId: newUser._id,
                status: 'active', // Default value
              },
            },
          }
        );
        console.log('enterpriseUpdate-',enterpriseUpdate);

        await enterpriseEmployeModel.updateOne(
          { _id: newUser._id },
          { $inc: { cardNo: 1 } }
        );

        res.status(201).json({
          message: "Enterprise employee Card added successfully",
          entryId: result._id,
        });
        sendVerificationEmail(email, newUser.email, newUser.phnNumber);
      } else {
        return res
          .status(500)
          .json({ message: "Failed to save enterprise employee card" });
      }
    }
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

    const isUserExist = enterpriseUser.findOne({ _id: userId });
    if (!isUserExist) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    console.log("updateCard _ cardId--", cardId);
    console.log("Update enterprise card- image", image);
    // Find existing card to retrieve the current image URL if no new image is provided
    const existingCard = await Card.findById(cardId);
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

    // Update card with new data, including the S3 image URL if it was updated
    const result = await Card.updateOne(
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
  const { userId, cardId } = req.body;

  const isUserExist = enterpriseUser.findOne({ _id: userId });
  if (!isUserExist) {
    return res.status(400).json({ message: "Invalid user ID" });
  }

  try {
    const result = await Card.deleteOne({ userId, _id: cardId });
    console.log(result);
    if (result.deletedCount > 0) {
      await enterpriseUser.updateOne({ _id: userId }, { $inc: { cardNo: -1 } });
      return res.status(200).json({ message: "Card deleted successfully" });
    } else {
      return res.status(404).json({ message: "Card not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete card", error });
  }
};

async function isValidUserId(userId) {
  try {
    const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!objectId) return false; // If userId is not a valid ObjectId, return false

    const user = await enterpriseUser.findOne({ _id: objectId });
    return user !== null;
  } catch (error) {
    console.error("Error checking user ID:", error);
    return false;
  }
}

async function sendVerificationEmail(email, newEmail, phnNumber) {
  try {
    const mailResponse = await mailSender(
      email,
      "Connect - Business Card allotted",
      `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #333; text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 20px;">DISKUSS - Your Business Card is Ready!</h2>
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
        <p style="font-size: 18px; color: #555; margin: 10px 0;">Your new email:</p>
        <p style="font-size: 18px; color: #333; font-weight: 600;">${newEmail}</p>
        <p style="font-size: 18px; color: #555; margin: 10px 0;">Your new phone number:</p>
        <p style="font-size: 18px; color: #333; font-weight: 600;">${phnNumber}</p>
      </div>
      <p style="font-size: 14px; color: #777; margin-top: 20px; text-align: center;">
        If you didn’t request this, please ignore this email or contact our support team.
      </p>
    </div>
      `
    );
    console.log("Email sent successfully: ", mailResponse);
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}
