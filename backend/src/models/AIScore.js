const mongoose = require('mongoose');

const aiScoreSchema = new mongoose.Schema({
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSlot',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  confidence: {
    type: Number,
    default: 0.5,
    min: 0,
    max: 1,
  },
  factors: {
    distanceToEntrance: Number,
    floor: Number,
    peakHour: Boolean,
    userPreference: Boolean,
    recentFreed: Boolean,
    occupancyRate: Number,
  },
  wasAccepted: {
    type: Boolean,
    default: null,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
});

aiScoreSchema.index({ slot: 1, generatedAt: -1 });
aiScoreSchema.index({ userId: 1, generatedAt: -1 });

module.exports = mongoose.model('AIScore', aiScoreSchema);
