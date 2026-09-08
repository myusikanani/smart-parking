const ParkingSlot = require('../models/ParkingSlot');
const { emitSlotUpdate, emitOccupancyUpdate, emitAlert } = require('../utils/socket');

let enabled = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const randomStatus = () => {
  const statuses = ['available', 'occupied', 'available', 'available', 'occupied', 'reserved', 'available', 'occupied', 'available', 'maintenance'];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const simulateSingleSlot = async () => {
  try {
    const slot = await ParkingSlot.findOne({ status: { $ne: 'maintenance' } }).skip(Math.floor(Math.random() * 10));
    if (!slot) return null;

    const newStatus = randomStatus();
    const wasOccupied = slot.status === 'occupied';
    const isOccupied = newStatus === 'occupied';

    slot.status = newStatus;
    await slot.save();

    const payload = {
      slotId: slot._id,
      slotNumber: slot.number,
      floor: slot.floor,
      status: newStatus,
      timestamp: Date.now(),
    };

    emitSlotUpdate(payload);

    if (!wasOccupied && isOccupied) {
      emitAlert({ type: 'slot-occupied', severity: 'info', message: `Slot ${slot.number} just occupied`, slotNumber: slot.number, floor: slot.floor });
    } else if (wasOccupied && !isOccupied) {
      emitAlert({ type: 'slot-freed', severity: 'success', message: `Slot ${slot.number} is now available`, slotNumber: slot.number, floor: slot.floor });
    }

    return payload;
  } catch (err) {
    console.error('[Simulation] Error:', err.message);
    return null;
  }
};

const emitOccupancySnapshot = async () => {
  try {
    const total = await ParkingSlot.countDocuments();
    const occupied = await ParkingSlot.countDocuments({ status: 'occupied' });
    const available = total - occupied;

    emitOccupancyUpdate({ total, occupied, available, timestamp: Date.now() });
  } catch (err) {
    console.error('[Simulation] Occupancy error:', err.message);
  }
};

const runSimulationLoop = async () => {
  while (enabled) {
    await simulateSingleSlot();
    if (Math.random() > 0.7) await sleep(3000);
    await emitOccupancySnapshot();
    await sleep(4000);
  }
};

const startRealtimeSimulation = () => {
  if (enabled) {
    console.log('Realtime simulation already running');
    return;
  }
  enabled = true;
  console.log('Real-time parking simulation started');
  runSimulationLoop();
};

const stopRealtimeSimulation = () => {
  enabled = false;
  console.log('Real-time parking simulation stopped');
};

module.exports = {
  startRealtimeSimulation,
  stopRealtimeSimulation,
  isSimulationRunning: () => enabled,
};
