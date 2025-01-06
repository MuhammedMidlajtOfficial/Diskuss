const { individualUserCollection } = require("../../DBConfig");
const Card = require("../../models/card");
const { ObjectId } = require("mongodb");
const Contact = require("../../models/contact.individual.model");
const enterpriseUser = require("../../models/enterpriseUser");
const enterpriseEmployee = require("../../models/enterpriseEmploye.model");
const EnterpriseEmployeeCard = require("../../models/enterpriseEmployeCard.model");
const {
  uploadImageToS3,
  deleteImageFromS3,
} = require("../../services/AWS/s3Bucket");
const enterpriseEmployeModel = require("../../models/enterpriseEmploye.model");
const cardService = require('../../services/Card/card.service');
const { mongoose } = require("mongoose");

module.exports.getCards = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    // Fetch cards
    const card = await cardService.getCard(userId);

    // Return cards
    return res.status(200).json(card);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ message: "Failed to get cards", error });
  }
};

module.exports.createCard = async (req, res) => {
  try {
    console.log(req.body);

    const cardData = req.body;

    const result = await cardService.createCard(cardData);

    res
      .status(201)
      .json({ message: "Card added successfully", entryId: result._id });
  } catch (error) {
    console.error("Error creating card:", error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports.updateCard = async (req, res) => {
  try {
    console.log("Update card request body:", req.body);

    const updateData = req.body;

    const result = await cardService.updateCard(updateData);

    res.status(200).json({ message: "Card updated successfully" });
  } catch (error) {
    console.error("Error updating card:", error.message);
    res.status(500).json({
      message: error.message || "Failed to update card. Please try again later.",
    });
  }
};

module.exports.deleteCard = async (req, res) => {
  const { cardId } = req.body;

  try {
    const result = await cardService.deleteCard(cardId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting card:", error.message);
    res.status(500).json({
      message: error.message || "Failed to delete card. Please try again later.",
    });
  }
};

module.exports.disableCard = async (req, res) => {
  const { cardId } = req.body;

  try {
    const result = await cardService.disableCard(cardId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting card:", error.message);
    res.status(500).json({
      message: error.message || "Failed to delete card. Please try again later.",
    });
  }
};


async function isValidUserId(userId) {
  try {
    const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!objectId) return false; // If userId is not a valid ObjectId, return false

    const user = await individualUserCollection.findOne({ _id: objectId });
    return user !== null;
  } catch (error) {
    console.error("Error checking user ID:", error);
    return false;
  }
}
