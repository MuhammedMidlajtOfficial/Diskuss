// Card Routes
const express = require("express");
const cardController = require("../../Controller/Card/cardController");

const router = express.Router();

router.get("/:id", cardController.getCards);
router.get("/cardId/:id", cardController.getCardsUsingCardId);
router.post("/", cardController.createCard);
router.patch("/", cardController.updateCard);
router.delete("/", cardController.deleteCard);
router.patch("/changeStatus", cardController.changeStatus);
router.patch("/updateLogo", cardController.updateLogo);
router.get("/pn/:phnNumber", cardController.getCardsByNum);

module.exports = router;
