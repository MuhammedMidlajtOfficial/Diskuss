const express = require("express");
const cardController = require("../../Controller/Card/cardController");

const router = express.Router();

router.get("/:id", cardController.getCards);
router.post("/", cardController.createCard);
router.patch("/", cardController.updateCard);
router.delete("/", cardController.deleteCard);
// router.patch("/changeStatus", cardController.changeStatus);

module.exports = router;
