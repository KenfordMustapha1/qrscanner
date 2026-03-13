const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    timeIn: { type: String, required: true, trim: true }, // HH:mm
    timeOut: { type: String, required: true, trim: true }, // HH:mm
    daysOfWeek: {
      type: [Number], // 0=Sun ... 6=Sat
      default: [1, 2, 3, 4, 5]
    },
    graceMinutes: { type: Number, default: 10, min: 0, max: 180 },
    appliesToDepartment: { type: String, trim: true, default: '' }, // matches User.department (string) for now
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

shiftSchema.index({ appliesToDepartment: 1, isActive: 1 });

module.exports = mongoose.model('Shift', shiftSchema);

