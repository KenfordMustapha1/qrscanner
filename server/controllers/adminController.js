const Admin = require('../models/Admin');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

// Admin Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create User
exports.createUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate unique QR code string
    const qrCodeString = uuidv4();

    // Create user
    const user = new User({
      name,
      email,
      qrCode: qrCodeString
    });

    await user.save();

    // Generate QR code image (base64)
    const qrCodeImage = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        qrCode: user.qrCode,
        createdAt: user.createdAt
      },
      qrCodeImage
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get All Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-qrCode').sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Attendance Records
exports.getAttendance = async (req, res) => {
  try {
    const { date, userId } = req.query;
    
    let query = {};
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (userId) {
      query.userId = userId;
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1, time: -1 });

    res.json({ attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export Attendance to CSV
exports.exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const attendance = await Attendance.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1, time: -1 });

    // Convert to CSV format
    const csvHeader = 'Name,Email,Date,Time In,Time Out,Status\n';
    const csvRows = attendance.map(record => {
      const name = record.userId?.name || 'N/A';
      const email = record.userId?.email || 'N/A';
      const date = new Date(record.date).toLocaleDateString();
      const timeIn = record.timeIn || record.time;
      const timeOut = record.timeOut || '';
      const status = record.status;
      return `${name},${email},${date},${timeIn},${timeOut},${status}`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
