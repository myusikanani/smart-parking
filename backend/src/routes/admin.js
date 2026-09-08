const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllBookings, getUsers, getUserById, updateUser, deleteUser, getRevenueReport, getAnalytics, getNoShowReport, getOverstayReport, updatePricing, getAuditLogs, getWaitingList } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/bookings', getAllBookings);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/revenue', getRevenueReport);
router.get('/analytics', getAnalytics);
router.get('/reports/no-show', getNoShowReport);
router.get('/reports/overstay', getOverstayReport);
router.put('/pricing', updatePricing);
router.get('/audit-logs', getAuditLogs);
router.get('/waiting-list', getWaitingList);

module.exports = router;
