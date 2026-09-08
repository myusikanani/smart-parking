const express = require('express');
const router = express.Router();
const {
  getLiveState,
  startSimulation,
  stopSimulation,
  getSimulationStatus,
  manualUpdateSlot,
  broadcastAlert,
} = require('../controllers/realtimeController');
const { protect, authorize } = require('../middleware/auth');

router.get('/state', protect, getLiveState);

router.get('/simulation', protect, authorize('admin'), getSimulationStatus);
router.post('/simulation/start', protect, authorize('admin'), startSimulation);
router.post('/simulation/stop', protect, authorize('admin'), stopSimulation);

router.post('/slots/update', protect, authorize('admin', 'security'), manualUpdateSlot);
router.post('/broadcast', protect, authorize('admin'), broadcastAlert);

module.exports = router;
