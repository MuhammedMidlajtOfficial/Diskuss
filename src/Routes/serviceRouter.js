// Service Router
const { Router } = require('express');
const controller = require('../Controller/ServiceController');


const router = Router();

router.get('/', controller.getServices);
router.post('/',controller.createService)
router.patch('/:service_id', controller.updateService);
router.delete('/:service_id',controller.deleteService)

module.exports = router;