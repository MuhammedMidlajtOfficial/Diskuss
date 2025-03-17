const express = require("express");
const { upload } = require("../../middleware/multerConfig"); // Import Multer middleware for file upload
const { uploadVCard } = require("../../Controller/VCard"); // Import the controller

const router = express.Router();

// Route to upload a vCard
router.post("/upload", upload.single("vcard"), uploadVCard);

module.exports = router;
