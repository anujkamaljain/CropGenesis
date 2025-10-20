const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  // Check file type
  const allowedTypes = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'video/mp4': '.mp4',
    'video/avi': '.avi',
    'video/mov': '.mov'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only ${Object.keys(allowedTypes).join(', ')} are allowed.`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only one file at a time
  }
});

// Middleware for single file upload
const uploadSingle = upload.single('file');

// Middleware wrapper to handle multer errors
const handleUpload = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Validate uploaded file
const validateFile = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const file = req.file;
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'video/mp4',
    'video/avi',
    'video/mov'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    // Delete the uploaded file
    fs.unlinkSync(file.path);
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only images (JPEG, PNG) and videos (MP4, AVI, MOV) are allowed.'
    });
  }

  // Determine file type
  req.fileType = file.mimetype.startsWith('image/') ? 'image' : 'video';
  
  next();
};

// Clean up uploaded file
const cleanupFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up file: ${filePath}`);
    }
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
};

// Get file info
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    type: file.mimetype.startsWith('image/') ? 'image' : 'video'
  };
};

// Middleware for crop plan file uploads (1 image + 1 video max)
const uploadCropPlanFiles = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 2 // Maximum 2 files (1 image + 1 video)
  }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);

// Middleware wrapper for crop plan file uploads
const handleCropPlanUpload = (req, res, next) => {
  uploadCropPlanFiles(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB per file.'
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Maximum 1 image and 1 video allowed.'
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field. Only "image" and "video" fields are allowed.'
        });
      }
      return res.status(400).json({
        success: false,
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    next();
  });
};

// Validate crop plan uploaded files
const validateCropPlanFiles = (req, res, next) => {
  const files = req.files;
  
  // Check if image is provided and valid
  if (files.image && files.image[0]) {
    const imageFile = files.image[0];
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (!allowedImageTypes.includes(imageFile.mimetype)) {
      // Clean up uploaded files
      if (files.video && files.video[0]) {
        cleanupFile(files.video[0].path);
      }
      cleanupFile(imageFile.path);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid image type. Only JPEG and PNG images are allowed.'
      });
    }
  }
  
  // Check if video is provided and valid
  if (files.video && files.video[0]) {
    const videoFile = files.video[0];
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov'];
    
    if (!allowedVideoTypes.includes(videoFile.mimetype)) {
      // Clean up uploaded files
      if (files.image && files.image[0]) {
        cleanupFile(files.image[0].path);
      }
      cleanupFile(videoFile.path);
      
      return res.status(400).json({
        success: false,
        message: 'Invalid video type. Only MP4, AVI, and MOV videos are allowed.'
      });
    }
  }
  
  next();
};

// Get crop plan file info
const getCropPlanFileInfo = (files) => {
  const fileInfo = {
    image: null,
    video: null
  };
  
  if (files.image && files.image[0]) {
    fileInfo.image = getFileInfo(files.image[0]);
  }
  
  if (files.video && files.video[0]) {
    fileInfo.video = getFileInfo(files.video[0]);
  }
  
  return fileInfo;
};

module.exports = {
  handleUpload,
  validateFile,
  cleanupFile,
  getFileInfo,
  handleCropPlanUpload,
  validateCropPlanFiles,
  getCropPlanFileInfo
};
