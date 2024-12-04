const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { otpCollection } = require('../../DBConfig');
const enterpriseUser = require('../../models/enterpriseUser');
const { individualUserCollection } = require('../../DBConfig');
const EnterpriseEmployee = require('../../models/enterpriseEmploye.model');
const otpGenerator = require("otp-generator");
const { uploadImageToS3, deleteImageFromS3 } = require('../../services/AWS/s3Bucket');
const { createProfile } = require('../Profile/profileController');
const Contact  = require('../../models/contact.individul.model');


module.exports.postIndividualLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await individualUserCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Check password match
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    // Set jwt token
    const payload = { id: user._id, email: user.email };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    req.session.user = user

    return res.status(200).json({ message: 'Login successful', accessToken, refreshToken,user });
  } catch (error) {
    console.error('Error during login:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.postIndividualSignup = async (req, res) => {
  const { username, email, phnNumber, otp } = req.body;
  const passwordRaw = req.body.password;

  try {
    // Check for missing fields
    if (!username || !email || !passwordRaw || !otp || !phnNumber) {
      return res.status(400).json({ message :"All fields are required"}); // Correct response handling
    }
    // Check if email exists
    const isEmailExist = await individualUserCollection.findOne({ email }).exec();
    if (isEmailExist) {
      return res.status(409).json({ message :"A user with this email address already exists. Please login instead"}); // Correct response handling
    }
    // Validate OTP
    const otpRecord = await otpCollection.findOne({ email }).sort({ createdAt: -1 });
    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'The OTP is not valid or has expired' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);
    // Create a new user
    const newUser = await individualUserCollection.create({
      username,
      email,
      phnNumber,
      password: hashedPassword,
      // cardNo: 0,
    });
    console.log(newUser);

    if (newUser) {
      const existingContact = await Contact.find({ phnNumber: newUser.phnNumber });
      if (existingContact) {
        const contact = await Contact.updateOne(
          { phnNumber: newUser.phnNumber },
          { $set: { isDiskussUser: true, userId: newUser._id } }
        );
        if (contact.modifiedCount > 0) {
          console.log("Contact updated successfully, User created successfully");
          return res.status(201).json({ Contact_message: "Contact updated successfully.", message: "User created successfully.", user: newUser });
        } else {
          console.log("Contact not updated , User created successfully");
          return res.status(201).json({ Contact_message: "Contact update failed.", message: "User created successfully.", user: newUser});
        }
      } else {
        console.log("Error: Contact not found.");
        return res.status(404).json({ Contact_message: "Error: Contact not found." });
      }
    } else {
      return res.status(400).json({ message: "Error: User creation failed." });
    }
  } catch (error) {
    console.error("Error in postIndividualSignup:", error); // Detailed error logging
    return res.status(500).json({ message: 'Server error' });
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

    const isEmailExist = await individualUserCollection.findOne({ email: email }).exec();
    if(isEmailExist){
      // hash password
      const hashedPassword = await bcrypt.hash(passwordRaw, 10);
      console.log('hashedPassword',hashedPassword);

      const user = await individualUserCollection.updateOne(
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
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports.OtpValidate = async (req, res ) => {
  try {
    const { email, otp } = req.body
    const isEmailExist = await individualUserCollection.findOne({ email: email }).exec();
    if(isEmailExist){
      const response = await otpCollection.find({ email }).sort({ createdAt: -1 }).limit(1);
      console.log("res-",response);
      if (response.length === 0 || otp !== response[0].otp) {
        return res.status(400).json({ success: false, message: 'The OTP is not valid' })
      } else {
        return res.status(200).json({ success: true, message: 'The OTP is valid' })
      }
    } return res.status(401).json({ message: "Email not exist" })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports.sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const isEmailExist = await individualUserCollection.findOne({ email: email }).exec();
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
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.sendOTP = async (req, res) => {
  try {
    const { email, phnNumber } = req.body;
    console.log("email form individual sendOTP --",email);

    // Check for missing fields
    if ( !email || !phnNumber) {
      return res.status(400).json({ message :"email & phnNumber are required"}); // Correct response handling
    }

    // Check if email exists
    const isEmailExist = await individualUserCollection.findOne({ email }).exec();
    if (isEmailExist) {
      return res.status(409).json({ message: "A user with this email address already exists. Please login instead" });
    }

    let isIndividualExist;
    let isEnterpriseExist;
    let isEnterpriseEmployeeExist;

    if(phnNumber){
      // Check if phone number exists in any of the collections
      isIndividualExist = await individualUserCollection.findOne({ phnNumber }).exec();
      isEnterpriseExist = await enterpriseUser.findOne({ phnNumber }).exec();
      isEnterpriseEmployeeExist = await EnterpriseEmployee.findOne({ phnNumber }).exec();
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

    // Generate OTP
    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log(otp);

    // Ensure OTP is unique
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
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.resetPassword = async (req, res ) => {
  try {
    const { email, oldPassword } = req.body
    const passwordRaw = req.body.password
     
    if (!email || !passwordRaw || !oldPassword ) {
      return res.status(400).json({ message: "All fields are Required"})
    }

    const isEmailExist = await individualUserCollection.findOne({ email: email }).exec();
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
    const user = await individualUserCollection.updateOne(
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

module.exports.updateProfile = async (req, res) => {
  try {
    const { userId, image, phnNumber, role, name, website, address, whatsappNo, facebookLink, instagramLink, twitterLink } = req.body;

    const isUserExist = await individualUserCollection.findOne({ _id: userId }).exec();
    if (!isUserExist) {
      return res.status(401).json({ message: "User not found" });
    }

    let isIndividualExist;
    let isEnterpriseExist;
    let isEnterpriseEmployeeExist;

    if(phnNumber){
      // Check if phone number exists in any of the collections
      isIndividualExist = await individualUserCollection.findOne({ phnNumber }).exec();
      isEnterpriseExist = await enterpriseUser.findOne({ phnNumber }).exec();
      isEnterpriseEmployeeExist = await enterpriseEmployeModel.findOne({ phnNumber }).exec();
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

    // If a new image is provided, delete the old one from S3 and upload the new image
    if (image) {
      // Delete the old image from S3 (if exists)
      if (isUserExist.image) {
        await deleteImageFromS3(isUserExist.image); // Delete the old image from S3
      }

      // Upload new image to S3
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${userId}-profile.jpg`; // Create a unique file name based on user ID
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // URL of the uploaded image
    }

    // Update profile
    const user = await individualUserCollection.updateOne(
      { _id: userId },
      {
        $set: {
          image: imageUrl,
          role,
          username: name,
          website,
          phnNumber,
          address,
          "socialMedia.whatsappNo": whatsappNo,
          "socialMedia.facebookLink": facebookLink,
          "socialMedia.instagramLink": instagramLink,
          "socialMedia.twitterLink": twitterLink,
        },
      }
    );

    const forNumber = await individualUserCollection.findOne({ _id: userId }).select('phnNumber').exec();
    const existingContact = await Contact.find({ phnNumber: forNumber.phnNumber });
    if (existingContact) {
      const contact = await Contact.updateOne(
        { phnNumber: forNumber.phnNumber },
        { $set: { isDiskussUser: true, userId: forNumber._id } }
      );
      if (contact.modifiedCount > 0) {
        console.log("Contact updated successfully, Profile updated successfully");
        return res.status(200).json({ Contact_message: "Contact updated successfully.", Profile_message: "Profile updated successfully.", contact });
      } else {
        console.log("Error: Contact not updated , Profile updated successfully");
        return res.status(200).json({ Contact_message: "Contact update failed.", Profile_message: "Profile updated successfully." });
      }
    } else {
      console.log("Error: Contact not found.");
      return res.status(404).json({ Contact_message: "Error: Contact not found." });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getProfile = async (req, res ) => {
  try {
    const { id: userId } = req.params;
    const user = await individualUserCollection.findOne({ _id : userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
}