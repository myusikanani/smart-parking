const express = require('express');
const router = express.Router();
const {
  getMySubscriptions,
  createSubscription,
  cancelSubscription,
  getAllSubscriptions
} = require('../controllers/subscriptionController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my', protect, getMySubscriptions);
router.post('/', protect, createSubscription);
router.put('/:id/cancel', protect, cancelSubscription);
router.get('/admin', protect, authorize('admin'), getAllSubscriptions);

module.exports = router;
