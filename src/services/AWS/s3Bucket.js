const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require('dotenv').config();

// Configure S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload function for S3
async function uploadImageToS3(imageBuffer, fileName) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `profile-images/${fileName}`, // Store in a "profile-images" folder
    Body: imageBuffer,
    ContentEncoding: 'base64', // Required if using a base64 image
    ContentType: 'image/jpeg', // Adjust based on image type
    ACL: 'public-read', // Grant public read access to the uploaded image
  };

  try {
    const command = new PutObjectCommand(params);
    const response = await s3Client.send(command);
    console.log("Image uploaded successfully:", response);
    // Construct the public URL of the uploaded image
    return { Location: `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}` };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

module.exports.uploadImageToS3 = uploadImageToS3;