const ParkingSlot = require('../models/ParkingSlot');
const Layout = require('../models/Layout');
const ParkingLocation = require('../models/ParkingLocation');

// Get Layout for a specific floor & location (dynamically built from live MongoDB slots if no custom layout exists)
const getLayoutByFloor = async (req, res) => {
  try {
    const floor = parseInt(req.params.floor) || 1;
    const locationId = req.query.locationId && req.query.locationId !== 'all' ? req.query.locationId : null;

    const query = { floor };
    if (locationId) {
      query.locationId = locationId;
    }

    let layout = await Layout.findOne(query);

    if (!layout || !Array.isArray(layout.items) || layout.items.length === 0) {
      // Find real slots from database for this floor & location
      const slotQuery = { floor };
      if (locationId) {
        slotQuery.locationId = locationId;
      }

      const dbSlots = await ParkingSlot.find(slotQuery).sort({ number: 1 });

      const items = [
        { id: `ent-${floor}`, type: 'entrance', x: -14, y: 0, z: 0, rotation: 0 },
        { id: `exit-${floor}`, type: 'exit', x: 14, y: 0, z: 0, rotation: 0 },
        { id: `lane-${floor}`, type: 'lane', x: 0, y: 0, z: 0, width: 28, length: 3 },
      ];

      dbSlots.forEach((s, idx) => {
        const isTopRow = idx % 2 === 0;
        const col = Math.floor(idx / 2);
        const defaultX = col * 4 - 10;
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

      let locationName = 'Campus Parking';
      if (locationId) {
        const locDoc = await ParkingLocation.findById(locationId).select('name');
        if (locDoc) locationName = locDoc.name;
      }

      layout = {
        name: `${locationName} Floor ${floor}`,
        locationId: locationId || undefined,
        floor,
        items,
      };
    } else {
      // If layout exists, enrich slot items with live status from ParkingSlot collection
      const slotQuery = { floor };
      if (locationId) slotQuery.locationId = locationId;

      const dbSlots = await ParkingSlot.find(slotQuery).lean();
      const slotStatusMap = new Map();
      dbSlots.forEach((s) => slotStatusMap.set(s.number, s.status));

      layout.items = layout.items.map((item) => {
        if (item.type === 'slot' && item.slotNumber && slotStatusMap.has(item.slotNumber)) {
          const itemObj = typeof item.toObject === 'function' ? item.toObject() : item;
          return {
            ...itemObj,
            status: slotStatusMap.get(item.slotNumber),
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
    const { floor, items, name, locationId } = req.body;
    const targetFloor = parseInt(floor) || 1;

    const query = { floor: targetFloor };
    if (locationId) query.locationId = locationId;

    let layout = await Layout.findOne(query);
    if (layout) {
      layout.items = items;
      if (name) layout.name = name;
      if (locationId) layout.locationId = locationId;
      await layout.save();
    } else {
      layout = await Layout.create({
        name: name || `Parking Floor ${targetFloor}`,
        locationId: locationId || undefined,
        floor: targetFloor,
        items,
      });
    }

    let locInfo = null;
    if (locationId) {
      locInfo = await ParkingLocation.findById(locationId);
    }

    // Auto-sync real slots in database: update coordinates (x, z) or create new slots
    const slotItems = Array.isArray(items) ? items.filter((it) => it.type === 'slot') : [];
    for (const s of slotItems) {
      if (!s.slotNumber) continue;
      const cat = ['two-wheeler', 'four-wheeler', 'ev', 'disabled'].includes(s.category)
        ? s.category
        : s.category === 'vip'
        ? 'four-wheeler'
        : 'four-wheeler';

      const defaultPrice =
        cat === 'two-wheeler' ? 15 : cat === 'ev' ? 40 : s.category === 'vip' ? 50 : cat === 'disabled' ? 20 : 30;

      const slotQuery = { number: s.slotNumber };
      if (locationId) slotQuery.locationId = locationId;

      await ParkingSlot.findOneAndUpdate(
        slotQuery,
        {
          $set: {
            number: s.slotNumber,
            floor: targetFloor,
            category: cat,
            x: Number(s.x || 0),
            z: Number(s.z || 0),
            ...(locationId ? { locationId } : {}),
            ...(locInfo ? { location: `${locInfo.name} (${locInfo.area})` } : {}),
            ...(s.isEmergencyBuffer !== undefined ? { isEmergencyBuffer: s.isEmergencyBuffer } : {}),
          },
          $setOnInsert: {
            status: 'available',
            pricePerHour: defaultPrice,
            pricePerDay: defaultPrice * 6,
            pricePerMonth: defaultPrice * 100,
            location: locInfo ? `${locInfo.name} (${locInfo.area})` : 'City Center Hub (Downtown)',
            zone: 'A',
            features: cat === 'ev' ? ['ev-charging', 'cctv'] : ['cctv', 'covered'],
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    res.status(200).json({
      success: true,
      layout,
      message: `Floor ${targetFloor} 3D layout & ${slotItems.length} parking slots synchronized in database!`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getLayoutByFloor,
  saveLayout,
};
