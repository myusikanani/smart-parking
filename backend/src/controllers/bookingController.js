const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const AIScore = require('../models/AIScore');
const Notification = require('../models/Notification');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { emitSlotUpdate, emitBookingUpdate, emitVehicleMotion } = require('../utils/socket');
const { sendBookingEmail, sendQREmail } = require('../utils/emailService');
const { logAudit } = require('../utils/auditLogger');

exports.createBooking = async (req, res) => {
  try {
    const targetSlotId = req.body.slotId || req.body.slot || req.body.slotNumber;
    const { vehicleNumber, startTime, endTime } = req.body;

    if (!targetSlotId || !vehicleNumber) {
      return res.status(400).json({ success: false, message: 'slotId and vehicleNumber are required' });
    }

    let validStartTime = startTime ? new Date(startTime) : new Date(Date.now() + 5 * 60 * 1000);
    if (isNaN(validStartTime.getTime())) {
      validStartTime = new Date(Date.now() + 5 * 60 * 1000);
    }

    let validEndTime = endTime ? new Date(endTime) : new Date(validStartTime.getTime() + 2 * 3600000);
    if (isNaN(validEndTime.getTime()) || validEndTime.getTime() <= validStartTime.getTime()) {
      validEndTime = new Date(validStartTime.getTime() + 2 * 3600000);
    }

    let slot = null;

    if (require('mongoose').connection.readyState === 1) {
      const queryId = require('mongoose').Types.ObjectId.isValid(targetSlotId) ? targetSlotId : null;
      slot = await ParkingSlot.findOne({ $or: [{ _id: queryId }, { number: targetSlotId }] });

      if (!slot) {
        return res.status(404).json({ success: false, message: 'Selected parking slot does not exist.' });
      }

      // 1. TIME-WINDOW OVERLAP CHECK: a slot is only blocked for windows that
      // genuinely overlap a live booking — never for the whole day.
      // Unpaid pending holds stop blocking once their 10-min reservation expires.
      const overlapping = await Booking.findOne({
        slot: slot._id,
        status: { $in: ['pending', 'confirmed', 'active'] },
        $or: [
          { status: { $ne: 'pending' } },
          { reservationExpiresAt: { $exists: false } },
          { reservationExpiresAt: { $gt: new Date() } }
        ],
        startTime: { $lt: validEndTime },
        endTime: { $gt: validStartTime }
      });

      if (overlapping) {
        return res.status(409).json({
          success: false,
          message: `Slot ${slot.number} is already booked between ${new Date(overlapping.startTime).toLocaleString()} and ${new Date(overlapping.endTime).toLocaleString()}. Please choose a different time or slot.`
        });
      }

      // 2. ATOMIC CHECK & RESERVATION for slots free RIGHT NOW. For future
      // windows on a currently occupied/reserved slot we skip the status flip —
      // the slot keeps its present state and the overlap check above guards
      // against double-booking.
      if (slot.status === 'available') {
        const reserved = await ParkingSlot.findOneAndUpdate(
          { _id: slot._id, status: 'available' },
          { status: 'reserved' },
          { new: true }
        );
        if (!reserved) {
          return res.status(409).json({
            success: false,
            message: 'Selected parking slot was just taken by another user. Please select a different slot.'
          });
        }
        slot = reserved;
      }
    } else {
      // Demo / Standalone fallback mode
      slot = {
        _id: targetSlotId || 'demo-slot-1',
        number: req.body.slotNumber || 'A-01',
        pricePerHour: 30,
        pricePerDay: 150,
        status: 'reserved'
      };
    }

    const duration = Math.max(1, Math.ceil((validEndTime.getTime() - validStartTime.getTime()) / 3600000));
    let amount;
    if (duration >= 24) {
      amount = (slot.pricePerDay || 150) * Math.ceil(duration / 24);
    } else {
      amount = (slot.pricePerHour || 30) * duration;
    }

    // Temporary reservation expires in 10 minutes if unpaid
    const reservationExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let booking;
    if (require('mongoose').connection.readyState === 1) {
      booking = await Booking.create({
        user: req.user.id,
        slot: slot._id,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        startTime: validStartTime.toISOString(),
        endTime: validEndTime.toISOString(),
        amount,
        status: 'pending',
        paymentStatus: 'pending',
        reservationExpiresAt,
        qrToken: null, // Secure QR generated ONLY after payment verification
        qrCode: null
      });

      await booking.populate('slot');

      emitSlotUpdate({ slotId: slot._id, status: 'reserved' });
      emitBookingUpdate({ bookingId: booking._id, status: 'pending' });

      await Notification.create({
        user: req.user.id,
        title: 'Temporary Reservation Created',
        message: `Slot ${slot.number} reserved for 10 minutes. Complete payment to confirm.`,
        type: 'booking'
      });
    } else {
      booking = {
        _id: 'bk_' + Date.now(),
        id: 'bk_' + Date.now(),
        user: req.user ? req.user.id : 'demo-user',
        slot: slot,
        slotNumber: slot.number,
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        startTime: validStartTime.toISOString(),
        endTime: validEndTime.toISOString(),
        amount,
        status: 'pending',
        paymentStatus: 'pending',
        reservationExpiresAt
      };
    }

    await logAudit(req, {
      action: 'Booking Reservation Initiated',
      details: `Slot ${slot.number} temporarily reserved for vehicle ${vehicleNumber}`,
      actionType: 'booking_create',
    });

    res.status(201).json({
      success: true,
      booking,
      message: 'Slot temporarily reserved. Complete Razorpay payment to confirm booking.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyBookings = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const bookings = await Booking.find(filter)
      .populate('slot', 'number category floor')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('slot')
      .populate('user', 'name email phone');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (
      booking.user._id.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'security'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyQR = async (req, res) => {
  try {
    const { qrToken } = req.body;

    const booking = await Booking.findOne({
      qrToken,
      status: { $in: ['confirmed', 'active'] }
    }).populate('user', 'name').populate('slot', 'number');

    if (!booking) {
      return res.status(400).json({ success: false, message: 'Invalid or expired QR code' });
    }

    res.status(200).json({
      success: true,
      booking: {
        user: booking.user,
        slot: booking.slot,
        vehicleNumber: booking.vehicleNumber
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markEntry = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Booking is not confirmed' });
    }

    booking.status = 'active';
    booking.entryTime = Date.now();
    await booking.save();

    await ParkingSlot.findByIdAndUpdate(booking.slot, { status: 'occupied' });
    emitSlotUpdate({ slotId: booking.slot, status: 'occupied' });
    emitVehicleMotion({ slotId: booking.slot, phase: 'entering' });

    await Notification.create({
      user: booking.user,
      title: 'Vehicle Entered',
      message: `Your vehicle has entered the parking.`,
      type: 'booking'
    });

    emitBookingUpdate({ bookingId: booking._id, status: 'active' });

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markExit = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('slot');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Booking is not active' });
    }

    const exitTime = Date.now();
    const actualDuration = Math.ceil((exitTime - new Date(booking.startTime)) / 3600000);
    booking.exitTime = exitTime;
    booking.duration = actualDuration;

    if (exitTime > new Date(booking.endTime)) {
      const overstayDuration = Math.ceil((exitTime - new Date(booking.endTime)) / 3600000);
      const overstayRate = parseFloat(process.env.OVERSTAY_RATE) || booking.slot.pricePerHour * 1.5;
      booking.overstayDuration = overstayDuration;
      booking.overstayPenalty = overstayDuration * overstayRate;
    }

    booking.status = 'completed';
    await booking.save();

    await ParkingSlot.findByIdAndUpdate(booking.slot._id || booking.slot, { status: 'available' });
    emitSlotUpdate({ slotId: booking.slot._id || booking.slot, status: 'available' });
    emitVehicleMotion({ slotId: booking.slot._id || booking.slot, phase: 'exiting' });

    await Notification.create({
      user: booking.user,
      title: 'Vehicle Exited',
      message: `Your vehicle has exited.`,
      type: 'booking'
    });

    emitBookingUpdate({ bookingId: booking._id, status: 'completed' });

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/bookings/:id/email-qr — email the paid booking's QR pass to the owner
exports.emailBookingQR = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('slot', 'number')
      .populate('user', 'name email');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const bookingUserId = String(booking.user?._id || booking.user);
    if (bookingUserId !== String(req.user.id || req.user._id) && !['admin', 'security'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to email this QR pass' });
    }

    // QR is generated only after successful payment verification
    if (!booking.qrCode || !booking.qrToken) {
      return res.status(400).json({ success: false, message: 'QR pass is not available yet. Complete the payment first.' });
    }

    const userEmail = booking.user?.email;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'No email address on file for this booking.' });
    }

    const sent = await sendQREmail(userEmail, {
      vehicleNumber: booking.vehicleNumber,
      slotNumber: booking.slot?.number || 'A-01',
      endTime: booking.endTime ? new Date(booking.endTime).toLocaleString() : '',
      amount: booking.amount,
      qrDataUrl: booking.qrCode
    });

    if (!sent) {
      return res.status(500).json({ success: false, message: 'Failed to send the email. Please try again later.' });
    }

    await logAudit(req, {
      action: 'QR Pass Emailed',
      details: `QR pass for booking ${booking._id} emailed to ${userEmail}`,
      actionType: 'booking_email_qr',
    });

    res.status(200).json({ success: true, message: `QR pass emailed to ${userEmail}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership check: users may only cancel their own bookings
    const bookingUserId = String(booking.user?._id || booking.user);
    if (bookingUserId !== String(req.user.id || req.user._id) && !['admin', 'security'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (!['confirmed'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    if (req.body.cancellationReason) {
      booking.cancellationReason = req.body.cancellationReason;
    }
    if (booking.paymentStatus === 'paid') {
      booking.paymentStatus = 'refunded';
    }
    await booking.save();

    await ParkingSlot.findByIdAndUpdate(booking.slot, { status: 'available' });
    emitSlotUpdate({ slotId: booking.slot, status: 'available' });

    await Notification.create({
      user: booking.user,
      title: 'Booking Cancelled',
      message: `Your booking has been cancelled.`,
      type: 'alert'
    });

    emitBookingUpdate({ bookingId: booking._id, status: 'cancelled' });

    await logAudit(req, {
      action: 'Booking Cancelled',
      details: `Booking ${booking._id} cancelled${req.body.cancellationReason ? ` — ${req.body.cancellationReason}` : ''}`,
      actionType: 'booking_cancel',
    });

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkExpiredBookings = async (req, res) => {
  try {
    const gracePeriod = parseInt(process.env.GRACE_PERIOD_MINUTES) || 15;
    const threshold = new Date(Date.now() - gracePeriod * 60 * 1000);

    const expiredBookings = await Booking.find({
      status: 'confirmed',
      startTime: { $lt: threshold }
    });

    for (const booking of expiredBookings) {
      booking.status = 'expired';
      await booking.save();
      await ParkingSlot.findByIdAndUpdate(booking.slot, { status: 'available' });
    }

    res.status(200).json({ success: true, expiredCount: expiredBookings.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWaitingList = async (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Waiting list feature active', count: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.joinWaitingList = async (req, res) => {
  try {
    const { category } = req.body;
    res.status(200).json({ success: true, message: `Added to waiting list for ${category}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDynamicQR = async (req, res) => {
  try {
    const { id } = req.params;
    const { generateDynamicQRToken } = require('../utils/dynamicQR');
    
    if (require('mongoose').connection.readyState !== 1) {
      const { token, expiresIn, rotationInterval } = generateDynamicQRToken(id || 'mock-id');
      const dynamicQrDataUrl = await qrcode.toDataURL(token);
      return res.status(200).json({
        success: true,
        dynamicToken: token,
        dynamicQrCode: dynamicQrDataUrl,
        expiresIn,
        rotationInterval
      });
    }

    const booking = await Booking.findById(id).populate('slot');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (req.user?.role === 'user' && booking.user && booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking pass' });
    }

    const { token, expiresIn, rotationInterval } = generateDynamicQRToken(booking._id.toString());
    const dynamicQrDataUrl = await qrcode.toDataURL(token);

    res.status(200).json({
      success: true,
      dynamicToken: token,
      dynamicQrCode: dynamicQrDataUrl,
      expiresIn,
      rotationInterval,
      booking: {
        id: booking._id,
        vehicleNumber: booking.vehicleNumber,
        slotNumber: booking.slot?.number || 'A-01',
        status: booking.status,
        startTime: booking.startTime,
        endTime: booking.endTime
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

