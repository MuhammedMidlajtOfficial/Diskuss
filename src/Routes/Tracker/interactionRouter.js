const express = require('express');
const router = express.Router();
const interactionController = require('../../Controller/Tracker/interactionController');

router.post('/', interactionController.createInteraction);
router.get('/', interactionController.getAllInteractions);
router.get('/:id', interactionController.getInteractionById);
router.get('/interactionId/:interactionId', interactionController.getInteractionByInteractionId);
router.get('/user/:userId', interactionController.getInteractions);
router.put('/:interactionId', interactionController.updateInteraction);
router.delete('/:interactionId', interactionController.deleteInteraction);

module.exports = router;