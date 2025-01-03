const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
require("dotenv").config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload an image to S3.
 * @param {Buffer} fileBuffer - The image file buffer.
 * @param {string} folderName - The folder name in the S3 bucket.
 * @param {string} fileName - The name of the file to save.
 * @returns {Object} The uploaded image's S3 URL.
 */
async function uploadImageToS3(fileBuffer, folderName, fileName) {
  const fileExtension = fileName.split(".").pop();
  const contentType = mime.lookup(fileExtension);
  const sanitizedFileName = fileName.replace(/\s+/g, '_');

  if (!contentType) {
    throw new Error("Unsupported file type");
  }

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folderName}/${sanitizedFileName}`, // Store in the specified folder
    Body: fileBuffer,
    ContentType: contentType,
    // ACL: "public-read",
  };

  try {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    console.log("Image uploaded successfully");
    return {
      Location: `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

/**
 * Delete an image from S3.
 * @param {string} imageKey - The key of the image to delete (e.g., "folder/filename.jpg").
 * @returns {void}
 */
async function deleteImageFromS3(imageKey) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    console.log("Image deleted successfully:", imageKey);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

module.exports = {
  uploadImageToS3,
  deleteImageFromS3,
};