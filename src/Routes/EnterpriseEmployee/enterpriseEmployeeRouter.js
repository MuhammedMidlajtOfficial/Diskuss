const express = require('express')
const enterpriseEmployeeController = require('../../Controller/EnterpriseEmployee/enterpriseEmployeeController')
const enterpriseEmployeeRouter = express.Router()

enterpriseEmployeeRouter.get('/getCardForUser/:id', enterpriseEmployeeController.getCardForUser)
enterpriseEmployeeRouter.get('/getCardForEnterprise/:id', enterpriseEmployeeController.getCardForEnterprise)
enterpriseEmployeeRouter.get('/getUserOfEnterprise/:id', enterpriseEmployeeController.getUserOfEnterprise)
enterpriseEmployeeRouter.get('/getContactOfEmployee/:id', enterpriseEmployeeController.getContactOfEmployee)
enterpriseEmployeeRouter.post('/createProfile', enterpriseEmployeeController.createCard)

module.exports = enterpriseEmployeeRouter