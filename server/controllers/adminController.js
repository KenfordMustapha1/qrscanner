const Admin = require('../models/Admin');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

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

// Create Employee
exports.createUser = async (req, res) => {
  try {
    const { employeeId, name, department, position, profilePhotoUrl, email, password } = req.body;

    if (!employeeId || !name || !department || !email || !password) {
      return res.status(400).json({ message: 'Employee ID, name, department, email, and password are required' });
    }

    if (typeof password !== 'string' || password.trim().length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    const existingEmployeeId = await User.findOne({ employeeId });
    if (existingEmployeeId) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    // Generate unique QR code string
    const qrCodeString = uuidv4();

    // Create user
    const user = new User({
      employeeId,
      name,
      department,
      position: position || '',
      profilePhotoUrl: profilePhotoUrl || '',
      email,
      passwordHash: await bcrypt.hash(password, 10),
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
      message: 'Employee created successfully',
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        department: user.department,
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

// Get All Users (optionally include qrCode for QR display)
exports.getUsers = async (req, res) => {
  try {
    const { includeQr } = req.query;
    const select = includeQr === 'true' ? '' : '-qrCode';
    const users = await User.find().select(select).sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update User
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, name, department, email } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (employeeId) {
      const existing = await User.findOne({ employeeId, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Employee ID already in use' });
      }
      user.employeeId = employeeId;
    }
    if (name) user.name = name;
    if (department) user.department = department;
    if (email) {
      const existing = await User.findOne({ email, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    await user.save();
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        department: user.department,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await Attendance.deleteMany({ userId: id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Regenerate QR Code for User
exports.regenerateQR = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const qrCodeString = uuidv4();
    user.qrCode = qrCodeString;
    await user.save();

    const qrCodeImage = await QRCode.toDataURL(qrCodeString, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 300
    });

    res.json({
      message: 'QR code regenerated successfully',
      qrCode: qrCodeString,
      qrCodeImage
    });
  } catch (error) {
    console.error('Regenerate QR error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Settings
exports.getSettings = async (req, res) => {
  try {
    const lateCutoff = await Settings.getLateCutoff();
    const scanSchedule = await Settings.getScanSchedule();
    res.json({ lateCutoffTime: lateCutoff, scanSchedule });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Settings
exports.updateSettings = async (req, res) => {
  try {
    const { lateCutoffTime, scanSchedule } = req.body;
    if (lateCutoffTime) {
      await Settings.setLateCutoff(lateCutoffTime);
    }
    if (scanSchedule) {
      await Settings.setScanSchedule(scanSchedule);
    }
    const lateCutoff = await Settings.getLateCutoff();
    const savedSchedule = await Settings.getScanSchedule();
    res.json({
      message: 'Settings updated',
      lateCutoffTime: lateCutoff,
      scanSchedule: savedSchedule
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Attendance Records (with filters: date, userId, search/name)
exports.getAttendance = async (req, res) => {
  try {
    const { date, userId, search, startDate, endDate } = req.query;
    
    let query = {};
    
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }
    
    if (userId) {
      query.userId = userId;
    }

    let attendance = await Attendance.find(query)
      .populate('userId', 'name email')
      .sort({ date: -1, time: -1 });

    if (search && search.trim()) {
      const searchLower = search.trim().toLowerCase();
      attendance = attendance.filter(
        r => (r.userId?.name?.toLowerCase().includes(searchLower) ||
              r.userId?.email?.toLowerCase().includes(searchLower))
      );
    }

    res.json({ attendance });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Attendance Stats (for dashboard)
exports.getAttendanceStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const totalUsers = await User.countDocuments();
    const todayRecords = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate('userId', 'name email');

    const present = todayRecords.filter(r => r.status === 'Present').length;
    const late = todayRecords.filter(r => r.status === 'Late').length;
    const totalPresent = present + late;
    const absent = Math.max(0, totalUsers - totalPresent);
    const attendancePercent = totalUsers > 0
      ? Math.round((totalPresent / totalUsers) * 100)
      : 0;

    res.json({
      totalUsers,
      presentToday: totalPresent,
      present,
      late,
      absent,
      attendancePercent,
      recentScans: todayRecords.slice(0, 10)
    });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Analytics (for charts - attendance by date)
exports.getAttendanceAnalytics = async (req, res) => {
  try {
    const { days = 14 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days, 10));

    const records = await Attendance.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 }, late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ analytics: records });
  } catch (error) {
    console.error('Get analytics error:', error);
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

// Export Attendance to Excel
exports.exportAttendanceExcel = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
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

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Attendance', { headerFooter: { firstHeader: 'Attendance Report' } });
    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Date', key: 'date', width: 12 },
      { header: 'Time In', key: 'timeIn', width: 12 },
      { header: 'Time Out', key: 'timeOut', width: 12 },
      { header: 'Status', key: 'status', width: 12 }
    ];
    sheet.getRow(1).font = { bold: true };

    attendance.forEach(r => {
      sheet.addRow({
        name: r.userId?.name || 'N/A',
        email: r.userId?.email || 'N/A',
        date: new Date(r.date).toLocaleDateString(),
        timeIn: r.timeIn || r.time || '',
        timeOut: r.timeOut || '',
        status: r.status || 'Present'
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Export Attendance to PDF
exports.exportAttendancePDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
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

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=attendance-${Date.now()}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    const tableTop = doc.y;
    const colWidths = [120, 150, 80, 70, 70, 70];
    const headers = ['Name', 'Email', 'Date', 'Time In', 'Time Out', 'Status'];
    
    doc.font('Helvetica-Bold').fontSize(9);
    let x = 50;
    headers.forEach((h, i) => {
      doc.text(h, x, tableTop, { width: colWidths[i] });
      x += colWidths[i];
    });
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(8);
    let y = doc.y;
    attendance.forEach((r, idx) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
        doc.font('Helvetica-Bold').fontSize(9);
        x = 50;
        headers.forEach((h, i) => {
          doc.text(h, x, y, { width: colWidths[i] });
          x += colWidths[i];
        });
        y += 15;
        doc.font('Helvetica').fontSize(8);
      }
      x = 50;
      const row = [
        (r.userId?.name || 'N/A').substring(0, 20),
        (r.userId?.email || 'N/A').substring(0, 25),
        new Date(r.date).toLocaleDateString(),
        (r.timeIn || r.time || '-').substring(0, 8),
        (r.timeOut || '-').substring(0, 8),
        r.status || 'Present'
      ];
      row.forEach((cell, i) => {
        doc.text(String(cell), x, y, { width: colWidths[i] });
        x += colWidths[i];
      });
      y += 18;
    });

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
