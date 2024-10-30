const { individualUserCollection } = require("../../DBConfig");
const Card = require("../../models/card");
const { ObjectId } = require('mongodb');

module.exports.getCards = async (req, res) => {
  try {
    const userId = req.params.id
    
    if(!await(isValidUserId(userId))){
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const card = await Card.find({ userId })
    if (!card[0]) {
      return res.status(404).json({ message: 'Card not found' });
    }
    console.log(card);
    return res.status(200).json(card);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get cards", error });
  }
};

module.exports.createCard = async (req, res) => {
  console.log(req.body);
  const {
    userId,
    businessName,
    yourName,
    designation,
    mobile,
    email,
    location,
    services,
    image,
    position,
    cardType,
    color,
    website
  } = req.body;

  if(!isValidUserId(userId)){
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const newCard = new Card({
    userId,
    businessName,
    yourName,
    designation,
    mobile,
    email,
    location,
    services,
    image,
    position,
    cardType,
    color,
    website
  });

  try {
    const result = await newCard.save();
    if(result){
      await individualUserCollection.updateOne({ _id: userId }, { $inc: { cardNo: 1 } });
    }
    res.status(201).json({ message: "Card added successfully", entryId: result._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add card", error });
  }
};

module.exports.updateCard = async (req, res) => {
  try {
    const {
      userId,
      cardId,
      businessName,
      yourName,
      designation,
      mobile,
      email,
      location,
      services,
      image,
      position,
      color,
      cardType,
      website
    } = req.body;

    if (!isValidUserId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const result = await Card.updateOne(
      { _id: cardId },
      { $set: { 
        businessName, 
        yourName, 
        designation, 
        mobile, 
        email, 
        location, 
        services, 
        image, 
        position, 
        color, 
        cardType,
        website
      } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Card not found or no changes detected' });
    }

    res.status(200).json({ message: 'Card updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update card', error });
  }
};

module.exports.deleteCard = async (req, res) => {
  const { userId, cardId } = req.body;

  if (!isValidUserId(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const result = await Card.deleteOne({ userId, _id: cardId });
    console.log(result);
    if (result.deletedCount > 0) {
      await individualUserCollection.updateOne(
        { _id: userId },
        { $inc: { cardNo: -1 } }
      );
      return res.status(200).json({ message: "Card deleted successfully" });
    } else {
      return res.status(404).json({ message: "Card not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete card", error });
  }
};


async function isValidUserId(userId) {
  try {
      const objectId = typeof userId === 'string' && ObjectId.isValid(userId) ? new ObjectId(userId) : userId;
      const user = await individualUserCollection.findOne({ _id: objectId });
      return user !== null;
  } catch (error) {
      console.error('Error checking user ID:', error);
      return false;
  }
}
