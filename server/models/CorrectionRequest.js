const mongoose = require('mongoose');

const correctionHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED'], required: true },
    note: { type: String, trim: true, default: '' },
    actorType: { type: String, enum: ['employee', 'admin', 'system'], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, required: false },
    at: { type: Date, default: Date.now }
  },
  { _id: false }
);

const correctionRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true }, // day being corrected (00:00)
    requestedTimeIn: { type: String, trim: true, default: '' },
    requestedTimeOut: { type: String, trim: true, default: '' },
    reason: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'DECLINED', 'CANCELLED'], default: 'PENDING' },
    history: { type: [correctionHistorySchema], default: [] }
  },
  { timestamps: true }
);

correctionRequestSchema.index({ userId: 1, date: 1 }, { unique: true });
correctionRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('CorrectionRequest', correctionRequestSchema);

