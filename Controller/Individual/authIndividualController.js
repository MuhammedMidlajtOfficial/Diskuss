const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { individualUserCollection,otpCollection } = require('../../DBConfig');
// const { individualUserCollection } = require("../../models/individualUser");
const otpGenerator = require("otp-generator")

module.exports.getIndividualLogin = (req, res) => {
  try {
    const user = req.session.user
    if (user) {
      return res.status(200).json({ message: 'User is logged in', user });
    } else {
      return res.status(401).json({ message: 'User not logged in' });
    }
  } catch (error) {
    console.error('Error checking login status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
}

module.exports.postIndividualLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await individualUserCollection.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { id: user._id, email: user.email };
    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    req.session.user = user

    return res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
  } catch (error) {
    console.error('Error during login:', error);
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
  }
};


module.exports.postIndividualSignup = async (req, res ) => {
    const { username, email, otp } = req.body;
    const passwordRaw = req.body.password;
    try {
        if (!username || !email || !passwordRaw || !otp) {
            res.status(400, "All fields are Required")
        }

        const isUsernameExist = await individualUserCollection.findOne({ username: username }).exec()

        if (isUsernameExist) {
            res.status(409, "Username Already Taken. Please Choose different one or login instead");
        }

        const isEmailExist = await individualUserCollection.findOne({ email: email }).exec();

        if (isEmailExist) {
            res.status(409, "A user with this email address already exist. Please login instead");
        }

        const response = await otpCollection.find({ email }).sort({ createdAt: -1 }).limit(1);

        if (response.length === 0 || otp !== response[0].otp) {
            res.status(400, { success: false, message: 'The OTP is not valid' })
        }

        const hashedPassword = await bcrypt.hash(passwordRaw, 10);

        const newUser = await individualUserCollection.create({
            username,
            email,
            password: hashedPassword,
        })

        res.status(201).json({ message : "user created" })
    } catch (error) {
        console.log(error)
    }
}