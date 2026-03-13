const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Default late cutoff: 8:10 AM (HH:mm)
const DEFAULT_LATE_CUTOFF = '08:10';
const DEFAULT_SCHEDULE = {
  timeIn: { start: '07:30', end: '08:10' },
  timeOut: { start: '16:00', end: '17:30' }
};

// Default QR token TTL in seconds (e.g. 30s)
const DEFAULT_QR_TOKEN_TTL_SECONDS = 30;

settingsSchema.statics.getLateCutoff = async function () {
  const doc = await this.findOne({ key: 'lateCutoffTime' });
  return doc ? doc.value : (process.env.LATE_CUTOFF_TIME || DEFAULT_LATE_CUTOFF);
};

settingsSchema.statics.setLateCutoff = async function (time) {
  await this.findOneAndUpdate(
    { key: 'lateCutoffTime' },
    { value: time, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

settingsSchema.statics.getScanSchedule = async function () {
  const doc = await this.findOne({ key: 'scanSchedule' });
  return doc ? doc.value : DEFAULT_SCHEDULE;
};

settingsSchema.statics.setScanSchedule = async function (schedule) {
  await this.findOneAndUpdate(
    { key: 'scanSchedule' },
    { value: schedule, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

/**
 * Get QR token TTL in seconds for rotating employee QR codes.
 * Falls back to env var QR_TOKEN_TTL_SECONDS or a sane default.
 */
settingsSchema.statics.getQrTokenTtlSeconds = async function () {
  const doc = await this.findOne({ key: 'qrTokenTtlSeconds' });

  if (doc && typeof doc.value === 'number' && Number.isFinite(doc.value) && doc.value > 0) {
    return doc.value;
  }

  const envVal = Number(process.env.QR_TOKEN_TTL_SECONDS);
  if (Number.isFinite(envVal) && envVal > 0) {
    return envVal;
  }

  return DEFAULT_QR_TOKEN_TTL_SECONDS;
};

module.exports = mongoose.model('Settings', settingsSchema);
