const Layout = require('../models/Layout');

// Get Layout for a specific floor
const getLayoutByFloor = async (req, res) => {
  try {
    const floor = parseInt(req.params.floor) || 1;
    let layout = await Layout.findOne({ floor });

    if (!layout) {
      // Create default layout if none exists for floor
      layout = await Layout.create({
        name: `Campus Parking Floor ${floor}`,
        floor,
        items: [
          { id: 'ent-1', type: 'entrance', x: -12, y: 0, z: 0, rotation: 0 },
          { id: 'exit-1', type: 'exit', x: 12, y: 0, z: 0, rotation: 0 },
          { id: 'lane-1', type: 'lane', x: 0, y: 0, z: 0, width: 24, length: 3 },
          { id: 'slot-a1', type: 'slot', slotNumber: 'A-01', category: 'four-wheeler', x: -8, y: 0, z: -5, rotation: 0 },
          { id: 'slot-a2', type: 'slot', slotNumber: 'A-02', category: 'four-wheeler', x: -4, y: 0, z: -5, rotation: 0 },
          { id: 'slot-a3', type: 'slot', slotNumber: 'A-03', category: 'ev', x: 0, y: 0, z: -5, rotation: 0 },
          { id: 'slot-a4', type: 'slot', slotNumber: 'A-04', category: 'vip', x: 4, y: 0, z: -5, rotation: 0 },
          { id: 'slot-a5', type: 'slot', slotNumber: 'A-05', category: 'disabled', x: 8, y: 0, z: -5, rotation: 0 },
        ],
      });
    }

    res.status(200).json({ success: true, layout });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Save / Update Layout
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

    res.status(200).json({ success: true, layout, message: '3D Parking Layout saved successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLayoutByFloor,
  saveLayout,
};
