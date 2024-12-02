const bcrypt = require('bcrypt');
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const enterpriseUser = require("../../models/enterpriseUser");
const enterpriseEmployeCardModel = require('../../models/enterpriseEmployeCard.model');
const mailSender = require('../../util/mailSender');
const Contact  = require('../../models/contact.individul.model');


module.exports.getCardForUser = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const user = await enterpriseEmployeCardModel.findOne({ userId });
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user })
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
          return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to get card", error });
    }
};

module.exports.getContactOfEmployee = async (req, res) => {
    try {
        const { id: empId } = req.params;
        const user = await enterpriseEmployeModel.findOne({ _id : empId }).populate({
            path: 'contacts',
            strictPopulate: false, 
        } )
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        console.log(user);
        return res.status(200).json({ contacts:user })
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Failed to fetch employee", error });
    }
}

module.exports.createCard = async (req, res) => {
    const {
        enterpriseId,
        email,
        businessName,
        empName,
        designation,
        mobile,
        location,
        services,
        image,
        position,
        color,
        website,
        username,
    } = req.body;
    const passwordRaw = req.body.password;

    try {
        // Check for missing fields
        if (!email || !passwordRaw || !enterpriseId || !businessName || !empName || !designation || !mobile || !location || !services || !image || !position || !color || !website) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user email exists
        const isEmailExist = await enterpriseEmployeModel.findOne({ email }).exec();
        const isEmailExistInEnterpriseUser = await enterpriseUser.findOne({ email }).exec();
        if (isEmailExist || isEmailExistInEnterpriseUser) {
            return res.status(409).json({ message: "A user with this email address already exists. Please use another email" });
        }

        // Check if Enterprise ID exists
        const isEnterpriseIDExist = await enterpriseUser.findOne({ _id: enterpriseId }).exec();
        if (!isEnterpriseIDExist) {
            return res.status(409).json({ message: "Enterprise user not found" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        // Create a new user
        const newUser = await enterpriseEmployeModel.create({
            username,
            email,
            password: hashedPassword,
            cardNo: 0,
        });

        if (!newUser) {
            return res.status(404).json({ message: "User creation failed" });
        }

        // Image URL handling
        let imageUrl = image;

        // Uncomment and complete S3 upload functionality if needed
        // if (image) {
        //     const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
        //     const fileName = `${newUser._id}-businessCard.jpg`;
        //     try {
        //         const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        //         imageUrl = uploadResult.Location;
        //     } catch (uploadError) {
        //         console.log("Error uploading image to S3:", uploadError);
        //         return res.status(500).json({ message: "Failed to upload image", error: uploadError });
        //     }
        // }

        // Create new card
        const newCard = new enterpriseEmployeCardModel({
            userId: newUser._id,
            businessName,
            email,
            empName,
            designation,
            mobile,
            location,
            services,
            image: imageUrl,
            position,
            color,
            website,
            enterpriseId
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
                    $inc: { cardNo: 1 }  // Increment cardNo by 1
                }
            );

            await enterpriseEmployeModel.updateOne(
                { _id : newUser._id },
                { $inc : { cardNo : 1 } }
            )

            res.status(201).json({ message: "Card added successfully", entryId: result._id });

            sendVerificationEmail(email,newUser.email,passwordRaw)
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
      const { userId, image, mobile, role, name, website, address, whatsappNo, facebookLink, instagramLink, twitterLink } = req.body;
  
      const isUserExist = await enterpriseEmployeModel.findOne({ _id: userId }).exec();
      if (!isUserExist) {
        return res.status(401).json({ message: "User not found" });
      }
  
      let imageUrl = isUserExist?.image; // Default to existing image if no new image is provided
  
      // Upload image to S3 if a new image is provided
      if (image) {
        // Delete the old image from S3 (if exists)
        if (isUserExist?.image) {
          await deleteImageFromS3(isUserExist.image); // Delete the old image from S3
        }
        const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
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
            const forNumber = await enterpriseEmployeModel.findOne({ _id: userId }).select('mobile').exec();
            const existingContact = await Contact.find({ phnNumber: forNumber.mobile });
            if (existingContact) {
                const contact = await Contact.updateOne(
                    { phnNumber: forNumber.mobile },
                    { $set: { isDiskussUser: true, userId: forNumber._id } }
                );
                if (contact.modifiedCount > 0) {
                    console.log("Contact updated successfully, Profile updated successfully");
                    return res.status(200).json({ Contact_message: "Contact updated successfully.", Profile_message: "Profile updated successfully.", contact });
                } else {
                    console.log("Error: Contact update failed, Profile updated successfully");
                    return res.status(200).json({ Contact_message: "Error: Contact update failed.", Profile_message: "Profile updated successfully." });
                }
            } else {
                console.log("Error: Contact not found.");
                return res.status(404).json({ Contact_message: "Error: Contact not found." });
            }
        }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Server error' });
    }
};

module.exports.resetPassword = async (req, res ) => {
    try {
      console.log(req.body);
      const { email, oldPassword } = req.body
      const passwordRaw = req.body.password
       
      if (!email || !passwordRaw || !oldPassword ) {
        return res.status(400).json({ message: "All fields are Required"})
      }
  
      const isEmailExist = await enterpriseEmployeModel.findOne({ email: email }).exec();
      console.log("isEmailExist-",isEmailExist);
      if(!isEmailExist){
        return res.status(401).json({ message : "email not found"})
      }
      // Check password match
      const passwordMatch = await bcrypt.compare(oldPassword, isEmailExist.password);
      if(!passwordMatch){
        return res.status(401).json({ message : "Password not matching"})
      }
      // hash password
      const hashedPassword = await bcrypt.hash(passwordRaw, 10);
      // Update password
      const user = await enterpriseEmployeModel.updateOne(
        { email: email },
        { $set: { password: hashedPassword } }
      );
      console.log('user',user);
  
      if (user.modifiedCount > 0) {
        return res.status(200).json({ message: "Password changed successfully." });
      } else {
        return res.status(400).json({ message: "Error: Password update failed." });
      }
        
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

async function sendVerificationEmail(email,newEmail,newPassword) {
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