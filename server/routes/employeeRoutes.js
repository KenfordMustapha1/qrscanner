const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const employeeController = require('../controllers/employeeController');
const employeeAuth = require('../middleware/employeeAuth');

// Public
router.post('/login', employeeController.login);

// File upload setup for profile photos
const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-photos');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${req.employee.id}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    cb(new Error('Only image files are allowed'));
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Protected
router.get('/me', employeeAuth, employeeController.me);
router.get('/attendance', employeeAuth, employeeController.attendanceHistory);
router.post(
  '/profile-photo',
  employeeAuth,
  upload.single('photo'),
  employeeController.updateProfilePhoto
);

module.exports = router;

