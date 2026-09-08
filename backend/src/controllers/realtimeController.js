const ParkingSlot = require('../models/ParkingSlot');
const { startRealtimeSimulation, stopRealtimeSimulation, isSimulationRunning } = require('../jobs/realtimeSimulation');
const { emitSlotUpdate, emitOccupancyUpdate, emitAlert } = require('../utils/socket');

exports.getLiveState = async (req, res) => {
  try {
    const slots = await ParkingSlot.find().lean();
    const occupied = await ParkingSlot.countDocuments({ status: 'occupied' });
    const available = await ParkingSlot.countDocuments({ status: 'available' });

    const mappedSlots = slots.map((s) => ({
      id: s._id,
      number: s.number,
      status: s.status,
      floor: s.floor,
      x: s.x || 0,
      z: s.z || 0,
      zone: s.zone || 'A',
      category: s.category,
      pricePerHour: s.pricePerHour,
      features: s.features || [],
      hasVehicle: s.status === 'occupied',
    }));

    res.json({
      success: true,
      slots: mappedSlots,
      stats: { total: slots.length, occupied, available, simulation: isSimulationRunning() },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.startSimulation = async (req, res) => {
  try {
    startRealtimeSimulation();
    res.json({ success: true, message: 'Simulation started', running: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.stopSimulation = async (req, res) => {
  try {
    stopRealtimeSimulation();
    res.json({ success: true, message: 'Simulation stopped', running: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSimulationStatus = async (req, res) => {
  res.json({ success: true, running: isSimulationRunning() });
};

exports.manualUpdateSlot = async (req, res) => {
  try {
    const { slotId, status, message } = req.body;
    if (!slotId || !status) {
      return res.status(400).json({ success: false, message: 'slotId and status required' });
    }

    const slot = await ParkingSlot.findById(slotId);
    if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });

    slot.status = status;
    await slot.save();

    emitSlotUpdate({ slotId: slot._id, slotNumber: slot.number, floor: slot.floor, status, timestamp: Date.now() });
    if (message) emitAlert({ type: 'manual-update', severity: 'info', message, slotNumber: slot.number });

    res.json({ success: true, slot });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.broadcastAlert = async (req, res) => {
  try {
    const { type = 'alert', severity = 'info', message = 'System alert' } = req.body;
    emitAlert({ type, severity, message, timestamp: Date.now() });
    res.json({ success: true, message: 'Alert broadcasted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
