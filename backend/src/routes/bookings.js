const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getDynamicQR,
  verifyQR,
  markEntry,
  markExit,
  cancelBooking,
  checkExpiredBookings,
  getWaitingList,
  joinWaitingList,
  emailBookingQR
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getMyBookings);
router.get('/waiting', protect, getWaitingList);
router.post('/', protect, authorize('user', 'admin', 'security'), createBooking);
router.post('/waiting', protect, authorize('user', 'admin', 'security'), joinWaitingList);
router.post('/verify-qr', protect, authorize('admin', 'security'), verifyQR);
router.get('/check-expired', protect, authorize('admin'), checkExpiredBookings);
router.get('/:id/dynamic-qr', protect, getDynamicQR);
router.get('/:id', protect, getBookingById);
router.post('/:id/entry', protect, authorize('admin', 'security'), markEntry);
router.post('/:id/exit', protect, authorize('admin', 'security'), markExit);
router.post('/:id/email-qr', protect, emailBookingQR);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
