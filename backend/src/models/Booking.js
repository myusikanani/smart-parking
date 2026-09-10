const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'active', 'completed', 'expired', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  reservationExpiresAt: {
    type: Date
  },
  qrCode: {
    type: String
  },
  qrToken: {
    type: String
  },
  entryTime: {
    type: Date
  },
  exitTime: {
    type: Date
  },
  duration: {
    type: Number
  },
  overstayDuration: {
    type: Number,
    default: 0
  },
  overstayPenalty: {
    type: Number,
    default: 0
  },
  penaltyMultiplier: {
    type: Number,
    default: 1
  },
  overstayConflictFlag: {
    type: Boolean,
    default: false
  },
  reassignedFrom: {
    type: String
  },
  reassignedSlotNumber: {
    type: String
  },
  reassignmentReason: {
    type: String
  },
  penaltyPaymentStatus: {
    type: String,
    enum: ['none', 'pending', 'paid', 'failed'],
    default: 'none'
  },
  cancellationReason: {
    type: String
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  penaltyOrderId: {
    type: String
  },
  penaltyPaymentId: {
    type: String
  },
  paidAt: {
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

bookingSchema.index({ qrToken: 1 });
bookingSchema.index({ status: 1, startTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
