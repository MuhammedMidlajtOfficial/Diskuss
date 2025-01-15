// Card Enterprise Routes
const express = require("express");
const cardController = require("../../Controller/Card/cardEnterpriseController");

const router = express.Router();

router.get("/:id", cardController.getCards);
router.post("/", cardController.createCard);
router.patch("/", cardController.updateCard);
router.delete("/", cardController.deleteCard);

module.exports = router;
