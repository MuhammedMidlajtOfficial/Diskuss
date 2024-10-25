const Profile = require("../../models/profile");

const getProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find();
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: "Failed to get profiles", error });
  }
};

const createProfile = async (req, res) => {
  const {
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

  const newProfile = new Profile({
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

module.exports = { getProfiles, createProfile };