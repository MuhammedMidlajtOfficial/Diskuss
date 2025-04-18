const bcrypt = require("bcrypt");
const enterpriseEmployeModel = require("../../models/users/enterpriseEmploye.model");
const enterpriseUser = require("../../models/users/enterpriseUser");
const enterpriseEmployeCardModel = require("../../models/cards/enterpriseEmployeCard.model");
const mailSender = require("../../util/mailSender");
const Contact = require("../../models/contacts/contact.individual.model");
const {
  deleteImageFromS3,
  uploadImageToS3,
} = require("../../services/AWS/s3Bucket");
const individualUserCollection = require("../../models/users/individualUser");

module.exports.getCardForUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await enterpriseEmployeModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const card = await enterpriseEmployeCardModel.findOne({ userId });
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }
    return res.status(200).json({ card });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get card", error });
  }
};

module.exports.getProfile = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const user = await enterpriseEmployeModel.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get card", error });
  }
};

module.exports.getContactOfEmployee = async (req, res) => {
  try {
    const { id: empId } = req.params;
    const user = await enterpriseEmployeModel.findOne({ _id: empId }).populate({
      path: "contacts",
      strictPopulate: false,
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user);
    return res.status(200).json({ contacts: user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch employee", error });
  }
};

module.exports.createCard = async (req, res) => {
  const {
    enterpriseId,
    email,
    businessName,
    yourName,
    designation,
    mobile,
    location,
    services,
    image,
    position,
    color,
    website,
    username,
    whatsappNo,
    facebookLink,
    instagramLink,
    twitterLink,
  } = req.body;
  const passwordRaw = req.body.password;

  try {
    // Check for missing fields
    if (
      !email ||
      !passwordRaw ||
      !enterpriseId ||
      !businessName ||
      !yourName ||
      !designation ||
      !mobile ||
      !location ||
      !services ||
      !image ||
      !position ||
      !color ||
      !website ||
      !whatsappNo ||
      !facebookLink ||
      !instagramLink ||
      !twitterLink
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user email exists
    const isEmailExist = await enterpriseEmployeModel.findOne({ email }).exec();
    const isEmailExistInEnterpriseUser = await enterpriseUser
      .findOne({ email })
      .exec();
    if (isEmailExist || isEmailExistInEnterpriseUser) {
      return res.status(409).json({
        message:
          "A user with this email address already exists. Please use another email",
      });
    }

    // Check if Enterprise ID exists
    const isEnterpriseIDExist = await enterpriseUser
      .findOne({ _id: enterpriseId })
      .exec();
    if (!isEnterpriseIDExist) {
      return res.status(409).json({ message: "Enterprise user not found" });
    }

    // Check if phone number exists in any of the collections
    const isIndividualExist = await individualUserCollection
      .findOne({ phnNumber })
      .exec();
    const isEnterpriseExist = await enterpriseUser
      .findOne({ phnNumber })
      .exec();
    const isEnterpriseEmployeeExist = await enterpriseEmployeModel
      .findOne({ phnNumber })
      .exec();

    if (isIndividualExist) {
      return res.status(409).json({
        message:
          "This phone number is already associated with an individual user",
      });
    }

    if (isEnterpriseExist) {
      return res.status(409).json({
        message:
          "This phone number is already associated with an enterprise user",
      });
    }

    if (isEnterpriseEmployeeExist) {
      return res.status(409).json({
        message:
          "This phone number is already associated with an enterprise employee",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    // Create a new user
    const newUser = await enterpriseEmployeModel.create({
      username,
      email,
      phnNumber,
      companyName: businessName,
      password: hashedPassword,
      cardNo: 0,
    });

    if (newUser) {
      const existingContact = await Contact.find({
        phnNumber: newUser.phnNumber,
      });
      if (existingContact) {
        const contact = await Contact.updateOne(
          { phnNumber: newUser.phnNumber },
          { $set: { isDiskussUser: true, userId: newUser._id } }
        );
        if (contact.modifiedCount > 0) {
          console.log(
            "Contact updated successfully, User created successfully"
          );
          res.status(201).json({
            Contact_message: "Contact updated successfully.",
            message: "User created successfully.",
            user: newUser,
          });
        } else {
          console.log("Contact not updated , User created successfully");
          res.status(201).json({
            Contact_message: "Contact update failed.",
            message: "User created successfully.",
            user: newUser,
          });
        }
      } else {
        console.log("Error: Contact not found.");
        res.status(404).json({ Contact_message: "Error: Contact not found." });
      }
    } else {
      return res.status(400).json({ message: "Error: User creation failed." });
    }

    // Image URL handling
    let imageUrl = image;

    if (image) {
      const imageBuffer = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const fileName = `${newUser._id}-businessCard.jpg`;
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location;
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res
          .status(500)
          .json({ message: "Failed to upload image", error: uploadError });
      }
    }

    // Create new card
    const newCard = new enterpriseEmployeCardModel({
      userId: newUser._id,
      businessName,
      email,
      yourName,
      designation,
      mobile,
      location,
      services,
      image: imageUrl,
      position,
      color,
      website,
      enterpriseId,
      whatsappNo,
      facebookLink,
      instagramLink,
      twitterLink,
    });

    const result = await newCard.save();
    if (result) {
      await enterpriseUser.updateOne(
        { _id: enterpriseId },
        {
          $push: {
            empCards: result._id,
            empId: newUser._id,
          },
          $inc: { cardNo: 1 }, // Increment cardNo by 1
        }
      );

      await enterpriseEmployeModel.updateOne(
        { _id: newUser._id },
        { $inc: { cardNo: 1 } }
      );

      res
        .status(201)
        .json({ message: "Card added successfully", entryId: result._id });

      sendVerificationEmail(email, newUser.email, passwordRaw);
    } else {
      return res.status(500).json({ message: "Failed to save card" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add card", error });
  }
};

module.exports.updateProfile = async (req, res) => {
  try {
    const {
      userId,
      image,
      mobile,
      role,
      name,
      website,
      phnNumber,
      address,
      whatsappNo,
      facebookLink,
      instagramLink,
      twitterLink,
    } = req.body;

    const isUserExist = await enterpriseEmployeModel
      .findOne({ _id: userId })
      .exec();
    if (!isUserExist) {
      return res.status(401).json({ message: "User not found" });
    }

    let isIndividualExist;
    let isEnterpriseExist;
    let isEnterpriseEmployeeExist;

    if (phnNumber) {
      // Check if phone number exists in any of the collections, excluding the current user
      isIndividualExist = await individualUserCollection
        .findOne({
          phnNumber,
          _id: { $ne: userId }, // Exclude the current user by _id
        })
        .exec();

      isEnterpriseExist = await enterpriseUser
        .findOne({
          phnNumber,
          _id: { $ne: userId }, // Exclude the current user by _id
        })
        .exec();

      isEnterpriseEmployeeExist = await enterpriseEmployeModel
        .findOne({
          phnNumber,
          _id: { $ne: userId }, // Exclude the current user by _id
        })
        .exec();
    }

    if (isIndividualExist) {
      return res.status(409).json({
        message:
          "This phone number is already associated with an individual user",
      });
    }

    if (isEnterpriseExist) {
      return res.status(409).json({
        message:
          "This phone number is already associated with an enterprise user",
      });
    }

    if (isEnterpriseEmployeeExist) {
      return res.status(409).json({
        message:
          "This phone number is already associated with an enterprise employee",
      });
    }

    let imageUrl = isUserExist?.image; // Default to existing image if no new image is provided

    // Upload image to S3 if a new image is provided
    if (image) {
      // Delete the old image from S3 (if exists)
      if (isUserExist?.image) {
        await deleteImageFromS3(isUserExist.image); // Delete the old image from S3
      }
      const imageBuffer = Buffer.from(
        image.replace(/^data:image\/\w+;base64,/, ""),
        "base64"
      );
      const fileName = `${userId}-profile.jpg`; // Create a unique file name based on user ID
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // URL of the uploaded image
    }

    // Update profile
    const user = await enterpriseEmployeModel.updateOne(
      { _id: userId },
      {
        $set: {
          image: imageUrl,
          role,
          username: name,
          website,
          mobile,
          address,
          "socialMedia.whatsappNo": whatsappNo,
          "socialMedia.facebookLink": facebookLink,
          "socialMedia.instagramLink": instagramLink,
          "socialMedia.twitterLink": twitterLink,
        },
      }
    );
    if (user.modifiedCount > 0) {
      const forNumber = await enterpriseEmployeModel
        .findOne({ _id: userId })
        .select("mobile")
        .exec();
      const existingContact = await Contact.find({
        phnNumber: forNumber.mobile,
      });
      if (existingContact) {
        const contact = await Contact.updateOne(
          { phnNumber: forNumber.mobile },
          { $set: { isDiskussUser: true, userId: forNumber._id } }
        );
        if (contact.modifiedCount > 0) {
          console.log(
            "Contact updated successfully, Profile updated successfully"
          );
          return res.status(200).json({
            Contact_message: "Contact updated successfully.",
            Profile_message: "Profile updated successfully.",
            contact,
          });
        } else {
          console.log(
            "Error: Contact update failed, Profile updated successfully"
          );
          return res.status(200).json({
            Contact_message: "Error: Contact update failed.",
            Profile_message: "Profile updated successfully.",
          });
        }
      } else {
        console.log("Error: Contact not found.");
        return res
          .status(404)
          .json({ Contact_message: "Error: Contact not found." });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      Contact_message: "An unexpected error occurred. Please try again later.",
    });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    console.log(req.body);
    const { email, oldPassword } = req.body;
    const passwordRaw = req.body.password;

    if (!email || !passwordRaw || !oldPassword) {
      return res.status(400).json({ message: "All fields are Required" });
    }

    const isEmailExist = await enterpriseEmployeModel
      .findOne({ email: email })
      .exec();
    console.log("isEmailExist-", isEmailExist);
    if (!isEmailExist) {
      return res.status(401).json({ message: "email not found" });
    }
    // Check password match
    const passwordMatch = await bcrypt.compare(
      oldPassword,
      isEmailExist.password
    );
    if (!passwordMatch) {
      return res.status(401).json({ message: "Password not matching" });
    }
    // hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);
    // Update password
    const user = await enterpriseEmployeModel.updateOne(
      { email: email },
      { $set: { password: hashedPassword } }
    );
    console.log("user", user);

    if (user.modifiedCount > 0) {
      return res
        .status(200)
        .json({ message: "Password changed successfully." });
    } else {
      return res
        .status(400)
        .json({ message: "Error: Password update failed." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports.removeEmployee = async (req, res) => {
  try {
    const { empId, enterpriseId } = req.body;

    if (!empId || !enterpriseId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the employee exists
    const isEmpExist = await enterpriseEmployeModel.findById(empId);
    if (!isEmpExist) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if the enterprise exists
    const isEnterpriseExist = await enterpriseUser.findById(enterpriseId);
    if (!isEnterpriseExist) {
      return res.status(404).json({ message: "Enterprise not found" });
    }

    // Find and delete the employee's card
    const getCard = await enterpriseEmployeCardModel.findOne({ userId: empId });
    if (getCard) {
      await enterpriseEmployeCardModel.deleteOne({ userId: empId });
    }

    // Update enterprise details by removing empId and empCards
    await enterpriseUser.updateOne(
      { _id: enterpriseId },
      { $pull: { empId, empCards: getCard?._id } }
    );

    return res.status(200).json({ message: "Employee deleted successfully." });
  } catch (error) {
    console.error("Error removing employee:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

async function sendVerificationEmail(email, newEmail, newPassword) {
  try {
    const mailResponse = await mailSender(
      email,
      "Connect - Business Card allotted",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; color: #333; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center; font-size: 24px; font-weight: 600; margin-bottom: 20px;">Know Connections - Your Business Card is Ready!</h2>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center;">
          <p style="font-size: 18px; color: #555; margin: 10px 0;">Your new email:</p>
          <p style="font-size: 18px; color: #333; font-weight: 600;">${newEmail}</p>
          <p style="font-size: 18px; color: #555; margin: 10px 0;">Your temporary password:</p>
          <p style="font-size: 18px; color: #333; font-weight: 600;">${newPassword}</p>
          
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
