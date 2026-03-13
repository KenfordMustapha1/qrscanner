const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Settings = require('../models/Settings');

function hhmmFromDate(d) {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function minutesFromHHMM(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h * 60) + m;
}

function isInWindow(nowHHMM, startHHMM, endHHMM) {
  const t = minutesFromHHMM(nowHHMM);
  const s = minutesFromHHMM(startHHMM);
  const e = minutesFromHHMM(endHHMM);
  return t >= s && t <= e;
}

// Helper: compare time string (HH:mm format) - returns true if time > cutoff
function isAfterCutoff(timeStr, cutoffStr) {
  return minutesFromHHMM(timeStr) > minutesFromHHMM(cutoffStr);
}

// Scan QR Code and Record Attendance
exports.scanQR = async (req, res) => {
  // Variables shared between try/catch so we can recover on duplicate-key errors
  let user;
  let date;
  let time; // HH:mm
  let schedule;
  let mode; // 'IN' | 'OUT'

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
    time = hhmmFromDate(now);

    schedule = await Settings.getScanSchedule();
    const inStart = schedule?.timeIn?.start;
    const inEnd = schedule?.timeIn?.end;
    const outStart = schedule?.timeOut?.start;
    const outEnd = schedule?.timeOut?.end;

    const inWindow = inStart && inEnd && isInWindow(time, inStart, inEnd);
    const outWindow = outStart && outEnd && isInWindow(time, outStart, outEnd);

    if (inWindow && outWindow) {
      // Misconfigured schedule overlap
      return res.status(500).json({ message: 'Schedule misconfiguration: Time-In and Time-Out windows overlap.' });
    }
    if (inWindow) mode = 'IN';
    if (outWindow) mode = 'OUT';

    if (!mode) {
      // Outside allowed window
      return res.status(403).json({
        message: 'Scanner is currently unavailable. Please wait for the scheduled scan time.',
        schedule
      });
    }

    if (mode === 'OUT' && (!outStart || !outEnd)) {
      return res.status(403).json({
        message: 'Time-Out scanning is disabled by the administrator.',
        schedule
      });
    }

    // Check if attendance already recorded for today
    const existingAttendance = await Attendance.findOne({
      userId: user._id,
      date: date
    });

    if (mode === 'IN') {
      if (existingAttendance?.timeIn) {
        return res.status(400).json({
          message: 'Time-In already recorded for today',
          attendance: existingAttendance
        });
      }

      const lateCutoff = await Settings.getLateCutoff();
      const status = isAfterCutoff(time, lateCutoff) ? 'Late' : 'Present';

      const attendance = existingAttendance || new Attendance({
        userId: user._id,
        date,
        time: time // legacy required
      });

      attendance.timeIn = time;
      attendance.time = attendance.time || time;
      attendance.status = status;

      await attendance.save();

      return res.status(existingAttendance ? 200 : 201).json({
        message: status === 'Late' ? 'Time in recorded (Late)' : 'Time in recorded successfully',
        attendance: {
          id: attendance._id,
          employeeId: user.employeeId,
          userName: user.name,
          department: user.department,
          userEmail: user.email,
          date: attendance.date,
          time: attendance.time,
          timeIn: attendance.timeIn,
          timeOut: attendance.timeOut,
          status: attendance.status,
          action: 'IN'
        }
      });
    }

    // mode === 'OUT'
    if (!existingAttendance?.timeIn) {
      return res.status(400).json({
        message: 'Time-In not recorded yet. Please scan during the Time-In schedule first.'
      });
    }
    if (existingAttendance.timeOut) {
      return res.status(400).json({
        message: 'Time-Out already recorded for today',
        attendance: existingAttendance
      });
    }

    existingAttendance.timeOut = time;
    // Ensure legacy time is populated
    if (!existingAttendance.time) {
      existingAttendance.time = existingAttendance.timeIn || time;
    }

    await existingAttendance.save();

    return res.status(200).json({
      message: 'Time out recorded successfully',
      attendance: {
        id: existingAttendance._id,
        employeeId: user.employeeId,
        userName: user.name,
        department: user.department,
        userEmail: user.email,
        date: existingAttendance.date,
        time: existingAttendance.time,
        timeIn: existingAttendance.timeIn,
        timeOut: existingAttendance.timeOut,
        status: existingAttendance.status,
        action: 'OUT'
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
          // Re-run the same logic safely based on schedule/mode
          schedule = schedule || await Settings.getScanSchedule();
          const inStart = schedule?.timeIn?.start;
          const inEnd = schedule?.timeIn?.end;
          const outStart = schedule?.timeOut?.start;
          const outEnd = schedule?.timeOut?.end;
          const inWindow = inStart && inEnd && isInWindow(time, inStart, inEnd);
          const outWindow = outStart && outEnd && isInWindow(time, outStart, outEnd);
          if (inWindow && !outWindow) mode = 'IN';
          if (outWindow && !inWindow) mode = 'OUT';

          if (mode === 'OUT' && (!outStart || !outEnd)) {
            return res.status(403).json({
              message: 'Time-Out scanning is disabled by the administrator.',
              schedule
            });
          }

          if (mode === 'IN') {
            if (existingAttendance.timeIn) {
              return res.status(400).json({ message: 'Time-In already recorded for today', attendance: existingAttendance });
            }
            const lateCutoff = await Settings.getLateCutoff();
            const status = isAfterCutoff(time, lateCutoff) ? 'Late' : 'Present';
            existingAttendance.timeIn = time;
            existingAttendance.time = existingAttendance.time || time;
            existingAttendance.status = status;
            await existingAttendance.save();
            return res.status(200).json({
              message: status === 'Late' ? 'Time in recorded (Late)' : 'Time in recorded successfully',
              attendance: {
                id: existingAttendance._id,
                employeeId: user.employeeId,
                userName: user.name,
                department: user.department,
                userEmail: user.email,
                date: existingAttendance.date,
                time: existingAttendance.time,
                timeIn: existingAttendance.timeIn,
                timeOut: existingAttendance.timeOut,
                status: existingAttendance.status,
                action: 'IN'
              }
            });
          }

          if (mode === 'OUT') {
            if (!existingAttendance.timeIn) {
              return res.status(400).json({ message: 'Time-In not recorded yet. Please scan during the Time-In schedule first.' });
            }
            if (existingAttendance.timeOut) {
              return res.status(400).json({ message: 'Time-Out already recorded for today', attendance: existingAttendance });
            }
            existingAttendance.timeOut = time;
            existingAttendance.time = existingAttendance.time || existingAttendance.timeIn || time;
            await existingAttendance.save();
            return res.status(200).json({
              message: 'Time out recorded successfully',
              attendance: {
                id: existingAttendance._id,
                employeeId: user.employeeId,
                userName: user.name,
                department: user.department,
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

          return res.status(403).json({
            message: 'Scanner is currently unavailable. Please wait for the scheduled scan time.',
            schedule
          });
        }
      } catch (recoveryError) {
        console.error('Duplicate-key recovery failed:', recoveryError);
      }
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: get current scanner availability and mode
exports.getScannerStatus = async (req, res) => {
  try {
    const schedule = await Settings.getScanSchedule();
    const now = new Date();
    const hhmm = hhmmFromDate(now);
    const inStart = schedule?.timeIn?.start;
    const inEnd = schedule?.timeIn?.end;
    const outStart = schedule?.timeOut?.start;
    const outEnd = schedule?.timeOut?.end;
    const inWindow = inStart && inEnd && isInWindow(hhmm, inStart, inEnd);
    const outWindow = outStart && outEnd && isInWindow(hhmm, outStart, outEnd);

    let mode = null;
    if (inWindow && !outWindow) mode = 'IN';
    if (outWindow && !inWindow) mode = 'OUT';

    res.json({
      now: hhmm,
      schedule,
      available: Boolean(mode),
      mode,
      message: mode
        ? (mode === 'IN' ? 'Time-In scanning is open.' : 'Time-Out scanning is open.')
        : 'Scanner is currently unavailable. Please wait for the scheduled scan time.'
    });
  } catch (error) {
    console.error('Get scanner status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
