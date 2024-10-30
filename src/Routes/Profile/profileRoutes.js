const express = require("express");
const { getProfiles, createProfile, deleteProfile, updateProfile, } = require("../../Controller/Profile/profileController");

const router = express.Router();

router.get("/:id", getProfiles);
router.post("/", createProfile);
router.patch("/", updateProfile);
router.delete("/", deleteProfile);

module.exports = router;
