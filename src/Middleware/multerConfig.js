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

const adminFileFilter = (req, file, cb) => {
  if (file.fieldname === 'image' && file.mimetype.startsWith('image/')) {
    cb(null, true); // Accept image files
  } else if (file.fieldname === 'video' && file.mimetype.startsWith('video/')) {
    cb(null, true); // Accept video files
  } else {
    cb(new Error('Invalid file type!'), false); // Reject other files
  }
};

const uploadChannelFile = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Limit to 2MB per file
  fileFilter: adminFileFilter
})

// Combine both fields into one middleware
const uploadChannelFields = uploadChannelFile.fields([
  { name: 'video', maxCount: 1 }, // Field for video
  { name: 'image', maxCount: 1 }, // Field for image
]);

const uploadChannelImage = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit to 2MB per file
  fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
          cb(null, true); // Accept only image files
      } else {
          cb(new Error('Only image files are allowed!'), false); // Reject other files
      }
  },
})

const uploadChannelVideo = multer({
  storage: storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // Limit to 2MB per file
  fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('video/')) {
          cb(null, true); // Accept only image files
      } else {
          cb(new Error('Only video files are allowed!'), false); // Reject other files
      }
  },
})

module.exports = {
  upload,
  uploadChannelFields,
  uploadChannelImage,
  uploadChannelVideo
};