const cron = require('node-cron');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const Notification = require('../models/Notification');
const { emitSlotUpdate, emitBookingUpdate } = require('../utils/socket');
const { sendSMSAlert } = require('../utils/smsService');

const initCronJobs = () => {
  // Run every 2 minutes for timely checking
  cron.schedule('*/2 * * * *', async () => {
    try {
      const now = new Date();

      // 0. Process Expired Pending Reservations (older than 10 minutes or past reservationExpiresAt)
      const expiredPending = await Booking.find({
        status: 'pending',
        $or: [
          { reservationExpiresAt: { $lte: now } },
          { createdAt: { $lte: new Date(now.getTime() - 10 * 60 * 1000) } }
        ]
      }).populate('slot');

      for (const booking of expiredPending) {
        booking.status = 'expired';
        booking.paymentStatus = 'failed';
        await booking.save();

        if (booking.slot) {
          await ParkingSlot.findByIdAndUpdate(booking.slot._id || booking.slot, { status: 'available' });
          emitSlotUpdate({ slotId: booking.slot._id || booking.slot, status: 'available' });
        }

        emitBookingUpdate({ bookingId: booking._id, status: 'expired' });
        console.log(`⏱️ [CRON JOB] Auto-expired unpaid pending reservation ${booking._id}`);
      }

      // 1. Process No-Shows: Bookings confirmed where start time was > 30 mins ago and user hasn't checked in (status still 'confirmed')
      const noShowThreshold = new Date(now.getTime() - 30 * 60 * 1000);
      const noShowBookings = await Booking.find({
        status: 'confirmed',
        startTime: { $lte: noShowThreshold }
      }).populate('slot');

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
        console.log(`⏰ [CRON JOB] Auto-cancelled No-Show booking ${booking._id}`);
      }

      // 2. Process Overstays: Active bookings where endTime has passed
      const overstayBookings = await Booking.find({
        status: 'active',
        endTime: { $lt: now },
        overstayFlag: { $ne: true }
      }).populate('slot');

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
        console.log(`🚨 [CRON JOB] Flagged overstay on booking ${booking._id}`);
      }
    } catch (error) {
      console.error('Error running cron job:', error);
    }
  });

  console.log('⏱️ Background Cron Jobs initialized (No-Show & Overstay auto-processing)');
};

module.exports = { initCronJobs };
