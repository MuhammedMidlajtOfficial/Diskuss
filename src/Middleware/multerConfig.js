const multer = require('multer');

// Configure Multer to store files in memory
const storage = multer.memoryStorage();

// Define file filter to restrict file types
const fileFilter = (req, file, cb) => {
  console.log('File MIME type:', file.mimetype);
  const allowedTypes = ['text/vcard', 'application/vcard','text/x-vcard'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    console.error(`Unsupported file type: ${file.mimetype}`); // Log unsupported types
    cb(new Error('Unsupported file type'), false); // Reject file
  }
};

// Initialize Multer with storage and file filter
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Set max file size to 10 MB
});

module.exports = upload;