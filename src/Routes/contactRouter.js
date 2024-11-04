const { Router } = require('express');
const controller = require('../Controller/contactController')


const router = Router();

router.get('/', controller.getAllContacts);
router.post('/',controller.createContact)
router.patch('/:Contact_id', controller.updateContact);
router.delete('/:Contact_id',controller.deleteContact)
router.get('/user/:user_id',controller.getContactsByUserId)

module.exports = router;