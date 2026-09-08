const AIScore = require('../models/AIScore');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');

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

    const scored = allSlots.map((slot) => {
      let score = 50;
      const reasons = [];

      if (slot.floor === 1) { score += 15; reasons.push('Ground floor'); }
      if (Number(preferredFloor) === slot.floor) { score += 10; reasons.push('Preferred floor'); }
      if (slot.zone === preferredZone) { score += 10; reasons.push('Preferred zone'); }

      if (slot.status === 'ev' && hasEV === 'true') { score += 20; reasons.push('EV charging available'); }
      if (slot.status === 'vip' && isVIP === 'true') { score += 20; reasons.push('VIP slot'); }
      if (slot.status === 'disabled' && needsAccessible === 'true') { score += 25; reasons.push('Accessible'); }

      const distToEntrance = calculateDistance(slot.x || 0, slot.z || 0, 0, -5.5);
      if (distToEntrance < 5) { score += 15; reasons.push('Near entrance'); }

      if (currentHour >= 8 && currentHour <= 18) { score += 10; reasons.push('Peak hour slot'); }

      const recentlyBooked = recentBookings.filter((b) => b.slotId?.toString() === slot._id.toString());
      if (recentlyBooked.length > 0) score -= 10;

      score = Math.min(100, Math.max(0, score));

      return {
        slotId: slot._id,
        number: slot.number,
        score: Math.round(score),
        reasons: reasons.slice(0, 3),
        confidence: Math.round((0.7 + Math.random() * 0.2) * 100) / 100,
        floor: slot.floor,
        x: slot.x,
        z: slot.z,
        status: slot.status,
        price: slot.pricePerHour || 0,
      };
    });

    scored.sort((a, b) => b.score - a.score);

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
      .filter((b) => b.slotId)
      .slice(0, 100)
      .map((b) => ({
        x: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8,
        intensity: 0.3 + Math.random() * 0.7,
        label: b.slotNumber || '',
      }));

    res.json({
      totalBookings,
      activeBookings,
      revenue: Math.round(revenue),
      occupancyRate: totalSlots > 0 ? activeBookings / totalSlots : 0,
      avgDuration: Math.round(avgDuration * 10) / 10,
      peakHours,
      occupancyForecast,
      heatmapData,
    });
  } catch (err) {
    console.error('Analytics error:', err.message);
    res.status(500).json({ success: false, message: 'Analytics failed', error: err.message });
  }
};

exports.searchSlots = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, results: [] });

    const regex = new RegExp(q, 'i');
    const slots = await ParkingSlot.find({
      $or: [
        { number: regex },
        { zone: regex },
        { features: regex },
        { status: regex },
      ],
    }).lean();

    const results = slots.map((slot) => ({
      id: slot._id,
      number: slot.number,
      floor: slot.floor,
      status: ['available', 'ai-recommended'].includes(slot.status) ? 'available' : slot.status,
      distance: Math.round(calculateDistance(slot.x || 0, slot.z || 0, 0, -5.5)),
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
