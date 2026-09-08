const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  cancelPayment,
  getMyPayments,
  getPaymentStats,
  listPayments,
  getPaymentDetail,
  exportPaymentsCsv,
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.post('/cancel', protect, cancelPayment);

// User's own payment history (ownership enforced in controller)
router.get('/my', protect, getMyPayments);

// Admin payment management
router.get('/stats', protect, authorize('admin'), getPaymentStats);
router.get('/export', protect, authorize('admin'), exportPaymentsCsv);
router.get('/', protect, authorize('admin'), listPayments);
router.get('/:bookingId', protect, authorize('admin'), getPaymentDetail);

module.exports = router;
