const mongoose = require('mongoose');

const LayoutItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['slot', 'entrance', 'exit', 'lane', 'path', 'ev_area', 'handicap_area', 'vip_area'],
    required: true,
  },
  slotNumber: { type: String },
  category: {
    type: String,
    enum: ['two-wheeler', 'four-wheeler', 'ev', 'disabled', 'vip', 'general'],
    default: 'four-wheeler',
  },
  x: { type: Number, required: true, default: 0 },
  y: { type: Number, required: true, default: 0 },
  z: { type: Number, required: true, default: 0 },
  rotation: { type: Number, default: 0 },
  width: { type: Number, default: 2 },
  length: { type: Number, default: 4 },
});

const LayoutSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, default: 'Campus Main Layout' },
    floor: { type: Number, required: true, default: 1 },
    items: [LayoutItemSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Layout', LayoutSchema);
