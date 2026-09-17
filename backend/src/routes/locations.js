const express = require('express');
const router = express.Router();
const {
  getLocations,
  getNearbyLocations,
  getDistinctAreas,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/auth');

// Public / User Endpoints
router.get('/', getLocations);
router.get('/nearby', getNearbyLocations);
router.get('/areas', getDistinctAreas);
router.get('/:id', getLocationById);

// Admin-Only Protected Endpoints
router.post('/', protect, authorize('admin'), createLocation);
router.put('/:id', protect, authorize('admin'), updateLocation);
router.delete('/:id', protect, authorize('admin'), deleteLocation);

module.exports = router;
