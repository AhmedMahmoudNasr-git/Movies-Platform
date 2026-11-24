const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

// File filter (Only image formats allowed)
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new AppError('Invalid file type! Please upload a valid image file (JPG, PNG, WEBP, GIF)', 400), false);
    }
};

// Maximum file size: 3MB
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    }
});

module.exports = upload;
