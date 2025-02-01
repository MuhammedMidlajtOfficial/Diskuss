const { uploadImageToS3 } = require("../services/AWS/awsService");
const Url = require("../models/urlShort/urlShortModel");
const shortId = require("shortid"); 

// Handle vCard upload request
async function uploadVCard(req, res) {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    // The folder name in the S3 bucket
    const folderName = "vcards";
    const fileName = req.file.originalname;

    // Upload the file to S3
    const result = await uploadImageToS3(req.file.buffer, folderName, fileName);
    const originalUrl = result.Location; // S3 URL of the uploaded file

    // Generate a short code and ensure uniqueness in DB
    let shortCode;
    while (true) {
      shortCode = shortId.generate();
      const urlExists = await Url.findOne({ shortCode });
      if (!urlExists) break; // If unique, exit loop
    }

    // Construct short URL
    const shortUrl = `${process.env.SHORT_BASE_URL}/${shortCode}`;

    // Save the shortened URL to the database
    const newUrl = new Url({ originalUrl, shortCode, shortUrl });
    await newUrl.save();

    // Send back the shortened URL along with the original S3 URL
    return res.status(200).json({
      message: "File uploaded successfully",
      originalUrl,
      shortUrl,
    });
  } catch (error) {
    console.error("Error in vCard upload:", error);
    return res.status(500).send({ error: "Failed to upload vCard" });
  }
}

module.exports = {
  uploadVCard,
};
