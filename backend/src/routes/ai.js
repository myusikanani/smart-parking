const express = require('express');
const router = express.Router();
const { getRecommendations, getAnalytics, searchSlots } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/recommendations', protect, getRecommendations);
router.get('/analytics', protect, getAnalytics);
router.get('/search', protect, searchSlots);

module.exports = router;
