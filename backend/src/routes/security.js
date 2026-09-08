const express = require('express');
const router = express.Router();
const {
  getTodayLogs,
  getDashboardStats,
  scanQR,
  manualVerify,
  getBlacklist,
  addToBlacklist,
  removeFromBlacklist,
  getIncidentReports,
  createIncidentReport,
  updateIncidentStatus,
  createWalkinPass,
  triggerEmergencySOS
} = require('../controllers/securityController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin', 'security'));

// Dashboard & Logs
router.get('/dashboard', getDashboardStats);
router.get('/logs', getTodayLogs);

// Scanning & Verification
router.post('/scan', scanQR);
router.post('/manual-verify', manualVerify);

// Blacklist & Watchlist Management
router.get('/blacklist', getBlacklist);
router.post('/blacklist', addToBlacklist);
router.delete('/blacklist/:id', removeFromBlacklist);

// Incident & Damage Reporting
router.get('/incidents', getIncidentReports);
router.post('/incidents', createIncidentReport);
router.put('/incidents/:id', updateIncidentStatus);

// Walk-in Spot Passes
router.post('/walkin-pass', createWalkinPass);

// Emergency SOS Trigger
router.post('/emergency-sos', triggerEmergencySOS);

module.exports = router;
