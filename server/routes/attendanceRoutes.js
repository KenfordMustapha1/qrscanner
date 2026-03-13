const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

router.post('/scan', attendanceController.scanQR);
router.get('/status', attendanceController.getScannerStatus);

module.exports = router;
