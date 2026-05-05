const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  entity: { type: String, enum: ['stock', 'rate', 'transaction'], required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId }, // Flexible: could refer to ProductId or None (for rates)
  action: { type: String, required: true }, // e.g., 'deducted', 'updated', 'failed'
  payload: { type: mongoose.Schema.Types.Mixed }, // Holds the old/new values, change amount, reason, etc.
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Tracking who did what
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
