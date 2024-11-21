const express = require('express')
const authEnterpriseController = require('../../Controller/Enterprise/authEnterpriseController')
const authEnterpriseRouter = express.Router()


authEnterpriseRouter.post('/sendotp', authEnterpriseController.sendOTP)
authEnterpriseRouter.post('/sendForgotPasswordOtp', authEnterpriseController.sendForgotPasswordOTP)
authEnterpriseRouter.post('/validateotp',authEnterpriseController.OtpValidate)
authEnterpriseRouter.post('/login', authEnterpriseController.postEnterpriseLogin)
authEnterpriseRouter.post('/signup', authEnterpriseController.postEnterpriseSignup)
authEnterpriseRouter.post('/forgotpassword',authEnterpriseController.postforgotPassword)
authEnterpriseRouter.get('/getProfile/:id',authEnterpriseController.getProfile)
authEnterpriseRouter.patch('/updateProfile',authEnterpriseController.updateProfile)
authEnterpriseRouter.post('/resetpassword',authEnterpriseController.resetPassword)




module.exports = authEnterpriseRouter