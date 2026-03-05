const User = require('../models/User');
const Attendance = require('../models/Attendance');

// Scan QR Code and Record Attendance
exports.scanQR = async (req, res) => {
  // Variables shared between try/catch so we can recover on duplicate-key errors
  let user;
  let date;
  let time;

  try {
    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(400).json({ message: 'QR code is required' });
    }

    // Find user by QR code
    user = await User.findOne({ qrCode });
    if (!user) {
      return res.status(404).json({ message: 'Invalid QR code' });
    }

    // Get current date and time
    const now = new Date();
    date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    time = now.toLocaleTimeString('en-US', { hour12: false });

    // Check if attendance already recorded for today
    const existingAttendance = await Attendance.findOne({
      userId: user._id,
      date: date
    });

    if (existingAttendance) {
      // If there's already a record but no timeout yet, record time out
      if (!existingAttendance.timeOut) {
        existingAttendance.timeOut = time;
        // Ensure legacy time/timeIn are set for older records
        if (!existingAttendance.timeIn) {
          existingAttendance.timeIn = existingAttendance.time || time;
        }
        if (!existingAttendance.time) {
          existingAttendance.time = existingAttendance.timeIn;
        }

        await existingAttendance.save();

        return res.status(200).json({
          message: 'Time out recorded successfully',
          attendance: {
            id: existingAttendance._id,
            userName: user.name,
            userEmail: user.email,
            date: existingAttendance.date,
            time: existingAttendance.time,      // legacy
            timeIn: existingAttendance.timeIn,
            timeOut: existingAttendance.timeOut,
            status: existingAttendance.status,
            action: 'OUT'
          }
        });
      }

      // Already has both time in and time out
      return res.status(400).json({ 
        message: 'Attendance already completed for today',
        attendance: existingAttendance
      });
    }

    // Create attendance record
    const attendance = new Attendance({
      userId: user._id,
      date: date,
      time: time,
      timeIn: time,
      status: 'Present'
    });

    await attendance.save();

    res.status(201).json({
      message: 'Attendance recorded successfully',
      attendance: {
        id: attendance._id,
        userName: user.name,
        userEmail: user.email,
        date: attendance.date,
        time: attendance.time,      // legacy single time field
        timeIn: attendance.timeIn,
        timeOut: attendance.timeOut,
        status: attendance.status,
        action: 'IN'
      }
    });
  } catch (error) {
    console.error('Scan QR error:', error);
    
    // Handle duplicate key error (MongoDB unique index) as a safe fallback:
    // treat it as a normal "existingAttendance" case and try to set timeOut.
    if (error.code === 11000 && user && date && time) {
      try {
        const existingAttendance = await Attendance.findOne({
          userId: user._id,
          date: date
        });

        if (existingAttendance) {
          if (!existingAttendance.timeOut) {
            existingAttendance.timeOut = time;
            if (!existingAttendance.timeIn) {
              existingAttendance.timeIn = existingAttendance.time || time;
            }
            if (!existingAttendance.time) {
              existingAttendance.time = existingAttendance.timeIn;
            }

            await existingAttendance.save();

            return res.status(200).json({
              message: 'Time out recorded successfully',
              attendance: {
                id: existingAttendance._id,
                userName: user.name,
                userEmail: user.email,
                date: existingAttendance.date,
                time: existingAttendance.time,
                timeIn: existingAttendance.timeIn,
                timeOut: existingAttendance.timeOut,
                status: existingAttendance.status,
                action: 'OUT'
              }
            });
          }

          return res.status(400).json({
            message: 'Attendance already completed for today',
            attendance: existingAttendance
          });
        }
      } catch (recoveryError) {
        console.error('Duplicate-key recovery failed:', recoveryError);
      }
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
