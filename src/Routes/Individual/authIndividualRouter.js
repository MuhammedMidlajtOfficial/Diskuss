const express = require('express')
const authIndividualController = require('../../Controller/Individual/authIndividualController')
const authIndividualRouter = express.Router()

authIndividualRouter.post('/sendotp',authIndividualController.sendOTP)
authIndividualRouter.post('/validateotp',authIndividualController.getOtpValidate)
authIndividualRouter.post('/forgotpassword',authIndividualController.postforgotPassword)
authIndividualRouter.post('/login',authIndividualController.postIndividualLogin)
authIndividualRouter.post('/signup',authIndividualController.postIndividualSignup)

module.exports = authIndividualRouter