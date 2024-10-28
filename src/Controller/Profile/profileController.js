const Profile = require("../../models/profile");

const getProfiles = async (req, res) => {
  try {
    const userId = req.params.id
    if(!isValidUserId(userId)){
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const profile = await Profile.findOne({ userId })
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
    res.json({ message: "Profile added successfully", entryId: result._id });
  } catch (error) {
    res.status(500).json({ message: "Failed to add profile", error });
  }
};

async function isValidUserId (userId) {
  return await Profile.findOne({ userId })
}

module.exports = { getProfiles, createProfile };