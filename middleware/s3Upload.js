const multer = require('multer');
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Multer S3 storage configuration
const upload = multer({
  storage: multerS3({
    s3: s3,
    contentType: multerS3.AUTO_CONTENT_TYPE,

    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read', // Set permissions for public access
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      // Save files with unique names using timestamps
      cb(null, `resumes/${Date.now().toString()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Allow PDF files and image files (JPG, PNG, JPEG)
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed!'), false);
    }
  }
});

module.exports = upload;
