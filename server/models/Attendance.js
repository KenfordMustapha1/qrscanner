const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // Legacy single time field (kept for backward compatibility)
  time: {
    type: String,
    required: true
  },
  // New fields to track time in / time out
  timeIn: {
    type: String
  },
  timeOut: {
    type: String
  },
  status: {
    type: String,
    default: "Present"
  }
}, {
  timestamps: true
});

// Create compound index to prevent duplicate attendance for same user on same day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
