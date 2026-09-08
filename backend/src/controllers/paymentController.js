const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const crypto = require('crypto');
const Razorpay = require('razorpay');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const Notification = require('../models/Notification');
const { emitSlotUpdate, emitBookingUpdate, emitVehicleMotion } = require('../utils/socket');
const { sendBookingEmail } = require('../utils/emailService');
const { logAudit } = require('../utils/auditLogger');

let razorpayInstance = null;
function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

// POST /api/payments/create-order  { bookingId, type?: 'booking' | 'penalty' }
exports.createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const type = req.body.type === 'penalty' ? 'penalty' : 'booking';
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    let booking = null;
    if (require('mongoose').connection.readyState === 1) {
      booking = await Booking.findById(bookingId).populate('slot');
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      const bookingUserId = String(booking.user._id || booking.user);
      const reqUserId = String(req.user.id || req.user._id);
      if (bookingUserId !== reqUserId && req.user.role === 'user') {
        return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
      }

      if (type === 'penalty') {
        // Overstay penalty order: booking must be awaiting penalty collection
        if (booking.status !== 'active' || booking.penaltyPaymentStatus !== 'pending') {
          return res.status(400).json({ success: false, message: 'No overstay penalty is pending for this booking' });
        }
        if (!(booking.overstayPenalty > 0)) {
          return res.status(400).json({ success: false, message: 'Overstay penalty amount is zero' });
        }
      } else {
        if (booking.paymentStatus === 'paid') {
          return res.status(400).json({ success: false, message: 'This booking has already been paid for.' });
        }
        if (booking.status === 'expired') {
          return res.status(400).json({ success: false, message: 'This booking reservation has expired (10-minute hold timed out). Please select a slot to create a new booking.' });
        }
        if (booking.status === 'cancelled') {
          return res.status(400).json({ success: false, message: 'This booking was cancelled. Please select a slot to create a new booking.' });
        }
        if (booking.status !== 'pending') {
          return res.status(400).json({ success: false, message: 'This booking is no longer awaiting payment. Please book a new slot.' });
        }
      }
    } else {
      booking = {
        _id: bookingId,
        amount: 60,
        paymentStatus: 'pending'
      };
    }

    let payableAmount = type === 'penalty' ? booking.overstayPenalty : booking.amount;
    if (!payableAmount || payableAmount <= 0) {
      const pricePerHour = (booking.slot && booking.slot.pricePerHour) ? booking.slot.pricePerHour : 30;
      let durationHours = 1;
      if (booking.startTime && booking.endTime) {
        durationHours = Math.max(1, Math.ceil((new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / 3600000));
      }
      payableAmount = pricePerHour * durationHours;
      booking.amount = payableAmount;
      if (require('mongoose').connection.readyState === 1 && booking.save) {
        await booking.save();
      }
    }
    const amountInPaise = Math.round(payableAmount * 100);
    const razorpay = getRazorpay();

    if (razorpay) {
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `${type}_${booking._id}`,
        notes: { bookingId: String(booking._id), type },
      });

      if (require('mongoose').connection.readyState === 1) {
        if (type === 'penalty') {
          booking.penaltyOrderId = order.id;
        } else {
          booking.razorpayOrderId = order.id;
        }
        await booking.save();
      }

      return res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        isTestMode: false
      });
    }

    // Razorpay Test / Demo Fallback Mode when keys are not set in .env
    const testOrderId = `order_test_${Date.now()}`;
    if (require('mongoose').connection.readyState === 1) {
      if (type === 'penalty') {
        booking.penaltyOrderId = testOrderId;
      } else {
        booking.razorpayOrderId = testOrderId;
      }
      await booking.save();
    }

    res.status(200).json({
      success: true,
      orderId: testOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_parksmart',
      isTestMode: true,
      message: 'Razorpay Test Mode Active. Click to simulate Razorpay payment.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/payments/verify  { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature, type?: 'booking' | 'penalty' }
exports.verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const type = req.body.type === 'penalty' ? 'penalty' : 'booking';

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    if (require('mongoose').connection.readyState === 1) {
      const booking = await Booking.findById(bookingId).populate('slot').populate('user');
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      // Ownership check: users may only pay for their own bookings.
      // Security staff may collect the overstay penalty at the gate.
      const bookingUserId = String(booking.user?._id || booking.user);
      const isStaff = ['admin', 'security'].includes(req.user.role);
      if (bookingUserId !== String(req.user.id || req.user._id) && !isStaff) {
        return res.status(403).json({ success: false, message: 'Not authorized to pay for this booking' });
      }

      // If Razorpay Key Secret exists, verify HMAC SHA256 signature
      if (process.env.RAZORPAY_KEY_SECRET) {
        if (!razorpay_signature) {
          return res.status(400).json({ success: false, message: 'Missing Razorpay payment signature' });
        }

        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest('hex');

        if (expectedSignature !== razorpay_signature) {
          if (type === 'penalty') {
            // Keep penalty pending so it can be retried — vehicle still inside
            await logAudit(req, {
              action: 'Penalty Payment Failed',
              details: `Signature mismatch for overstay penalty on booking ${booking._id}`,
              actionType: 'payment',
            });
            return res.status(400).json({ success: false, message: 'Payment verification failed — signature mismatch' });
          }

          booking.paymentStatus = 'failed';
          await booking.save();

          await logAudit(req, {
            action: 'Payment Failed',
            details: `Signature mismatch for booking ${booking._id}`,
            actionType: 'payment',
          });

          return res.status(400).json({ success: false, message: 'Payment verification failed — signature mismatch' });
        }
      }

      if (type === 'penalty') {
        // Complete the exit only after the overstay penalty is verified
        if (booking.penaltyPaymentStatus !== 'pending') {
          return res.status(400).json({ success: false, message: 'No pending overstay penalty for this booking' });
        }

        booking.penaltyPaymentStatus = 'paid';
        booking.penaltyPaymentId = razorpay_payment_id;
        booking.status = 'completed';
        booking.exitTime = new Date();
        await booking.save();

        if (booking.slot) {
          await ParkingSlot.findByIdAndUpdate(booking.slot._id || booking.slot, { status: 'available' });
          emitSlotUpdate({ slotId: booking.slot._id || booking.slot, status: 'available' });
          emitVehicleMotion({ slotId: booking.slot._id || booking.slot, phase: 'exiting' });
        }

        emitBookingUpdate({ bookingId: booking._id, status: 'completed' });

        await Notification.create({
          user: booking.user._id || booking.user,
          title: 'Overstay Penalty Paid — Exit Completed',
          message: `Overstay penalty of ₹${booking.overstayPenalty} collected. Exit completed for slot ${booking.slot?.number || 'A-01'}.`,
          type: 'alert'
        });

        await logAudit(req, {
          action: 'Overstay Penalty Collected',
          details: `₹${booking.overstayPenalty} penalty paid for booking ${booking._id}. Exit completed.`,
          actionType: 'payment',
        });

        return res.status(200).json({
          success: true,
          type: 'exit',
          message: 'EXIT SUCCESSFUL',
          booking
        });
      }

      // Update Booking & Payment Status upon verified payment
      // Idempotency: replaying the same verified payment must not duplicate;
      // a different transaction for an already-paid booking is rejected.
      if (booking.paymentStatus === 'paid') {
        if (booking.razorpayPaymentId === razorpay_payment_id) {
          return res.status(200).json({ success: true, booking, message: 'Payment already verified' });
        }
        return res.status(400).json({ success: false, message: 'This booking has already been paid with a different transaction' });
      }

      booking.paymentStatus = 'paid';
      booking.status = 'confirmed';
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.paidAt = new Date();

      // REQUIREMENT 4: Generate unique secure QR ONLY after confirmed payment
      const qrToken = uuidv4();
      const qrCode = await qrcode.toDataURL(qrToken);
      booking.qrToken = qrToken;
      booking.qrCode = qrCode;

      await booking.save();

      if (booking.slot) {
        await ParkingSlot.findByIdAndUpdate(booking.slot._id || booking.slot, { status: 'reserved' });
        emitSlotUpdate({ slotId: booking.slot._id || booking.slot, status: 'reserved' });
      }

      await Notification.create({
        user: booking.user._id || booking.user,
        title: 'Payment Confirmed & QR Generated',
        message: `Your payment of ₹${booking.amount} is confirmed. Digital pass is active.`,
        type: 'booking'
      });

      if (booking.user && booking.user.email) {
        sendBookingEmail(booking.user.email, {
          vehicleNumber: booking.vehicleNumber,
          slotNumber: booking.slot?.number || 'A-01',
          amount: booking.amount
        }).catch(err => console.error('Email error:', err));
      }

      emitBookingUpdate({ bookingId: booking._id, status: 'confirmed' });

      await logAudit(req, {
        action: 'Payment Successful',
        details: `Booking ${booking._id} paid via Razorpay (₹${booking.amount}). QR Generated.`,
        actionType: 'payment',
      });

      return res.status(200).json({ success: true, booking });
    }

    // Demo Standalone Response when DB is offline
    const qrToken = uuidv4();
    const qrCode = await qrcode.toDataURL(qrToken);
    const mockBooking = {
      _id: bookingId,
      id: bookingId,
      status: 'confirmed',
      paymentStatus: 'paid',
      vehicleNumber: req.body.vehicleNumber || 'MH-12-AB-3456',
      slotNumber: 'A-01',
      amount: 60,
      qrToken,
      qrCode,
      razorpayPaymentId: razorpay_payment_id
    };

    res.status(200).json({ success: true, booking: mockBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/payments/cancel { bookingId } — Released temporary slot reservation if payment is cancelled
exports.cancelPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) {
      return res.status(400).json({ success: false, message: 'bookingId is required' });
    }

    if (require('mongoose').connection.readyState === 1) {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        // Ownership check: users may only cancel their own pending payments
        const bookingUserId = String(booking.user?._id || booking.user);
        if (bookingUserId !== String(req.user.id || req.user._id) && req.user.role !== 'admin') {
          return res.status(403).json({ success: false, message: 'Not authorized to cancel this payment' });
        }
        if (booking.status === 'pending') {
          // Checkout dismissed / payment failed: keep the booking PAYMENT_PENDING
          // so the user can retry ("Pay Now") within the 10-minute hold window.
          // The slot stays reserved for them; the reservation-expiry cron
          // releases it automatically if they abandon the booking.
          booking.paymentStatus = 'failed';
          await booking.save();
        }
      }
    }

    res.status(200).json({ success: true, message: 'Booking kept pending — you can retry the payment.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- Payment history & admin transaction management ----------
// The Booking document is the single source of truth for payment records
// (no duplicate Payment model): user → booking → slot → payment → QR.

const txnFromBooking = (b) => ({
  _id: String(b._id),
  bookingId: String(b._id),
  transactionId: b.razorpayPaymentId || `TXN-${String(b._id).slice(-8).toUpperCase()}`,
  razorpayOrderId: b.razorpayOrderId || '',
  razorpayPaymentId: b.razorpayPaymentId || '',
  amount: b.amount,
  penaltyAmount: b.overstayPenalty || 0,
  status: b.paymentStatus,
  method: b.razorpayOrderId || b.razorpayPaymentId ? 'Razorpay' : '—',
  vehicleNumber: b.vehicleNumber || '',
  slotNumber: b.slot?.number || '',
  location: b.slot?.location || '',
  zone: b.slot?.zone || '',
  startTime: b.startTime,
  endTime: b.endTime,
  paidAt: b.paidAt || (b.paymentStatus === 'paid' ? b.updatedAt : null),
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

// GET /api/payments/my — a user sees ONLY their own transactions
exports.getMyPayments = async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(200).json({ success: true, transactions: [] });
    }
    const bookings = await Booking.find({ user: req.user._id })
      .populate('slot', 'number location zone')
      .sort({ updatedAt: -1 })
      .limit(200);
    res.status(200).json({
      success: true,
      transactions: bookings.map(txnFromBooking),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/payments/stats — admin dashboard summary cards (live data)
exports.getPaymentStats = async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(200).json({ success: true, stats: {} });
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [revenueAgg] = await Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, today: { $sum: { $cond: [{ $gte: ['$updatedAt', startOfToday] }, '$amount', 0] } } } },
    ]);
    const countBy = await Booking.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]);
    const counts = { paid: 0, pending: 0, failed: 0, refunded: 0 };
    countBy.forEach((c) => { counts[c._id] = c.count; });

    res.status(200).json({
      success: true,
      stats: {
        totalRevenue: revenueAgg?.total || 0,
        todayRevenue: revenueAgg?.today || 0,
        successfulPayments: counts.paid,
        pendingPayments: counts.pending,
        failedPayments: counts.failed,
        refundedPayments: counts.refunded,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Shared filter builder for the admin list/export endpoints
const buildAdminFilter = async (q, status, from, to) => {
  const filter = {};
  if (status && ['paid', 'pending', 'failed', 'refunded'].includes(status)) {
    filter.paymentStatus = status;
  }
  if (from || to) {
    filter.updatedAt = {};
    if (from) filter.updatedAt.$gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      filter.updatedAt.$lte = end;
    }
  }
  if (q) {
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await require('../models/User').find({ $or: [{ name: re }, { email: re }] }).select('_id');
    filter.$or = [
      { razorpayPaymentId: re },
      { razorpayOrderId: re },
      { vehicleNumber: re },
      { user: { $in: users.map((u) => u._id) } },
    ];
  }
  return filter;
};

// GET /api/payments — admin transaction table (search/filter/date/pagination)
exports.listPayments = async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(200).json({ success: true, transactions: [], total: 0, page: 1, pages: 1 });
    }
    const { q = '', status = '', from = '', to = '' } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const filter = await buildAdminFilter(String(q), String(status), String(from), String(to));

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('slot', 'number location zone')
        .populate('user', 'name email')
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Booking.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      transactions: bookings.map((b) => ({
        ...txnFromBooking(b),
        userName: b.user?.name || '—',
        userEmail: b.user?.email || '—',
      })),
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/payments/:bookingId — admin read-only payment detail
exports.getPaymentDetail = async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    const booking = await Booking.findById(req.params.bookingId)
      .populate('slot', 'number location zone category floor')
      .populate('user', 'name email phone createdAt');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    res.status(200).json({
      success: true,
      payment: txnFromBooking(booking),
      booking: {
        bookingId: String(booking._id),
        bookingDate: booking.createdAt,
        startTime: booking.startTime,
        endTime: booking.endTime,
        duration: booking.duration,
        status: booking.status,
        entryTime: booking.entryTime,
        exitTime: booking.exitTime,
      },
      user: booking.user ? {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone,
        memberSince: booking.user.createdAt,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/payments/export — admin CSV report (respects current filters)
exports.exportPaymentsCsv = async (req, res) => {
  try {
    if (require('mongoose').connection.readyState !== 1) {
      return res.status(200).json({ success: false, message: 'Database unavailable' });
    }
    const { q = '', status = '', from = '', to = '' } = req.query;
    const filter = await buildAdminFilter(String(q), String(status), String(from), String(to));
    const bookings = await Booking.find(filter)
      .populate('slot', 'number location zone')
      .populate('user', 'name email')
      .sort({ updatedAt: -1 })
      .limit(5000);

    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Transaction ID', 'Booking ID', 'User', 'Email', 'Location', 'Slot', 'Vehicle', 'Amount (INR)', 'Status', 'Method', 'Razorpay Order ID', 'Razorpay Payment ID', 'Date/Time'];
    const rows = bookings.map((b) => {
      const t = txnFromBooking(b);
      return [t.transactionId, t.bookingId, b.user?.name || '', b.user?.email || '', t.location, t.slotNumber, t.vehicleNumber, t.amount, t.status, t.method, t.razorpayOrderId, t.razorpayPaymentId, new Date(t.updatedAt).toISOString()].map(esc).join(',');
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="parksmart-payments-${Date.now()}.csv"`);
    res.status(200).send([header.join(','), ...rows].join('\n'));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
