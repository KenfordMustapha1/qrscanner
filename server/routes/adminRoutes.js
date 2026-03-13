const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// Public route
router.post('/login', adminController.login);

// Protected routes
router.post('/create-user', authMiddleware, adminController.createUser);
router.get('/users', authMiddleware, adminController.getUsers);
router.put('/users/:id', authMiddleware, adminController.updateUser);
router.delete('/users/:id', authMiddleware, adminController.deleteUser);
router.post('/users/:id/regenerate-qr', authMiddleware, adminController.regenerateQR);
router.get('/attendance', authMiddleware, adminController.getAttendance);
router.get('/attendance/stats', authMiddleware, adminController.getAttendanceStats);
router.get('/attendance/analytics', authMiddleware, adminController.getAttendanceAnalytics);
router.get('/export-attendance', authMiddleware, adminController.exportAttendance);
router.get('/export-attendance/excel', authMiddleware, adminController.exportAttendanceExcel);
router.get('/export-attendance/pdf', authMiddleware, adminController.exportAttendancePDF);
router.get('/settings', authMiddleware, adminController.getSettings);
router.put('/settings', authMiddleware, adminController.updateSettings);

module.exports = router;
