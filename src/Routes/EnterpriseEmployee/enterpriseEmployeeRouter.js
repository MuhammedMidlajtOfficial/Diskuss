// Enterprise Employee Router
const express = require('express')
const enterpriseEmployeeController = require('../../Controller/EnterpriseEmployee/enterpriseEmployeeController')
const enterpriseEmployeeRouter = express.Router()

enterpriseEmployeeRouter.get('/getCardForUser/:id', enterpriseEmployeeController.getCardForUser)
enterpriseEmployeeRouter.get('/getContactOfEmployee/:id', enterpriseEmployeeController.getContactOfEmployee)
enterpriseEmployeeRouter.get('/getProfile/:id', enterpriseEmployeeController.getProfile)
enterpriseEmployeeRouter.post('/createProfile', enterpriseEmployeeController.createCard)
enterpriseEmployeeRouter.post('/resetpassword',enterpriseEmployeeController.resetPassword)
enterpriseEmployeeRouter.delete('/removeEmployee', enterpriseEmployeeController.removeEmployee);

enterpriseEmployeeRouter.patch('/updateProfile', enterpriseEmployeeController.updateProfile)

module.exports = enterpriseEmployeeRouter