const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    reason: {
      type: String,
      enum: [
        'stolen',
        'repeated_defaulter',
        'unpaid_penalties',
        'suspicious_activity',
        'vip_security_restriction',
        'other',
      ],
      default: 'stolen',
    },
    severity: {
      type: String,
      enum: ['warning', 'danger', 'police_wanted'],
      default: 'danger',
    },
    notes: {
      type: String,
      default: '',
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    addedByName: {
      type: String,
      default: 'Security Staff',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

blacklistSchema.index({ vehicleNumber: 1 });
blacklistSchema.index({ isActive: 1 });

module.exports = mongoose.model('Blacklist', blacklistSchema);
