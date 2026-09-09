const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: String, // display name/email at the time of the action — kept even if the user is later deleted
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: 'unknown',
  },
  actionType: {
    type: String,
    enum: [
      'login', 'logout', 'booking_create', 'booking_cancel', 'booking_email_qr',
      'slot_change', 'payment', 'user_update', 'user_delete', 'pricing_update',
      'entry', 'exit', 'blacklist_add', 'blacklist_remove', 'incident_report',
      'emergency_sos', 'walkin_entry', 'security', 'recovery', 'backup'
    ],
    required: true,
  },
}, { timestamps: true }); // createdAt doubles as the log's timestamp

// Most-recent-first is the only access pattern this table needs.
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
