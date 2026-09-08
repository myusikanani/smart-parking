const ParkingSlot = require('../models/ParkingSlot');
const { logAudit } = require('../utils/auditLogger');

const allowedStatuses = ['available', 'occupied', 'reserved', 'maintenance'];

exports.getSlots = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.floor) filter.floor = req.query.floor;
    if (req.query.status) filter.status = req.query.status;

    const slots = await ParkingSlot.find(filter).sort({ floor: 1, number: 1 });
    res.status(200).json({ success: true, count: slots.length, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSlotById = async (req, res) => {
  try {
    const slot = await ParkingSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    res.status(200).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createSlot = async (req, res) => {
  try {
    const { number } = req.body;
    const existing = await ParkingSlot.findOne({ number });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slot number already exists' });
    }
    const slot = await ParkingSlot.create(req.body);
    res.status(201).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    await logAudit(req, {
      action: 'Slot Updated',
      details: `Slot ${slot.number} updated (${Object.keys(req.body).join(', ')})`,
      actionType: 'slot_change',
    });
    res.status(200).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteSlot = async (req, res) => {
  try {
    const slot = await ParkingSlot.findByIdAndDelete(req.params.id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    res.status(200).json({ success: true, message: 'Slot deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAvailableSlots = async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.floor) filter.floor = req.query.floor;

    const startTime = req.query.startTime ? new Date(String(req.query.startTime)) : null;
    const endTime = req.query.endTime ? new Date(String(req.query.endTime)) : null;
    const hasWindow = startTime && endTime && !isNaN(startTime.getTime()) && !isNaN(endTime.getTime()) && endTime > startTime;

    if (!hasWindow) {
      // Legacy behaviour: physical real-time availability
      filter.status = 'available';
      const slots = await ParkingSlot.find(filter).sort({ floor: 1, number: 1 });
      return res.status(200).json({ success: true, count: slots.length, slots });
    }

    // Time-window aware availability: a slot is bookable for the requested
    // window when it is not under maintenance and no live booking overlaps it.
    filter.status = { $ne: 'maintenance' };
    const allSlots = await ParkingSlot.find(filter).sort({ floor: 1, number: 1 });

    const overlappingBookings = await require('../models/Booking').find({
      slot: { $in: allSlots.map((s) => s._id) },
      status: { $in: ['pending', 'confirmed', 'active'] },
      $or: [
        { status: { $ne: 'pending' } },
        { reservationExpiresAt: { $exists: false } },
        { reservationExpiresAt: { $gt: new Date() } }
      ],
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    }).select('slot');

    const blockedSlotIds = new Set(overlappingBookings.map((b) => String(b.slot)));
    const slots = allSlots.filter((s) => !blockedSlotIds.has(String(s._id)));

    res.status(200).json({ success: true, count: slots.length, slots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.bulkUpdateLayout = async (req, res) => {
  try {
    const { slots } = req.body;
    if (!Array.isArray(slots) || slots.length === 0) {
      return res.status(400).json({ success: false, message: 'Slots array required' });
    }

    const results = [];
    for (const item of slots) {
      const updateData = {};
      if (item.number) updateData.number = item.number;
      if (item.zone !== undefined) updateData.zone = item.zone;
      if (item.x !== undefined) updateData.x = item.x;
      if (item.z !== undefined) updateData.z = item.z;
      if (item.floor !== undefined) updateData.floor = item.floor;
      if (item.status) updateData.status = item.status;
      if (item.category) updateData.category = item.category;
      if (item.pricePerHour !== undefined) updateData.pricePerHour = item.pricePerHour;
      if (item.features) updateData.features = item.features;

      const { _id: id, ...rest } = item;
      const idToUse = item._id || item.id;

      if (idToUse) {
        const updated = await ParkingSlot.findByIdAndUpdate(idToUse, updateData, { new: true });
        if (updated) results.push(updated);
      } else if (item.number) {
        const existing = await ParkingSlot.findOne({ number: item.number });
        if (existing) {
          const updated = await ParkingSlot.findByIdAndUpdate(existing._id, updateData, { new: true });
          if (updated) results.push(updated);
        } else {
          const created = await ParkingSlot.create({ ...updateData, number: item.number });
          results.push(created);
        }
      }
    }

    res.json({ success: true, count: results.length, slots: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSlotStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const slot = await ParkingSlot.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }
    res.status(200).json({ success: true, slot });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
