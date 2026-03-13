const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');
const path = require('path');
const fs = require('fs');

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// Employee Login (employeeId + password)
exports.login = async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    if (!employeeId || !password) {
      return res.status(400).json({ message: 'Employee ID and password are required' });
    }

    const employee = await User.findOne({ employeeId, role: 'employee' }).select('+passwordHash');
    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!employee.passwordHash) {
      return res.status(401).json({ message: 'Password not set. Please contact your administrator.' });
    }

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: employee._id, type: 'employee' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get employee profile + QR image + today's attendance
exports.me = async (req, res) => {
  try {
    const employee = await User.findById(req.employee.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const today = startOfToday();
    const todayAttendance = await Attendance.findOne({ userId: employee._id, date: today });

    // Use the same persistent QR string as the Admin-generated employee QR
    // (Attendance scan looks up User by `qrCode`).
    const qrCodeImage = await QRCode.toDataURL(employee.qrCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 320
    });

    res.json({
      employee: {
        id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        department: employee.department,
        position: employee.position || '',
        email: employee.email || '',
        profilePhotoUrl: employee.profilePhotoUrl || ''
      },
      qrCodeImage,
      todayAttendance: todayAttendance ? {
        date: todayAttendance.date,
        timeIn: todayAttendance.timeIn || todayAttendance.time,
        timeOut: todayAttendance.timeOut || '',
        status: todayAttendance.status || 'Present'
      } : null
    });
  } catch (error) {
    console.error('Employee me error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a fresh expiring QR image (rotating QR)
exports.qr = async (req, res) => {
  try {
    const employee = await User.findById(req.employee.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Kept for backwards compatibility; returns the same persistent QR image.
    const qrCodeImage = await QRCode.toDataURL(employee.qrCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 320
    });

    res.json({ qrCodeImage });
  } catch (error) {
    console.error('Employee qr error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Attendance history for logged-in employee
exports.attendanceHistory = async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.employee.id })
      .sort({ date: -1, createdAt: -1 });

    res.json({
      attendance: records.map((r) => ({
        id: r._id,
        date: r.date,
        timeIn: r.timeIn || r.time,
        timeOut: r.timeOut || '',
        status: r.status || 'Present'
      }))
    });
  } catch (error) {
    console.error('Employee history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update employee profile photo
exports.updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const employee = await User.findById(req.employee.id);
    if (!employee) {
      // Clean up uploaded file if user not found
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete old photo if it exists and is in our uploads folder
    if (employee.profilePhotoUrl && employee.profilePhotoUrl.startsWith('/uploads/profile-photos/')) {
      const oldPath = path.join(__dirname, '..', employee.profilePhotoUrl);
      fs.unlink(oldPath, () => {});
    }

    const relativePath = `/uploads/profile-photos/${path.basename(req.file.path)}`;
    employee.profilePhotoUrl = relativePath;
    await employee.save();

    res.json({ profilePhotoUrl: relativePath });
  } catch (error) {
    console.error('Update profile photo error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

