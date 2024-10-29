const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
<<<<<<< HEAD
const { otpCollection } = require('../../DBConfig');
const IndividualUserSchema = require('../../models/individualUser');
=======
// const { otpCollection } = require('../../DBConfig');
const { otpCollection } = require('../../DBConfig');

const { individualUserCollection } = require('../../DBConfig');
>>>>>>> Naren
const otpGenerator = require("otp-generator")


module.exports.postIndividualLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await IndividualUserSchema.findOne({ email });
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

<<<<<<< HEAD
module.exports.postIndividualSignup = async (req, res ) => {
    const { username, email, otp } = req.body;
    const passwordRaw = req.body.password;
    try { 
        if (!username || !email || !passwordRaw || !otp) {
            res.status(400, "All fields are Required")
        }

        const isUsernameExist = await IndividualUserSchema.findOne({ username: username }).exec()

        if (isUsernameExist) {
            res.status(409, "Username Already Taken. Please Choose different one or login instead");
        }

        const isEmailExist = await IndividualUserSchema.findOne({ email: email }).exec();

        if (isEmailExist) {
            return res.status(409, "A user with this email address already exist. Please login instead");
        }

        const response = await otpCollection.find({ email }).sort({ createdAt: -1 }).limit(1);
        if (response.length === 0 || otp !== response[0].otp) {
            return res.status(400, { success: false, message: 'The OTP is not valid' })
        }

        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        const newUser = await IndividualUserSchema.create({
            username,
            email,
            password: hashedPassword,
        })

        res.status(201).json({ message : "user created" })
    } catch (error) {
        console.log(error)
=======
module.exports.postIndividualSignup = async (req, res) => {
  const { username, email, otp } = req.body;
  const passwordRaw = req.body.password;

  try {
    // Check for missing fields
    if (!username || !email || !passwordRaw || !otp) {
      return res.status(400).send("All fields are required"); // Correct response handling
>>>>>>> Naren
    }
    // Check if email exists
    const isEmailExist = await individualUserCollection.findOne({ email }).exec();
    if (isEmailExist) {
      return res.status(409).send("A user with this email address already exists. Please login instead"); // Correct response handling
    }
    // Validate OTP
    const response = await otpCollection.find({ email }).sort({ createdAt: -1 }).limit(1);
    if (response.length === 0 || otp !== response[0].otp) {
      return res.status(400).json({ success: false, message: 'The OTP is not valid' }); // Correct response handling
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(passwordRaw, 10);
    // Create a new user
    const newUser = await individualUserCollection.create({
      username,
      email,
      password: hashedPassword,
      cardNo: 0 // Make sure this is intended
    });

    return res.status(201).json({ message: "User created", user: newUser });
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

    const isEmailExist = await IndividualUserSchema.findOne({ email: email }).exec();
    if(isEmailExist){
      // hash password
      const hashedPassword = await bcrypt.hash(passwordRaw, 10);
      console.log('hashedPassword',hashedPassword);

      const user = await IndividualUserSchema.updateOne(
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

module.exports.getOtpValidate = async (req, res ) => {
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
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Server error' });
  }
}

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