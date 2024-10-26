const express = require('express')
const authEnterpriseRouter = express.Router()
const authMiddleware = require('../../Middleware/authMiddleware')

authEnterpriseRouter.post('/login',authMiddleware.authenticateToken, )

module.exports = authEnterpriseRouter