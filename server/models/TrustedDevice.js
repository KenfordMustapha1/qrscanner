const mongoose = require('mongoose');

const trustedDeviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deviceId: { type: String, required: true, trim: true }, // client-generated stable id
    label: { type: String, trim: true, default: '' },
    lastSeenAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

trustedDeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });
trustedDeviceSchema.index({ userId: 1, lastSeenAt: -1 });

module.exports = mongoose.model('TrustedDevice', trustedDeviceSchema);

