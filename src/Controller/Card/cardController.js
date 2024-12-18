const { individualUserCollection } = require("../../DBConfig");
const Card = require("../../models/card");
const { ObjectId } = require('mongodb');
const enterpriseUser = require("../../models/enterpriseUser");
const EnterpriseEmployeeCard = require("../../models/enterpriseEmployeCard.model");
const { uploadImageToS3, deleteImageFromS3 } = require("../../services/AWS/s3Bucket");
const enterpriseEmployeCardModel = require("../../models/enterpriseEmployeCard.model");

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
    businessType,
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
    const fileName = `${userId}-${Date.now()}-businessCard.jpg`; // Unique file name based on user ID and card purpose
    try {
      const uploadResult = await uploadImageToS3(imageBuffer, fileName);
      imageUrl = uploadResult.Location; // S3 URL of the uploaded image
    } catch (uploadError) {
      console.log("Error uploading image to S3:", uploadError);
      return res.status(500).json({ message: "Failed to upload image", error: uploadError });
    }
  }

  console.log("imageUrl of new card logo - ",imageUrl);

  const newCard = new Card({
    userId,
    businessName,
    businessType,
    yourName,
    designation,
    mobile,
    email,
    location,
    services,
    image:imageUrl, // Use S3 image URL
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
      businessType,
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

    // // Check if the user exists
    // const isUserExist = await individualUserCollection.findOne({ _id: userId });
    // if (!isUserExist) {
    //   return res.status(400).json({ message: 'Invalid user ID' });
    // }

    // Check if the card exists in Card collection
    let existingCard = await Card.findOne({ _id: cardId });
    let cardCollection = Card;

    // If card is not found in Card collection, check EnterpriseEmployeeCard collection
    if (!existingCard) {
      existingCard = await EnterpriseEmployeeCard.findOne({ _id: cardId });
      cardCollection = EnterpriseEmployeeCard; // Change the collection to EnterpriseEmployeeCard
    }
    console.log('Update individual card- image',image);
    if (!existingCard) {
      return res.status(404).json({ message: 'Card not found' });
    }

    let imageUrl = existingCard.image; // Default to existing image if no new image is provided

    // Upload image to S3 if a new image is provided
    if (image) {
      // Delete the old image from S3 (if exists)
      if (existingCard?.image) {
        await deleteImageFromS3(existingCard.image); // Delete the old image from S3
      }
      const imageBuffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64');
      const fileName = `${userId}-${Date.now()}-businessCard.jpg`; // Unique file name based on user ID and card ID
      try {
        const uploadResult = await uploadImageToS3(imageBuffer, fileName);
        imageUrl = uploadResult.Location; // URL of the uploaded image
      } catch (uploadError) {
        console.log("Error uploading image to S3:", uploadError);
        return res.status(500).json({ message: "Failed to upload image", error: uploadError });
      }
    }

    // Update the card in the respective collection
    const result = await cardCollection.updateOne(
      { _id: cardId },
      { 
        $set: { 
          businessName, 
          businessType,
          yourName, 
          designation, 
          mobile, 
          email, 
          location, 
          services, 
          image: imageUrl, // Use the S3 URL for the image
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
    res.status(500).json({ message: 'Failed to update card . Please try again later.', error });
  }
};

module.exports.deleteCard = async (req, res) => {
  const { userId, cardId } = req.body;

  // Check if the user exists in any of the collections
  const isIndividualUser = await individualUserCollection.findOne({ _id: userId });
  const isEnterpriseUser = await enterpriseUserCollection.findOne({ _id: userId });
  const isEnterpriseEmployee = await enterpriseEmployeeCollection.findOne({ _id: userId });

  // If the user doesn't exist in any collection, return error
  if (!isIndividualUser && !isEnterpriseUser && !isEnterpriseEmployee) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    // Handle enterprise employee card and employee deletion
    if (isEnterpriseEmployee) {
      // Find and delete the employee's card from enterpriseEmployeeCardModel
      const getCard = await enterpriseEmployeCardModel.findOne({ userId });
      if (getCard) {
        await enterpriseEmployeCardModel.deleteOne({ userId });
      }

      // Check if the employee's phnNumber is used in any contact
      const existingContact = await Contact.findOne({ phnNumber: isEnterpriseEmployee.phnNumber });
      if (existingContact) {
        // Update the contact details if phnNumber is used by the employee
        const contactUpdate = await Contact.updateOne(
          { phnNumber: isEnterpriseEmployee.phnNumber },
          { $set: { isDiskussUser: false, userId: null } } // Removing the userId and marking as not a Diskuss user
        );

        if (contactUpdate.modifiedCount > 0) {
          console.log("Contact updated successfully.");
        } else {
          console.log("Contact not updated.");
        }
      }

      // Remove the employee from the enterprise
      const enterpriseId = isEnterpriseEmployee.enterpriseId; // Assuming this field exists
      await enterpriseUser.updateOne(
        { _id: enterpriseId },
        { $pull: { empId: userId, empCards: getCard?._id } }
      );

      // Optionally, delete the employee from the enterpriseEmployeeCollection
      await enterpriseEmployeeCollection.deleteOne({ _id: userId });

      return res.status(200).json({ message: "Employee and card deleted successfully" });
    }

    // Delete the card from the Card collection
    const result = await Card.deleteOne({ userId, _id: cardId });
    console.log(result);

    if (result.deletedCount > 0) {
      // Handle individual user card deletion logic
      if (isIndividualUser) {
        await individualUserCollection.updateOne(
          { _id: userId },
          { $inc: { cardNo: -1 } }
        );
      } 
      
      // Handle enterprise user card deletion logic
      else if (isEnterpriseUser) {
        await enterpriseUserCollection.updateOne(
          { _id: userId },
          { $inc: { cardNo: -1 } }
        );
      } 

      return res.status(200).json({ message: "Card deleted successfully" });
    } else {
      // If no card is found to delete
      return res.status(404).json({ message: "Card not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to delete card", error });
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

