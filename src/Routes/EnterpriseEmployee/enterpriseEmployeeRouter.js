const express = require('express')
const authEnterpriseController = require('../../Controller/Enterprise/authEnterpriseController')
const authEnterpriseRouter = express.Router()

authEnterpriseRouter.patch('/updateProfile',authEnterpriseController.updateProfile)

module.exports = authEnterpriseRouter