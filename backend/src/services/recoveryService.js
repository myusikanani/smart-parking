const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { emitSlotUpdate, emitBookingUpdate } = require('../utils/socket');
const { sendSMSAlert } = require('../utils/smsService');
const { logAudit } = require('../utils/auditLogger');

/**
 * Recovers pending reservations that were abandoned or timed out (>10 min hold)
 */
const recoverExpiredPendingReservations = async () => {
  const now = new Date();
  const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const expiredPending = await Booking.find({
    status: 'pending',
    $or: [
      { reservationExpiresAt: { $lte: now } },
      { createdAt: { $lte: tenMinsAgo } }
    ]
  }).populate('slot');

  let count = 0;
  for (const booking of expiredPending) {
    booking.status = 'expired';
    booking.paymentStatus = 'failed';
    await booking.save();

    const slotId = booking.slot?._id || booking.slot;
    if (slotId) {
      await ParkingSlot.findByIdAndUpdate(slotId, { status: 'available' });
      emitSlotUpdate({ slotId, status: 'available' });
    }

    emitBookingUpdate({ bookingId: booking._id, status: 'expired' });
    count++;
    console.log(`⏱️ [AUTO-RECOVERY] Auto-recovered expired pending booking ${booking._id}`);
  }

  return count;
};

/**
 * Identifies and self-heals orphaned slot locks (slots marked occupied/reserved with no active booking)
 */
const recoverOrphanedSlots = async (req = null) => {
  const lockedSlots = await ParkingSlot.find({
    status: { $in: ['occupied', 'reserved'] }
  });

  const recoveredSlotNumbers = [];

  for (const slot of lockedSlots) {
    // Check if there is an active/confirmed/pending booking for this slot right now
    const activeBooking = await Booking.findOne({
      slot: slot._id,
      status: { $in: ['active', 'confirmed', 'pending'] }
    });

    if (!activeBooking) {
      // Slot is locked but has NO valid active booking — orphaned state!
      slot.status = 'available';
      await slot.save();
      emitSlotUpdate({ slotId: slot._id, status: 'available' });
      recoveredSlotNumbers.push(slot.number);
      console.log(`🛠️ [AUTO-RECOVERY] Auto-recovered orphaned slot ${slot.number} -> set to 'available'`);

      if (req) {
        await logAudit(req, {
          action: 'Orphaned Slot Recovered',
          details: `Self-healed orphaned lock on slot ${slot.number}`,
          actionType: 'slot_change',
        });
      }
    }
  }

  return {
    count: recoveredSlotNumbers.length,
    slots: recoveredSlotNumbers
  };
};

/**
 * Flags overstay bookings and applies penalty notifications
 */
const recoverOverstays = async () => {
  const now = new Date();
  const overstayBookings = await Booking.find({
    status: 'active',
    endTime: { $lt: now },
    overstayFlag: { $ne: true }
  }).populate('slot');

  let count = 0;
  for (const booking of overstayBookings) {
    booking.overstayFlag = true;
    await booking.save();

    if (booking.slot) {
      await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'occupied' });
    }

    await Notification.create({
      user: booking.user,
      title: 'Parking Time Overstay Alert',
      message: `Your booked time for slot ${booking.slot?.number || ''} has ended! Overstay penalty fees apply until exit.`,
      type: 'warning'
    });

    sendSMSAlert(booking.user, `OVERSTAY ALERT: Your parking time at slot ${booking.slot?.number || ''} has expired. Please exit immediately.`);
    emitBookingUpdate({ bookingId: booking._id, overstayFlag: true });
    count++;
    console.log(`🚨 [AUTO-RECOVERY] Flagged overstay on active booking ${booking._id}`);
  }

  return count;
};

/**
 * Self-heals no-show bookings past 30 mins from start
 */
const recoverNoShows = async () => {
  const now = new Date();
  const noShowThreshold = new Date(now.getTime() - 30 * 60 * 1000);
  const noShowBookings = await Booking.find({
    status: 'confirmed',
    startTime: { $lte: noShowThreshold }
  }).populate('slot');

  let count = 0;
  for (const booking of noShowBookings) {
    booking.status = 'cancelled';
    booking.cancellationReason = 'Auto-cancelled due to No-Show (Failed to check-in within 30 minutes)';
    await booking.save();

    if (booking.slot) {
      await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'available' });
      emitSlotUpdate({ slotId: booking.slot._id, status: 'available' });
    }

    await Notification.create({
      user: booking.user,
      title: 'Booking Auto-Cancelled (No Show)',
      message: `Your booking for slot ${booking.slot?.number || ''} was cancelled as you didn't check in within 30 minutes.`,
      type: 'warning'
    });

    emitBookingUpdate({ bookingId: booking._id, status: 'cancelled' });
    count++;
    console.log(`⏰ [AUTO-RECOVERY] Auto-cancelled No-Show booking ${booking._id}`);
  }

  return count;
};

/**
 * Resets expired account lockout timers
 */
const recoverExpiredLockouts = async () => {
  const now = new Date();
  const result = await User.updateMany(
    { lockUntil: { $lte: now } },
    { $set: { lockUntil: null, failedLoginAttempts: 0 } }
  );
  return result.modifiedCount || 0;
};

/**
 * Executes a full-system self-healing sweep
 */
const runFullSystemRecovery = async (req = null) => {
  console.log('🔄 [RECOVERY ENGINE] Starting full-system recovery sweep...');
  const startTime = Date.now();

  const [expiredPending, orphanedSlots, noShows, overstays, unlockedAccounts] = await Promise.all([
    recoverExpiredPendingReservations(),
    recoverOrphanedSlots(req),
    recoverNoShows(),
    recoverOverstays(),
    recoverExpiredLockouts()
  ]);

  const durationMs = Date.now() - startTime;
  console.log(`✅ [RECOVERY ENGINE] Sweep completed in ${durationMs}ms | Pending: ${expiredPending}, Orphaned: ${orphanedSlots.count}, NoShows: ${noShows}, Overstays: ${overstays}, Unlocked: ${unlockedAccounts}`);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    durationMs,
    recoveredPending: expiredPending,
    recoveredOrphanedSlots: orphanedSlots.count,
    orphanedSlotNumbers: orphanedSlots.slots,
    cancelledNoShows: noShows,
    flaggedOverstays: overstays,
    unlockedAccounts
  };
};

/**
 * Returns real-time recovery and synchronization diagnostics
 */
const getRecoveryDiagnostics = async () => {
  const now = new Date();
  const tenMinsAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const [
    totalSlots,
    availableSlots,
    occupiedSlots,
    reservedSlots,
    maintenanceSlots,
    totalBookings,
    activeBookings,
    pendingExpiredBookings,
    lockedUsers
  ] = await Promise.all([
    ParkingSlot.countDocuments(),
    ParkingSlot.countDocuments({ status: 'available' }),
    ParkingSlot.countDocuments({ status: 'occupied' }),
    ParkingSlot.countDocuments({ status: 'reserved' }),
    ParkingSlot.countDocuments({ status: 'maintenance' }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'active' }),
    Booking.countDocuments({
      status: 'pending',
      $or: [{ reservationExpiresAt: { $lte: now } }, { createdAt: { $lte: tenMinsAgo } }]
    }),
    User.countDocuments({ lockUntil: { $gt: now } })
  ]);

  // Count orphaned slots right now
  const locked = await ParkingSlot.find({ status: { $in: ['occupied', 'reserved'] } });
  let orphanedCount = 0;
  for (const s of locked) {
    const hasBooking = await Booking.exists({
      slot: s._id,
      status: { $in: ['active', 'confirmed', 'pending'] }
    });
    if (!hasBooking) orphanedCount++;
  }

  return {
    systemHealth: orphanedCount === 0 && pendingExpiredBookings === 0 ? 'HEALTHY' : 'RECOVERY_RECOMMENDED',
    totalSlots,
    availableSlots,
    occupiedSlots,
    reservedSlots,
    maintenanceSlots,
    activeBookings,
    orphanedSlotsDetected: orphanedCount,
    stalePendingHolds: pendingExpiredBookings,
    lockedUsersCount: lockedUsers,
    totalBookings,
    lastChecked: new Date().toISOString()
  };
};

module.exports = {
  recoverExpiredPendingReservations,
  recoverOrphanedSlots,
  recoverOverstays,
  recoverNoShows,
  recoverExpiredLockouts,
  runFullSystemRecovery,
  getRecoveryDiagnostics
};
