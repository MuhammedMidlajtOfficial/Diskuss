// Auth Individual Router
const express = require('express')
const authIndividualController = require('../../Controller/Individual/authIndividualController')
const authIndividualRouter = express.Router()

authIndividualRouter.post('/login',authIndividualController.postIndividualLogin)
authIndividualRouter.post('/loginwithphnnumber',authIndividualController.postIndividualLoginUsingPhnNumber)
authIndividualRouter.post('/loginotp',authIndividualController.sendOTPForPhnNumber)

authIndividualRouter.post('/signup',authIndividualController.postIndividualSignup)
authIndividualRouter.post('/sendotp',authIndividualController.sendOTP)

authIndividualRouter.post('/sendForgotPasswordOtp',authIndividualController.sendForgotPasswordOTP)
authIndividualRouter.post('/validateotp',authIndividualController.OtpValidate)
authIndividualRouter.post('/forgotpassword',authIndividualController.postforgotPassword)
authIndividualRouter.post('/resetpassword',authIndividualController.resetPassword)
authIndividualRouter.get('/getProfile/:id',authIndividualController.getProfile)
authIndividualRouter.patch('/updateProfile',authIndividualController.updateProfile)

module.exports = authIndividualRouter