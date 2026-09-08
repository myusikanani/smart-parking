const express = require('express');
const router = express.Router();
const { getSlots, getSlotById, createSlot, updateSlot, deleteSlot, getAvailableSlots, updateSlotStatus, bulkUpdateLayout } = require('../controllers/slotController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getSlots);
router.get('/available', getAvailableSlots);
router.get('/:id', getSlotById);
router.post('/', protect, authorize('admin'), createSlot);
router.put('/:id', protect, authorize('admin'), updateSlot);
router.delete('/:id', protect, authorize('admin'), deleteSlot);
router.patch('/:id/status', protect, authorize('admin', 'security'), updateSlotStatus);
router.post('/bulk-layout', protect, authorize('admin'), bulkUpdateLayout);

module.exports = router;
