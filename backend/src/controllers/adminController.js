const User = require('../models/User');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const { logAudit } = require('../utils/auditLogger');

const getDashboardStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [totalSlots, occupiedSlots, availableSlots, reservedSlots, maintenanceSlots] =
      await Promise.all([
        ParkingSlot.countDocuments(),
        ParkingSlot.countDocuments({ status: 'occupied' }),
        ParkingSlot.countDocuments({ status: 'available' }),
        ParkingSlot.countDocuments({ status: 'reserved' }),
        ParkingSlot.countDocuments({ status: 'maintenance' })
      ]);

    const todayBookings = await Booking.countDocuments({
      createdAt: { $gte: startOfToday }
    });

    const todayRevenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    const noShowCount = await Booking.countDocuments({ status: 'expired' });

    const overstayCount = await Booking.countDocuments({ overstayDuration: { $gt: 0 } });

    // 1. Revenue data for past 7 days (day-by-day continuous mapping)
    const rawRevenue7Days = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueMap = new Map();
    rawRevenue7Days.forEach((r) => revenueMap.set(r._id, r.revenue));

    let revenueData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = `${dayNames[d.getDay()]} (${d.getDate()} ${monthNames[d.getMonth()]})`;
      const rev = revenueMap.get(dateStr) || 0;
      revenueData.push({
        date: dateStr,
        month: dayLabel,
        revenue: rev,
        amount: rev
      });
    }

    // Fallback: If past 7 days are zero but previous paid bookings exist, show recent paid days
    if (revenueData.every((d) => d.revenue === 0)) {
      const allTimeRevenue = await Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ]);
      if (allTimeRevenue.length > 0) {
        revenueData = allTimeRevenue.reverse().map((r) => {
          const parsed = new Date(r._id);
          const label = !isNaN(parsed.getTime())
            ? `${dayNames[parsed.getDay()]} (${parsed.getDate()} ${monthNames[parsed.getMonth()]})`
            : r._id;
          return {
            date: r._id,
            month: label,
            revenue: r.revenue,
            amount: r.revenue
          };
        });
      }
    }

    // 2. Usage / Category distribution
    const slotCategoryCounts = await ParkingSlot.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const categoryColors = {
      'four-wheeler': '#06b6d4',
      'two-wheeler': '#ec4899',
      'ev': '#10b981',
      'disabled': '#f97316',
      'vip': '#a855f7'
    };
    const categoryLabels = {
      'four-wheeler': '4-Wheeler',
      'two-wheeler': '2-Wheeler',
      'ev': 'EV Charging',
      'disabled': 'Accessible',
      'vip': 'VIP'
    };

    const usageData = slotCategoryCounts.map((sc, idx) => ({
      name: categoryLabels[sc._id] || sc._id,
      category: sc._id,
      value: sc.count,
      count: sc.count,
      color: categoryColors[sc._id] || ['#06b6d4', '#ec4899', '#10b981', '#f97316'][idx % 4]
    }));

    // 3. Peak hours distribution
    const rawPeakHours = await Booking.aggregate([
      {
        $project: {
          hour: {
            $hour: {
              $ifNull: ['$entryTime', '$startTime', '$createdAt']
            }
          }
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const peakMap = new Map();
    rawPeakHours.forEach((p) => peakMap.set(p._id, p.count));

    const standardHours = [6, 8, 10, 12, 14, 16, 18, 20, 22];
    const peakHoursData = standardHours.map((hr) => {
      const label = hr < 12 ? `${hr} AM` : hr === 12 ? '12 PM' : `${hr - 12} PM`;
      return {
        hour: label,
        bookings: peakMap.get(hr) || 0,
        count: peakMap.get(hr) || 0
      };
    });

    // 4. Recent Activity
    const recentBookingsRaw = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('user', 'name email')
      .populate('slot', 'number category floor');

    const recentActivity = recentBookingsRaw.map((b) => {
      const userName = b.user?.name || b.user?.email || b.vehicleNumber || 'Guest Driver';
      const slotNum = b.slot?.number ? `Slot ${b.slot.number}` : 'Parking Bay';
      let action = 'New booking created';
      if (b.status === 'completed') action = `Completed parking at ${slotNum}`;
      else if (b.status === 'active') action = `Vehicle parked in ${slotNum}`;
      else if (b.status === 'cancelled') action = `Booking cancelled for ${slotNum}`;
      else if (b.status === 'expired') action = `Booking expired (no-show)`;

      const timeDiffMs = Date.now() - new Date(b.createdAt).getTime();
      const mins = Math.floor(timeDiffMs / (1000 * 60));
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      let timeStr = 'Just now';
      if (days > 0) timeStr = `${days}d ago`;
      else if (hours > 0) timeStr = `${hours}h ago`;
      else if (mins > 0) timeStr = `${mins}m ago`;

      return {
        id: String(b._id),
        action,
        user: userName,
        vehicleNumber: b.vehicleNumber || '—',
        time: timeStr,
        timestamp: b.createdAt,
        type: (b.status || 'Active').toUpperCase(),
        amount: b.amount || 0
      };
    });

    res.status(200).json({
      success: true,
      stats: {
        totalSlots,
        occupiedSlots,
        availableSlots,
        reservedSlots,
        maintenanceSlots,
        // Frontend compatibility aliases:
        occupied: occupiedSlots,
        available: availableSlots,
        reserved: reservedSlots,
        todayBookings,
        todayRevenue,
        noShowCount,
        overstayCount,
        recentBookings: recentBookingsRaw,
        revenueData,
        usageData,
        peakHoursData,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, email, phone, role, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, role, isActive },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await logAudit(req, {
      action: 'User Updated',
      details: `${user.email} updated by admin (${Object.keys({ name, email, phone, role, isActive }).filter((k) => ({ name, email, phone, role, isActive })[k] !== undefined).join(', ')})`,
      actionType: 'user_update',
    });
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const deletedEmail = user.email;

    await Promise.all([
      Booking.deleteMany({ user: user._id }),
      Notification.deleteMany({ user: user._id })
    ]);
    await User.findByIdAndDelete(user._id);

    await logAudit(req, {
      action: 'User Deleted',
      details: `${deletedEmail} and all associated bookings were deleted by admin`,
      actionType: 'user_delete',
      userId: undefined,
    });

    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchStage = { paymentStatus: 'paid' };
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);
    if (Object.keys(dateFilter).length) matchStage.createdAt = dateFilter;

    const dailyData = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', amount: 1, count: 1 } }
    ]);

    const categoryData = await Booking.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'parkingslots',
          localField: 'slot',
          foreignField: '_id',
          as: 'slotInfo'
        }
      },
      { $unwind: '$slotInfo' },
      {
        $group: {
          _id: '$slotInfo.category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $project: { _id: 0, name: '$_id', category: '$_id', value: '$amount', amount: '$amount', count: 1 } }
    ]);

    const totalRevenue = dailyData.reduce((sum, d) => sum + d.amount, 0);
    const averageDaily = dailyData.length > 0 ? totalRevenue / dailyData.length : 0;
    const highestDay = dailyData.length > 0
      ? dailyData.reduce((max, d) => d.amount > max.amount ? d : max)
      : null;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRevenueResult = await Booking.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const todayRevenue = todayRevenueResult[0]?.total || 0;

    const monthlyData = dailyData.map((d) => ({
      month: d.date,
      date: d.date,
      amount: d.amount,
      revenue: d.amount,
      count: d.count
    }));

    res.status(200).json({
      success: true,
      revenue: {
        totalRevenue,
        monthlyRevenue: totalRevenue,
        todayRevenue,
        total: totalRevenue,
        monthly: totalRevenue,
        today: todayRevenue,
        averageDaily,
        highestDay,
        dailyData,
        monthlyData,
        categoryData,
        paymentData: dailyData
      },
      totalRevenue,
      monthlyRevenue: totalRevenue,
      todayRevenue,
      averageDaily,
      highestDay,
      dailyData,
      monthlyData,
      categoryData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const matchStage = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const rawPeakHours = await Booking.aggregate([
      { $match: matchStage },
      {
        $project: {
          hour: {
            $hour: {
              $ifNull: ['$entryTime', '$startTime', '$createdAt']
            }
          }
        }
      },
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const peakHours = rawPeakHours.map((p) => {
      const hr = p._id;
      const label = hr < 12 ? `${hr} AM` : hr === 12 ? '12 PM' : `${hr - 12} PM`;
      return {
        hour: label,
        rawHour: hr,
        count: p.count,
        bookings: p.count
      };
    });

    const categoryDistribution = await Booking.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'parkingslots',
          localField: 'slot',
          foreignField: '_id',
          as: 'slotInfo'
        }
      },
      { $unwind: '$slotInfo' },
      { $group: { _id: '$slotInfo.category', count: { $sum: 1 } } },
      { $project: { _id: 0, name: '$_id', category: '$_id', count: 1, value: '$count' } }
    ]);

    const bookingTrend = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', count: 1 } }
    ]);

    const avgDurationResult = await Booking.aggregate([
      { $match: { ...matchStage, duration: { $ne: null } } },
      { $group: { _id: null, avg: { $avg: '$duration' } } }
    ]);
    const avgDuration = avgDurationResult[0]?.avg || 0;

    const totalCount = await Booking.countDocuments(matchStage);
    const noShowCount = await Booking.countDocuments({ ...matchStage, status: 'expired' });
    const noShowRate = totalCount > 0 ? (noShowCount / totalCount) * 100 : 0;

    res.status(200).json({
      success: true,
      analytics: {
        peakHours,
        categoryDistribution,
        vehicleDistribution: categoryDistribution,
        bookingTrend,
        avgDuration,
        averageDuration: categoryDistribution.map(c => ({ category: c.name || c.category, duration: avgDuration || 2 })),
        noShowRate
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getNoShowReport = async (req, res) => {
  try {
    const bookings = await Booking.find({ status: 'expired' })
      .populate('user', 'name')
      .populate('slot', 'number');

    const count = bookings.length;
    const total = await Booking.countDocuments();
    const percentage = total > 0 ? (count / total) * 100 : 0;

    res.status(200).json({ success: true, count, percentage, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getOverstayReport = async (req, res) => {
  try {
    const bookings = await Booking.find({ overstayDuration: { $gt: 0 } })
      .populate('user', 'name')
      .populate('slot', 'number');

    const count = bookings.length;

    const totalPenaltyResult = await Booking.aggregate([
      { $match: { overstayDuration: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$overstayPenalty' } } }
    ]);
    const totalPenalty = totalPenaltyResult[0]?.total || 0;

    const avgOverstayResult = await Booking.aggregate([
      { $match: { overstayDuration: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$overstayDuration' } } }
    ]);
    const avgOverstay = avgOverstayResult[0]?.avg || 0;

    res.status(200).json({ success: true, count, totalPenalty, avgOverstay, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updatePricing = async (req, res) => {
  try {
    const { category, pricePerHour, pricePerDay, pricePerMonth } = req.body;
    const updateFields = {};
    if (pricePerHour !== undefined) updateFields.pricePerHour = pricePerHour;
    if (pricePerDay !== undefined) updateFields.pricePerDay = pricePerDay;
    if (pricePerMonth !== undefined) updateFields.pricePerMonth = pricePerMonth;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No pricing fields provided' });
    }

    const result = await ParkingSlot.updateMany({ category }, updateFields);

    await logAudit(req, {
      action: 'Pricing Updated',
      details: `Category "${category}" updated: ${Object.entries(updateFields).map(([k, v]) => `${k}=₹${v}`).join(', ')}`,
      actionType: 'pricing_update',
    });

    res.status(200).json({
      success: true,
      message: 'Pricing updated',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    let query = Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('slot', 'number category floor')
      .sort({ createdAt: -1 });

    const bookings = await query.lean();

    // Search across booking id, vehicle number, user name/email and slot number
    const results = search
      ? bookings.filter((b) => {
          const q = String(search).toLowerCase();
          return (
            String(b._id).toLowerCase().includes(q) ||
            String(b.vehicleNumber || '').toLowerCase().includes(q) ||
            String(b.user?.name || '').toLowerCase().includes(q) ||
            String(b.user?.email || '').toLowerCase().includes(q) ||
            String(b.slot?.number || '').toLowerCase().includes(q)
          );
        })
      : bookings;

    res.status(200).json({ success: true, count: results.length, bookings: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);
    const rawLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit).lean();

    const now = Date.now();
    const logs = rawLogs.map((l) => ({
      id: String(l._id),
      timestamp: l.createdAt,
      user: l.user,
      action: l.action,
      details: l.details,
      ipAddress: l.ipAddress,
      actionType: l.actionType,
      // "live" just flags very recent entries so the UI's pulsing-dot indicator still means something real
      live: now - new Date(l.createdAt).getTime() < 30000,
    }));

    res.status(200).json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getWaitingList = async (req, res) => {
  try {
    res.status(200).json({ success: true, waitingList: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const { runFullSystemRecovery, getRecoveryDiagnostics } = require('../services/recoveryService');

const triggerSystemRecovery = async (req, res) => {
  try {
    const result = await runFullSystemRecovery(req);
    await logAudit(req, {
      action: 'Manual Recovery Sweep',
      details: `Admin triggered recovery sweep: ${result.recoveredOrphanedSlots} orphaned slots recovered, ${result.recoveredPending} expired holds freed`,
      actionType: 'security',
    });
    res.status(200).json({ success: true, message: 'Recovery sweep executed successfully', ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRecoveryStatus = async (req, res) => {
  try {
    const diagnostics = await getRecoveryDiagnostics();
    res.status(200).json({ success: true, diagnostics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportBackupSnapshot = async (req, res) => {
  try {
    const [users, slots, bookings, auditLogs, notifications] = await Promise.all([
      User.find().select('-password -twoFactorSecret -twoFactorTempSecret').lean(),
      ParkingSlot.find().lean(),
      Booking.find().lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(1000).lean(),
      Notification.find().sort({ createdAt: -1 }).limit(500).lean()
    ]);

    const backupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      system: 'ParkSmart',
      metadata: {
        usersCount: users.length,
        slotsCount: slots.length,
        bookingsCount: bookings.length,
        auditLogsCount: auditLogs.length,
        notificationsCount: notifications.length
      },
      data: {
        users,
        slots,
        bookings,
        auditLogs,
        notifications
      }
    };

    await logAudit(req, {
      action: 'Database Backup Export',
      details: `Admin exported database snapshot (${users.length} users, ${slots.length} slots, ${bookings.length} bookings)`,
      actionType: 'security',
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=parksmart-backup-${Date.now()}.json`);
    res.status(200).send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllBookings,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getRevenueReport,
  getAnalytics,
  getNoShowReport,
  getOverstayReport,
  updatePricing,
  getAuditLogs,
  getWaitingList,
  triggerSystemRecovery,
  getRecoveryStatus,
  exportBackupSnapshot
};

