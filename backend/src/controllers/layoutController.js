const ParkingSlot = require('../models/ParkingSlot');
const Layout = require('../models/Layout');

// Get Layout for a specific floor (dynamically built from live MongoDB slots if no custom layout exists)
const getLayoutByFloor = async (req, res) => {
  try {
    const floor = parseInt(req.params.floor) || 1;
    let layout = await Layout.findOne({ floor });

    if (!layout || !Array.isArray(layout.items) || layout.items.length === 0) {
      // Find real slots from database for this floor
      const dbSlots = await ParkingSlot.find({ floor }).sort({ number: 1 });

      const items = [
        { id: `ent-${floor}`, type: 'entrance', x: -14, y: 0, z: 0, rotation: 0 },
        { id: `exit-${floor}`, type: 'exit', x: 14, y: 0, z: 0, rotation: 0 },
        { id: `lane-${floor}`, type: 'lane', x: 0, y: 0, z: 0, width: 28, length: 3 }
      ];

      dbSlots.forEach((s, idx) => {
        const isTopRow = idx % 2 === 0;
        const col = Math.floor(idx / 2);
        const defaultX = (col * 4) - 10;
        const defaultZ = isTopRow ? -5 : 5;

        items.push({
          id: String(s._id || `slot-${s.number}`),
          type: 'slot',
          slotNumber: s.number,
          category: s.category || 'four-wheeler',
          status: s.status || 'available',
          isEmergencyBuffer: s.isEmergencyBuffer || false,
          x: typeof s.x === 'number' && s.x !== 0 ? s.x : defaultX,
          y: 0,
          z: typeof s.z === 'number' && s.z !== 0 ? s.z : defaultZ,
          rotation: isTopRow ? 0 : 180,
        });
      });

      layout = {
        name: `Campus Parking Floor ${floor}`,
        floor,
        items
      };
    } else {
      // If layout exists, enrich slot items with live status from ParkingSlot collection
      const dbSlots = await ParkingSlot.find({ floor }).lean();
      const slotStatusMap = new Map();
      dbSlots.forEach((s) => slotStatusMap.set(s.number, s.status));

      layout.items = layout.items.map((item) => {
        if (item.type === 'slot' && item.slotNumber && slotStatusMap.has(item.slotNumber)) {
          const itemObj = typeof item.toObject === 'function' ? item.toObject() : item;
          return {
            ...itemObj,
            status: slotStatusMap.get(item.slotNumber)
          };
        }
        return item;
      });
    }

    res.status(200).json({ success: true, layout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save / Update Layout and auto-synchronize ParkingSlot coordinates in MongoDB
const saveLayout = async (req, res) => {
  try {
    const { floor, items, name } = req.body;
    const targetFloor = parseInt(floor) || 1;

    let layout = await Layout.findOne({ floor: targetFloor });
    if (layout) {
      layout.items = items;
      if (name) layout.name = name;
      await layout.save();
    } else {
      layout = await Layout.create({
        name: name || `Campus Parking Floor ${targetFloor}`,
        floor: targetFloor,
        items,
      });
    }

    // Auto-sync real slots in database: update coordinates (x, z) or create new slots
    const slotItems = Array.isArray(items) ? items.filter((it) => it.type === 'slot') : [];
    for (const s of slotItems) {
      if (!s.slotNumber) continue;
      const cat = ['two-wheeler', 'four-wheeler', 'ev', 'disabled'].includes(s.category)
        ? s.category
        : 'four-wheeler';

      await ParkingSlot.findOneAndUpdate(
        { number: s.slotNumber },
        {
          number: s.slotNumber,
          floor: targetFloor,
          category: cat,
          x: Number(s.x || 0),
          z: Number(s.z || 0),
          ...(s.isEmergencyBuffer !== undefined ? { isEmergencyBuffer: s.isEmergencyBuffer } : {})
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.status(200).json({
      success: true,
      layout,
      message: `Floor ${targetFloor} 3D layout & ${slotItems.length} parking slots synchronized across the system!`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLayoutByFloor,
  saveLayout,
};
