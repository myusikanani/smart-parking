const express = require('express');
const router = express.Router();
const { getLayoutByFloor, saveLayout } = require('../controllers/layoutController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:floor', getLayoutByFloor);
router.post('/save', protect, authorize('admin'), saveLayout);

module.exports = router;