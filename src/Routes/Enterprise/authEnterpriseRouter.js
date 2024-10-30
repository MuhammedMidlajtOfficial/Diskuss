const express = require('express')
const authEnterpriseController = require('../../Controller/Enterprise/authEnterpriseController')
const authEnterpriseRouter = express.Router()


authEnterpriseRouter.post('/sendotp', authEnterpriseController.sendOTP)
authEnterpriseRouter.post('/validateotp',authEnterpriseController.OtpValidate)
authEnterpriseRouter.post('/login', authEnterpriseController.postEnterpriseLogin)
authEnterpriseRouter.post('/signup', authEnterpriseController.postEnterpriseSignup)
authEnterpriseRouter.post('/forgotpassword',authEnterpriseController.postforgotPassword)


module.exports = authEnterpriseRouter