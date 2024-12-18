const express = require("express");
const cardController = require("../../Controller/Card/cardController");
const enterpriseEmployeeController = require('../../Controller/EnterpriseEmployee/enterpriseEmployeeController')

const router = express.Router();

router.get('/:id', enterpriseEmployeeController.getCardForUser)
router.get("/:id", cardController.getCards);
router.post("/", cardController.createCard);
router.patch("/", cardController.updateCard);
router.delete("/", cardController.deleteCard);

module.exports = router;
