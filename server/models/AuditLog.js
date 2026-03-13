const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorType: { type: String, enum: ['admin', 'employee', 'system'], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, required: false },
    action: { type: String, required: true, trim: true },
    targetType: { type: String, trim: true, default: '' },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: false },
    ip: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorType: 1, actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

