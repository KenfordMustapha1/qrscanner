const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Public route
router.post('/login', adminController.login);

// Protected routes
router.post('/create-user', authMiddleware, adminController.createUser);
router.get('/users', authMiddleware, adminController.getUsers);
router.get('/attendance', authMiddleware, adminController.getAttendance);
router.get('/export-attendance', authMiddleware, adminController.exportAttendance);

module.exports = router;
