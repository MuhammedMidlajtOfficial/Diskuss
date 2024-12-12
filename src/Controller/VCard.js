const { uploadImageToS3 } = require("../services/AWS/awsService"); // Import the upload function

// Handle vCard upload request
async function uploadVCard(req, res) {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No file uploaded" });
    }

    // The folder name in the S3 bucket
    const folderName = 'vcards'; // Change this as per your requirements
    const fileName = req.file.originalname;

    // Upload the file to S3
    const result = await uploadImageToS3(req.file.buffer, folderName, fileName);

    // Send the S3 URL in the response
    return res.status(200).json({ message: "File uploaded successfully", url: result.Location });
  } catch (error) {
    console.error("Error in vCard upload:", error);
    return res.status(500).send({ error: "Failed to upload vCard" });
  }
}

module.exports = {
  uploadVCard,
};
