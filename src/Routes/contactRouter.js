const { Router } = require('express');
const controller = require('../Controller/contactController')


const router = Router();

router.get('/', controller.getAllContacts);
router.post('/',controller.createContact)
router.patch('/:contact_id', controller.updateContact);
router.delete('/:contact_id',controller.deleteContact)
router.get('/user/:user_id',controller.getContactsByOwnerUserId)

module.exports = router;