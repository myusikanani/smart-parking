const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  incidentId: {
    type: String,
    required: true,
    unique: true,
    default: () => 'INC-' + Math.floor(100000 + Math.random() * 900000)
  },
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  slotNumber: {
    type: String,
    default: 'N/A'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'vehicle_damage',
      'illegal_parking',
      'suspicious_activity',
      'payment_evasion',
      'barrier_break',
      'verbal_altercation',
      'other'
    ],
    default: 'vehicle_damage'
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  description: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    default: ''
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'investigating', 'resolved', 'escalated'],
    default: 'open'
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reportedByName: {
    type: String,
    default: 'Security Guard'
  },
  resolutionNotes: {
    type: String,
    default: ''
  },
  resolvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

incidentReportSchema.index({ vehicleNumber: 1, createdAt: -1 });
incidentReportSchema.index({ status: 1 });

module.exports = mongoose.model('IncidentReport', incidentReportSchema);
