const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    enum: ['two-wheeler', 'four-wheeler', 'ev', 'disabled'],
    required: true
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  floor: {
    type: Number,
    required: true
  },
  pricePerHour: {
    type: Number,
    required: true,
    default: 20
  },
  pricePerDay: {
    type: Number,
    required: true,
    default: 100
  },
  pricePerMonth: {
    type: Number,
    required: true,
    default: 2000
  },
  location: {
    type: String,
    default: 'City Center Hub (Downtown)'
  },
  zone: {
    type: String,
    default: 'A'
  },
  x: {
    type: Number,
    default: 0
  },
  z: {
    type: Number,
    default: 0
  },
  features: [String],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
