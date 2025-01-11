const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
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
module.exports.uploadImageToS3 = async (imageBuffer, fileName) => {
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
};

// Delete function for S3
module.exports.deleteImageFromS3 = async (imageUrl) => {
  const fileName = imageUrl.split('/').pop(); // Extract file name from URL
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `profile-images/${fileName}`, // Assuming images are stored in "profile-images" folder
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    console.log(`Old image deleted successfully: ${fileName}`);
  } catch (error) {
    console.error(`Error deleting image from S3: ${error}`);
    throw error;
  }
};


module.exports.uploadImageToS3ForContact = async (imageBuffer, fileName) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `contact-images/${fileName}`, // Store in a "contact-images" folder
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
};

// Delete function for S3
module.exports.deleteImageFromS3ForContact = async (imageUrl) => {
  const fileName = imageUrl.split('/').pop(); // Extract file name from URL
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `contact-images/${fileName}`, // Assuming images are stored in "contact-images" folder
  };

  try {
    const command = new DeleteObjectCommand(params);
    await s3Client.send(command);
    console.log(`Old image deleted successfully: ${fileName}`);
  } catch (error) {
    console.error(`Error deleting image from S3: ${error}`);
    throw error;
  }
};
