const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planType: {
    type: String,
    enum: ['silver', 'gold_vip', 'corporate_fleet'],
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'annual'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  vehicleNumbers: {
    type: [String],
    default: []
  },
  dedicatedSlot: {
    type: String,
    default: ''
  },
  rfidTag: {
    type: String,
    default: function() {
      return 'RFID-PS-' + Math.floor(100000 + Math.random() * 900000);
    }
  },
  anprWhitelisted: {
    type: Boolean,
    default: true
  },
  razorpaySubscriptionId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ vehicleNumbers: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
