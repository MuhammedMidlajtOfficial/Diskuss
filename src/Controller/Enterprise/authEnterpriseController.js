const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const otpGenerator = require("otp-generator")

const enterpriseUser = require("../../models/enterpriseUser");
const { otpCollection } = require('../../DBConfig');


module.exports.postEnterpriseLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await enterpriseUser.findOne({ email });
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

module.exports.postEnterpriseSignup = async (req,res)=>{
  try {
    const { companyName, industryType, email, otp } = req.body
    const passwordRaw = req.body.password

    if (!companyName || !email || !industryType || !passwordRaw || !otp) {
      return res.status(400).json({message:"All fields are required"}); // Correct response handling
    }
    // Check if email exists
    const isEmailExist = await enterpriseUser.findOne({ email }).exec();
    if (isEmailExist) {
      return res.status(409).json({message:"A user with this email address already exists. Please login instead"}); // Correct response handling
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
      password: hashedPassword,
    });
    console.log(newUser);
    return res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    console.log(err);
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
    return res.status(500).json({ message: 'Server error' });
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
    } return res.status(401).json({ message: "Email not exist" })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
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
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

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
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports.updateProfile = async (req, res ) => {
  try {
    const { userId, companyName, industryType, image, aboutUs, website, address, whatsappNo, facebookLink, instagramLink, twitterLink } = req.body
     
    // if (!role || !name || !website || !address || !whatsappNo || !facebookLink || !instagramLink || !twitterLink ) {
    //   return res.status(400).json({ message: "All fields are Required"})
    // }

    const isUserExist = await enterpriseUser.findOne({ _id:userId }).exec();
    console.log("isUserExist-",isUserExist);
    if(!isUserExist){
      return res.status(401).json({ message : "user not found"})
    }
    // Update password
    const user = await enterpriseUser.updateOne(
      { _id: userId },
      { 
        $set: { 
          companyName, 
          industryType,
          image,
          aboutUs,
          website,
          address,
          "socialMedia.whatsappNo": whatsappNo,
          "socialMedia.facebookLink": facebookLink,
          "socialMedia.instagramLink": instagramLink,
          "socialMedia.twitterLink": twitterLink
        }
      }
    );
    console.log('user',user);

    if (user.modifiedCount > 0) {
      return res.status(200).json({ message: "Profile updated successfully." });
    } else {
      return res.status(400).json({ message: "Error: Profile update failed." });
    }
      
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports.getProfile = async (req, res ) => {
  try {
    const { id: userId } = req.params;
    const user = await enterpriseUser.findOne({ _id : userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user })
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
}