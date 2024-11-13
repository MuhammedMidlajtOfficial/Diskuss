const { Router } = require('express');
const controller = require('../../Controller/Individual/contactIndividualController')


const router = Router();

router.get('/', controller.getAllContacts);
router.post('/',controller.createContact)
router.patch('/:contact_id', controller.updateContact);
router.delete('/:contact_id',controller.deleteContact)
router.get('/user/:user_id',controller.getContactsByOwnerUserId)
router.get('/search', controller.getSearchedContact);

module.exports = router;