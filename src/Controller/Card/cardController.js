const { individualUserCollection } = require("../../DBConfig");
const Card = require("../../models/card");
const { ObjectId } = require('mongodb');
const enterpriseUser = require("../../models/enterpriseUser");
const { uploadImageToS3 } = require("../../services/AWS/s3Bucket");

module.exports.getCards = async (req, res) => {
  try {
    const userId = req.params.id
    
    const isIndividualUserExist = await individualUserCollection.findOne({ _id:userId }).lean()
    const isEnterpriseUserExist = await enterpriseUser.findOne({ _id:userId }).populate('empCards').lean()
    if(!isIndividualUserExist && ! isEnterpriseUserExist){
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    let card = []
    if(isEnterpriseUserExist){
      const cardOfEnterprise = await Card.find({ userId })
      card = [ ...cardOfEnterprise, ...isEnterpriseUserExist.empCards ]
    }else{
      card = await Card.find({ userId })
    }
    // if (!card[0]) {
    //   return res.status(200).json({ message: 'Card not found' });
    // }
    // console.log(card);
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
    website,
    theme,
    topServices
  } = req.body;

  const isUserExist = individualUserCollection.findOne({ _id:userId })
  if(!isUserExist){
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  let imageUrl = image; // Default to provided image URL if no new image upload is needed

  // Upload image to S3 if a new image is provided
  if (image) {
    const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
    const fileName = `${userId}-businessCard.jpg`; // Unique file name based on user ID and card purpose
    try {
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // S3 URL of the uploaded image
    } catch (uploadError) {
      console.log("Error uploading image to S3:", uploadError);
      return res.status(500).json({ message: "Failed to upload image", error: uploadError });
    }
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
    image, // Use S3 image URL
    position,
    cardType,
    color,
    website,
    theme,
    topServices
  });

  try {
    const result = await newCard.save();
    if (result) {
      await individualUserCollection.updateOne(
        { _id: userId },
        { $inc: { cardNo: 1 } }  // Increment cardNo by 1
      );
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
      website,
      theme,
      topServices
    } = req.body;

    const isUserExist = individualUserCollection.findOne({ _id:userId })
    if(!isUserExist){
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Find existing card to retrieve the current image URL if no new image is provided
    const existingCard = await Card.findById(cardId);
    if (!existingCard) {
      return res.status(404).json({ message: 'Card not found' });
    }

    let imageUrl = existingCard.image; // Default to existing image if no new image is provided

    // Upload image to S3 if a new image is provided
    if (image) {
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${userId}-businessCard-${cardId}.jpg`; // Unique file name based on user ID and card ID
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location; // URL of the uploaded image
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", error: uploadError });
      }
    }

    // Update card with new data, including the S3 image URL if it was updated
    const result = await Card.updateOne(
      { _id: cardId },
      { 
        $set: { 
          businessName, 
          yourName, 
          designation, 
          mobile, 
          email, 
          location, 
          services, 
          image, // Use the S3 URL for the image
          position, 
          color, 
          cardType,
          website,
          theme,
          topServices
        } 
      }
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

  const isUserExist = individualUserCollection.findOne({ _id:userId })
  if(!isUserExist){
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
      const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
      if (!objectId) return false; // If userId is not a valid ObjectId, return false

      const user = await individualUserCollection.findOne({ _id: objectId });
      return user !== null;
  } catch (error) {
      console.error('Error checking user ID:', error);
      return false;
  }
}

