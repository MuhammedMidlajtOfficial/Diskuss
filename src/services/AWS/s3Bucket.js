const AWS = require('aws-sdk');
require('dotenv').config()
// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Upload function for S3
module.exports.uploadImageToS3 = async (imageBuffer, fileName) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `profile-images/${fileName}`, // Store in a "profile-images" folder
    Body: imageBuffer,
    ContentEncoding: 'base64', // Required if using a base64 image
    ContentType: 'image/jpeg', // Adjust based on image type
  };

  return s3.upload(params).promise();
};