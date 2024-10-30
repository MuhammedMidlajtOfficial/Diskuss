const { individualUserCollection } = require("../../DBConfig");
const Profile = require("../../models/profile");
const { ObjectId } = require('mongodb');

module.exports.getProfiles = async (req, res) => {
  try {
    const userId = req.params.id
    
    if(!await(isValidUserId(userId))){
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const profile = await Profile.find({ userId })
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    console.log(profile);
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get profiles", error });
  }
};

module.exports.createProfile = async (req, res) => {
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
  } = req.body;

  if(!isValidUserId(userId)){
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const newProfile = new Profile({
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
  });

  try {
    const result = await newProfile.save();
    if(result){
      await individualUserCollection.updateOne({ _id: userId }, { $inc: { cardNo: 1 } });
    }
    res.status(201).json({ message: "Profile added successfully", entryId: result._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add profile", error });
  }
};

module.exports.updateProfile = async (req, res) => {
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
      cardType
    } = req.body;

    if (!isValidUserId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const result = await Profile.updateOne(
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
        cardType 
      } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Profile not found or no changes detected' });
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update profile', error });
  }
};

module.exports.deleteProfile = async (req, res) => {
  const { userId, cardId } = req.body;

  if (!isValidUserId(userId)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  try {
    const result = await Profile.deleteOne({ userId, _id: cardId });
    console.log(result);
    if (result.deletedCount > 0) {
      await individualUserCollection.updateOne(
        { _id: userId },
        { $inc: { cardNo: -1 } }
      );
      return res.status(200).json({ message: "Profile deleted successfully" });
    } else {
      return res.status(404).json({ message: "Profile not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete profile", error });
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
