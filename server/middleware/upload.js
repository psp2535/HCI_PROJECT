import multer from 'multer';
import path from 'path';

// Configure multer for memory storage (we'll process the buffer directly)
const storage = multer.memoryStorage();

// File filter - only accept PDFs
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Middleware for single PDF upload
export const uploadPDF = upload.single('receiptFile');

// Middleware for subject PDF upload
export const uploadSubjectPDF = upload.single('subjectPDF');

// Error handling middleware for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'File size too large. Maximum size is 10MB' 
      });
    }
    return res.status(400).json({ 
      success: false,
      message: `Upload error: ${err.message}` 
    });
  } else if (err) {
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
  next();
};
