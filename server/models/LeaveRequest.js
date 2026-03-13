const mongoose = require('mongoose');

const leaveHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED'], required: true },
    note: { type: String, trim: true, default: '' },
    actorType: { type: String, enum: ['employee', 'admin', 'system'], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, required: false },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const leaveRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['LEAVE', 'WFH', 'OVERTIME'], required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED'], default: 'PENDING' },
    history: { type: [leaveHistorySchema], default: [] }
  },
  { timestamps: true }
);

leaveRequestSchema.index({ userId: 1, startDate: -1, endDate: -1 });
leaveRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);

