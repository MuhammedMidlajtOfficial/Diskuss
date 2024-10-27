const express = require("express");
const { getProfiles, createProfile } = require("../../Controller/Profile/profileController");

const router = express.Router();

router.get("/", getProfiles);
router.post("/", createProfile);

module.exports = router;
