const { individualUserCollection } = require("../../DBConfig");
const Profile = require("../../models/profile/profile");
const { ObjectId } = require('mongodb');


const getProfiles = async (req, res) => {
  try {
    const userId = req.params.id
    if(!await(isValidUserId(userId))){
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const profile = await Profile.find({ userId })
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    return res.status(200).json(profile);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get profiles", error });
  }
};

const createProfile = async (req, res) => {
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
    color,
  } = req.body;
  console.log(createProfile);
  

  if(!isValidUserId(userId)){
    return res.status(400).json({ message: 'Invalid user ID' });
  }


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
    color,
  });

  try {
    const result = await newProfile.save();
    if(result){
      const userData = await individualUserCollection.findOne({ _id : userId })
      let updateCardNo = userData.cardNo + 1
      console.log('userData',userData);
      console.log('updateCardNo',updateCardNo);
      await individualUserCollection.updateOne({ _id : userId },{ $set :{ cardNo: updateCardNo }})
    }
    res.json({ message: "Profile added successfully", entryId: result._id });
  } catch (error) {
    res.status(500).json({ message: "Failed to add profile", error });
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

module.exports = { getProfiles, createProfile };