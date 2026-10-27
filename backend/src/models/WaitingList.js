const mongoose = require('mongoose');

const waitingListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  category: {
    type: String,
    enum: ['four-wheeler', 'two-wheeler', 'ev', 'disabled'],
    default: 'four-wheeler',
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLocation',
  },
  status: {
    type: String,
    enum: ['waiting', 'notified', 'converted', 'cancelled'],
    default: 'waiting',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('WaitingList', waitingListSchema);
