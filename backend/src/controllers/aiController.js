const mongoose = require('mongoose');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const AIScore = require('../models/AIScore');

const calculateDistance = (x1, z1, x2, z2) =>
  Math.sqrt((x1 - x2) ** 2 + (z1 - z2) ** 2);

exports.getRecommendations = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { preferredFloor, preferredZone, hasEV, isVIP, needsAccessible } = req.query;

    const allSlots = await ParkingSlot.find({ status: { $ne: 'occupied' } }).lean();
    const occupiedCount = await ParkingSlot.countDocuments({ status: 'occupied' });
    const totalSlots = await ParkingSlot.countDocuments();
    const currentHour = new Date().getHours();

    const recentBookings = await Booking.find({
      createdAt: { $gte: new Date(Date.now() - 3600000) },
    }).lean();

    const acceptedSlotIds = userId
      ? (await AIScore.distinct('slot', { userId, wasAccepted: true })).slice(0, 10)
      : [];

    const scored = allSlots.map((slot) => {
      let score = 50;
      const reasons = [];

      if (slot.floor === 1) { score += 15; reasons.push('Ground floor'); }
      if (Number(preferredFloor) === slot.floor) { score += 10; reasons.push('Preferred floor'); }
      if (slot.zone === preferredZone) { score += 10; reasons.push('Preferred zone'); }

      if (slot.category === 'ev' && hasEV === 'true') { score += 20; reasons.push('EV charging available'); }
      if (slot.category === 'disabled' && needsAccessible === 'true') { score += 25; reasons.push('Accessible'); }

      if (slot.x !== undefined && slot.z !== undefined) {
        const distToEntrance = calculateDistance(slot.x, slot.z, 0, -5.5);
        if (distToEntrance < 5) { score += 15; reasons.push('Near entrance'); }
      }

      if (currentHour >= 8 && currentHour <= 18) { score += 10; reasons.push('Peak hour slot'); }

      const recentlyBooked = recentBookings.filter((b) => b.slot?.toString() === slot._id.toString());
      if (recentlyBooked.length > 0) score -= 10;

      if (acceptedSlotIds.some((id) => id.toString() === slot._id.toString())) {
        score += 10;
        reasons.push('You liked this spot before');
      }

      score = Math.min(100, Math.max(0, score));

      return {
        slotId: slot._id,
        number: slot.number,
        score: Math.round(score),
        reasons: reasons.slice(0, 3),
        confidence: Math.round((0.7 + Math.random() * 0.2) * 100) / 100,
        floor: slot.floor,
        x: slot.x || 0,
        z: slot.z || 0,
        status: slot.status,
        price: slot.pricePerHour || 0,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    try {
      const topScores = scored.slice(0, 10).map((s) => ({
        slot: s.slotId,
        userId,
        score: s.score,
        confidence: s.confidence,
        factors: {
          distanceToEntrance: s.x !== undefined ? Math.round(calculateDistance(s.x, s.z || 0, 0, -5.5)) : undefined,
          floor: s.floor,
          peakHour: currentHour >= 8 && currentHour <= 18,
          recentFreed: recentBookings.filter((b) => b.slot?.toString() === s.slotId.toString()).length === 0,
        },
      }));
      await AIScore.insertMany(topScores);
    } catch (err) {
      console.warn('[AI] Failed to persist scores:', err.message);
    }

    res.json({
      success: true,
      recommendations: scored.slice(0, 10),
      context: { totalSlots, occupiedCount, availability: totalSlots - occupiedCount, hour: currentHour },
    });
  } catch (err) {
    console.error('AI recommendation error:', err.message);
    res.status(500).json({ success: false, message: 'AI recommendation failed', error: err.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { range = '24h' } = req.query;
    const now = new Date();
    let startDate;

    if (range === '7d') startDate = new Date(now - 7 * 86400000);
    else if (range === '30d') startDate = new Date(now - 30 * 86400000);
    else startDate = new Date(now - 86400000);

    const bookings = await Booking.find({ createdAt: { $gte: startDate } }).lean();
    const totalSlots = await ParkingSlot.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: 'active' });

    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hourBookings = bookings.filter((b) => {
        const h = new Date(b.createdAt).getHours();
        return h === i;
      });
      return { hour: i, count: hourBookings.length };
    });

    const peakThreshold = Math.max(...hourlyData.map((h) => h.count), 1) * 0.7;
    const peakHours = hourlyData.map((h) => ({
      ...h,
      isPeak: h.count >= peakThreshold,
    }));

    const occupancyForecast = hourlyData.map((h) => ({
      hour: h.hour,
      predicted: Math.min(100, Math.round((h.count / Math.max(...hourlyData.map((x) => x.count), 1)) * 80 + 10)),
    }));

    const totalBookings = bookings.length;
    const revenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
    const durations = bookings.filter((b) => b.endTime).map((b) =>
      (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3600000
    );
    const avgDuration = durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

    const heatmapData = bookings
      .filter((b) => b.slot)
      .slice(0, 100)
      .map((b) => ({
        x: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8,
        intensity: 0.3 + Math.random() * 0.7,
        label: '',
      }));

    const aiScoresTotal = await AIScore.countDocuments();
    const aiScoresAccepted = await AIScore.countDocuments({ wasAccepted: true });
    const aiAcceptanceRate = aiScoresTotal > 0 ? Math.round((aiScoresAccepted / aiScoresTotal) * 100) : 0;

    res.json({
      totalBookings,
      activeBookings,
      revenue: Math.round(revenue),
      occupancyRate: totalSlots > 0 ? activeBookings / totalSlots : 0,
      avgDuration: Math.round(avgDuration * 10) / 10,
      peakHours,
      occupancyForecast,
      heatmapData,
      aiScoresAccepted,
      aiAcceptanceRate,
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ success: false, message: 'Analytics failed', error: err.message });
  }
};

exports.searchSlots = async (req, res) => {
  try {
    const { q, floor, category } = req.query;
    if (!q) return res.json({ success: true, results: [] });

    // Escape regex special chars to prevent malformed/abusive queries
    const escaped = String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');

    const slotFilter = { $or: [{ number: regex }, { features: regex }, { status: regex }] };
    if (floor) slotFilter.floor = parseInt(floor);
    if (category) slotFilter.category = category;

    const slots = await ParkingSlot.find(slotFilter).lean();

    // Also match active/confirmed bookings by vehicle number or booking id,
    // so security/users can locate the physical slot for a car or ticket.
    let bookingSlotIds = [];
    try {
      const bookingMatches = await Booking.find({
        $or: [
          { vehicleNumber: regex },
          { _id: mongoose.isValidObjectId(q) ? q : undefined },
        ].filter(Boolean),
        status: { $in: ['confirmed', 'active'] },
      })
        .select('slot')
        .lean();
      bookingSlotIds = bookingMatches.map((b) => b.slot).filter(Boolean);
      if (bookingSlotIds.length) {
        const extraFilter = { _id: { $in: bookingSlotIds } };
        if (floor) extraFilter.floor = parseInt(floor);
        if (category) extraFilter.category = category;
        const extraSlots = await ParkingSlot.find(extraFilter).lean();
        const seen = new Set(slots.map((s) => String(s._id)));
        for (const s of extraSlots) {
          if (!seen.has(String(s._id))) slots.push(s);
        }
      }
    } catch (err) {
      console.warn('[Search] Booking lookup skipped:', err.message);
    }

    const results = slots.map((slot) => ({
      id: slot._id,
      number: slot.number,
      floor: slot.floor,
      status: ['available', 'ai-recommended'].includes(slot.status) ? 'available' : slot.status,
      distance: slot.x !== undefined ? Math.round(calculateDistance(slot.x, slot.z || 0, 0, -5.5)) : 0,
      zone: slot.zone || 'A',
      price: slot.pricePerHour || 0,
      features: slot.features || [],
      score: Math.round(50 + Math.random() * 40),
    }));

    res.json({ success: true, results });
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ success: false, message: 'Search failed', error: err.message });
  }
};
