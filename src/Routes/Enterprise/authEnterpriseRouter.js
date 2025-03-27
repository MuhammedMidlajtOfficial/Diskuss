// Auth Entreprise Router
const express = require('express')
const authEnterpriseController = require('../../Controller/Enterprise/authEnterpriseController')
const authEnterpriseRouter = express.Router()


authEnterpriseRouter.post('/sendotp', authEnterpriseController.sendOTP)
authEnterpriseRouter.post('/sendForgotPasswordOtp', authEnterpriseController.sendForgotPasswordOTP)
authEnterpriseRouter.post('/validateotp',authEnterpriseController.OtpValidate)

authEnterpriseRouter.post('/login', authEnterpriseController.postEnterpriseLogin)
authEnterpriseRouter.post('/loginwithphnnumber',authEnterpriseController.postIndividualLoginUsingPhnNumber)
authEnterpriseRouter.post('/loginotp',authEnterpriseController.sendOTPForPhnNumber)

authEnterpriseRouter.post('/signup', authEnterpriseController.postEnterpriseSignup)
authEnterpriseRouter.post('/forgotpassword',authEnterpriseController.postforgotPassword)
authEnterpriseRouter.get('/getProfile/:id',authEnterpriseController.getProfile)
authEnterpriseRouter.patch('/updateProfile',authEnterpriseController.updateProfile)
authEnterpriseRouter.post('/resetpassword',authEnterpriseController.resetPassword)

authEnterpriseRouter.delete('/:userId', authEnterpriseController.deleteUserByUserId);

module.exports = authEnterpriseRouter