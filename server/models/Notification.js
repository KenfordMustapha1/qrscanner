const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientType: { type: String, enum: ['employee', 'admin'], required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, required: true },
    type: { type: String, trim: true, default: '' },
    title: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

notificationSchema.index({ recipientType: 1, recipientId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

