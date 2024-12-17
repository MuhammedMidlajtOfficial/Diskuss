const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const otpGenerator = require("otp-generator")
const mongoose = require('mongoose');

const { otpCollection, individualUserCollection } = require('../../DBConfig');
const { uploadImageToS3, deleteImageFromS3 } = require('../../services/AWS/s3Bucket');
const enterpriseEmployeModel = require('../../models/enterpriseEmploye.model');
const Contact  = require('../../models/contact.individual.model');
const enterpriseUser = require('../../models/enterpriseUser');

module.exports.postEnterpriseLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find enterprise user 
    const enterprise = await enterpriseUser.findOne({ email });
    const enterpriseEmp = await enterpriseEmployeModel.findOne({ email });

    // Check if neither user is found
    if (!enterprise && !enterpriseEmp) {
      return res.status(404).json({ message: 'No account associated with the provided email address.' });
    }

    let user = null;
    let emp = false;
    let passwordMatch = false;

    // Check password for enterprise user if found
    if (enterprise) {
      passwordMatch = await bcrypt.compare(password, enterprise.password);
      if (passwordMatch) {
        user = enterprise;
      }
    }

    // Check password for enterprise employee if found and no match with enterprise user
    if (!passwordMatch && enterpriseEmp) {
      passwordMatch = await bcrypt.compare(password, enterpriseEmp.password);
      if (passwordMatch) {
        user = enterpriseEmp;
        emp = true;
      }
    }

    // If password does not match for both, return invalid credentials
    if (!passwordMatch) {
      return res.status(401).json({ message: 'The password you entered is incorrect.' });
    }

    // Set JWT token if a match was found
    const payload = { id: user._id, email: user.email };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    req.session.user = user;

    return res.status(200).json({ message: 'Login successful', emp, accessToken, refreshToken, user });
    
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};

module.exports.postEnterpriseSignup = async (req,res)=>{
  try {
    const { companyName, industryType, phnNumber, email, otp, referralCode } = req.body
    const passwordRaw = req.body.password

    if (!companyName || !email || !industryType || !passwordRaw || !otp || !phnNumber) {
      return res.status(400).json({message:"All fields are required"}); // Correct response handling
    }
    // Check if email exists
    const isEmailExist = await enterpriseUser.findOne({ email }).exec();
    if (isEmailExist) {
      return res.status(409).json({message:"A user with this email address already exists. Please login instead"}); // Correct response handling
    }
    
    if (referralCode) {
    const referralCodeValid = await enterpriseUser.findOne({ referralCode}).exec();
    if (!referralCodeValid) {
      return res.status(409).json({message:"Invalid referral code"}); // Correct response handling
    }
  }

    // Validate OTP
    const response = await otpCollection.find({ email }).sort({ createdAt: -1 }).limit(1);
    if (response.length === 0 || otp !== response[0].otp) {
      return res.status(400).json({ success: false, message: 'The OTP is not valid' }); // Correct response handling
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);

    const newUser = await enterpriseUser.create({
      companyName,
      industryType,
      email,
      phnNumber,
      password: hashedPassword,
      referralCodeUsed : referralCode || ""
    });
    console.log(newUser);
    
    if (newUser) {
      const existingContact = await Contact.find({ 'contacts.phnNumber': newUser.phnNumber });
      if (existingContact) {
        const contact = await Contact.updateOne(
          { 'contacts.phnNumber': newUser.phnNumber },
          {
            $set: { 
              'contacts.$.isDiskussUser': true,  // Update the contact's `isDiskussUser` field
              'contacts.$.userId': newUser._id // Update the `userId` field for the contact
            }
          }
        );
        if (contact.modifiedCount > 0) {
          console.log("Contact updated successfully, Profile updated successfully");
          return res.status(201).json({ Contact_message: "Contact updated successfully.", message: "User created", user: newUser });
        } else {
          console.log(" Contact not updated , Profile updated successfully");
          return res.status(201).json({ Contact_message: "Contact not updated ", message: "User created", user: newUser });
        }
      } else {
        console.log("Error: Contact not found.");
        return res.status(404).json({ Contact_message: "Error: Contact not found." });
      }
    } else {
      return res.status(400).json({ message: "Error: User creation failed." });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
}

module.exports.postforgotPassword = async (req, res ) => {
  try {
    console.log(req.body);
    const { email } = req.body
    const passwordRaw = req.body.password
     
    if (!email || !passwordRaw ) {
      res.status(400, "All fields are Required")
    }

    const isEmailExist = await enterpriseUser.findOne({ email: email }).exec();
    if(isEmailExist){
      // hash password
      const hashedPassword = await bcrypt.hash(passwordRaw, 10);
      console.log('hashedPassword',hashedPassword);

      const user = await enterpriseUser.updateOne(
        { email: email },
        { $set: { password: hashedPassword } }
      );
      console.log('user',user);
      // Check
      if (user.modifiedCount > 0) {
        return res.status(200).json({ message: "Password changed successfully." });
      } else {
        return res.status(400).json({ message: "Error: Password update failed." });
      }
    }else{
      res.status(401).json({ message : "email not found"})
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
}

module.exports.OtpValidate = async (req, res ) => {
  try {
    const { email, otp } = req.body
    const isEmailExist = await enterpriseUser.findOne({ email: email }).exec();
    if(isEmailExist){
      const response = await otpCollection.find({ email }).sort({ createdAt: -1 }).limit(1);
      console.log("res-",response);
      if (response.length === 0 || otp !== response[0].otp) {
        return res.status(400).json({ success: false, message: 'The OTP is not valid' })
      } else {
        return res.status(200).json({ success: true, message: 'The OTP is valid' })
      } 
    } return res.status(401).json({ message: "User Not Found with this email" })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
}

module.exports.sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const isEmailExist = await enterpriseUser.findOne({ email: email }).exec();
    if(!isEmailExist){
      return res.status(401).json({ message: "Email not exist" })
    }
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    let result = await otpCollection.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
      result = await otpCollection.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };
    await otpCollection.create(otpPayload);
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};

module.exports.sendOTP = async (req, res) => {
  try {
    const { email, phnNumber } = req.body;

    // Check for missing fields
    if ( !email || !phnNumber) {
      return res.status(400).json({ message :"email & phnNumber are required"}); // Correct response handling
    }
    
    // Check if email exists in enterpriseUser or enterpriseEmployee
    const isEmailInEnterpriseUser = await enterpriseUser.findOne({ email }).exec();
    const isEmailInEnterpriseEmployee = await enterpriseEmployeModel.findOne({ email }).exec();

    if (isEmailInEnterpriseUser || isEmailInEnterpriseEmployee) {
      return res.status(409).json({ message: "A user with this email address already exists. Please login instead" });
    }

    // Check if phone number exists in any of the collections
    const isIndividualExist = await individualUserCollection.findOne({ phnNumber }).exec();
    const isEnterpriseExist = await enterpriseUser.findOne({ phnNumber }).exec();
    const isEnterpriseEmployeeExist = await enterpriseEmployeModel.findOne({ phnNumber }).exec();

    if (isIndividualExist) {
      return res.status(409).json({ message: "This phone number is already associated with an individual user" });
    }

    if (isEnterpriseExist) {
      return res.status(409).json({ message: "This phone number is already associated with an enterprise user" });
    }

    if (isEnterpriseEmployeeExist) {
      return res.status(409).json({ message: "This phone number is already associated with an enterprise employee" });
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    let result = await otpCollection.findOne({ otp: otp });
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
      });
      result = await otpCollection.findOne({ otp: otp });
    }
    const otpPayload = { email, otp };
    await otpCollection.create(otpPayload);
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      otp,
    });
  } catch (error) {
    console.log(error)
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

    const isEmailExist = await enterpriseUser.findOne({ email: email }).exec();
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
    const user = await enterpriseUser.updateOne(
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
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
}

module.exports.updateProfile = async (req, res) => {
  try {
    const {
      userId,
      companyName,
      industryType,
      image,
      phnNumber,
      aboutUs,
      website,
      address,
      whatsappNo,
      facebookLink,
      instagramLink,
      twitterLink
    } = req.body;

    const isUserExist = await enterpriseUser.findOne({ _id: userId }).exec();
    if (!isUserExist) {
      return res.status(401).json({ message: "User not found" });
    }

    let isIndividualExist;
    let isEnterpriseExist;
    let isEnterpriseEmployeeExist;

    if (phnNumber) {
      // Check if phone number exists in any of the collections, excluding the current user
      isIndividualExist = await individualUserCollection.findOne({
        phnNumber,
        _id: { $ne: userId }, // Exclude the current user by _id
      }).exec();
    
      isEnterpriseExist = await enterpriseUser.findOne({
        phnNumber,
        _id: { $ne: userId }, // Exclude the current user by _id
      }).exec();
    
      isEnterpriseEmployeeExist = await enterpriseEmployeModel.findOne({
        phnNumber,
        _id: { $ne: userId }, // Exclude the current user by _id
      }).exec();
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

    let imageUrl = isUserExist.image; // Default to existing image if no new image is provided

    // Upload image to S3 if a new image is provided
    if (image) {
      // Delete the old image from S3 (if exists)
      if (isUserExist?.image) {
        await deleteImageFromS3(isUserExist.image); // Delete the old image from S3
      }
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${userId}-company-profile.jpg`; // Unique file name based on user ID
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // URL of the uploaded image
    }

    // Update profile
    const user = await enterpriseUser.updateOne(
      { _id: userId },
      {
        $set: {
          companyName,
          industryType,
          image: imageUrl,
          aboutUs,
          phnNumber,
          website,
          address,
          "socialMedia.whatsappNo": whatsappNo,
          "socialMedia.facebookLink": facebookLink,
          "socialMedia.instagramLink": instagramLink,
          "socialMedia.twitterLink": twitterLink,
        },
      }
    );

    if (user.modifiedCount > 0) {
      const forNumber = await enterpriseUser.findOne({ _id: userId }).select('phnNumber').exec();
      const existingContact = await Contact.find({ 'contacts.phnNumber': forNumber.phnNumber });
      if (existingContact) {
        const contact = await Contact.updateOne(
          { 'contacts.phnNumber': forNumber.phnNumber },
          {
            $set: { 
              'contacts.$.isDiskussUser': true,  // Update the contact's `isDiskussUser` field
              'contacts.$.userId': forNumber._id // Update the `userId` field for the contact
            }
          }
        );
        if (contact.modifiedCount > 0) {
          console.log("Contact updated successfully, Profile updated successfully");
          return res.status(200).json({ Contact_message: "Contact updated successfully.", Profile_message: "Profile updated successfully.", contact });
        } else {
          console.log(" Contact not updated , Profile updated successfully");
          return res.status(200).json({ Contact_message: "Contact update failed!!.", Profile_message: "Profile updated successfully." });
        }
      } else {
        console.log("Error: Contact not found.");
        return res.status(404).json({ Contact_message: "Error: Contact not found." });
      }
    } else {
      return res.status(400).json({ message: "Error: Profile update failed." });
    }

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};

module.exports.getProfile = async (req, res) => {
  try {
    const { id: userId } = req.params;
    
    // Log userId to verify the format received
    console.log(`Received userId: "${userId}"`);


    // Validate if cleanUserId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.log('cleanUserId',userId);
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await enterpriseUser.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'An unexpected error occurred. Please try again later.' });
  }
};
