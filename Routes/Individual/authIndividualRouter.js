const express = require('express')
const authIndividualController = require('../../Controller/Individual/authIndividualController')
const authMiddleware = require('../../Middleware/authMiddleware')
const authIndividualRouter = express.Router()

authIndividualRouter.get('/login',authMiddleware.authenticateToken, authIndividualController.getIndividualLogin)

authIndividualRouter.post('/sendotp',authIndividualController.sendOTP)
authIndividualRouter.post('/forgotpassword',authIndividualController.postforgotPassword)
authIndividualRouter.post('/login',authIndividualController.postIndividualLogin)
authIndividualRouter.post('/signup',authIndividualController.postIndividualSignup)

module.exports = authIndividualRouter