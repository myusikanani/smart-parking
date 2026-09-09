const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

// Tight limiter for 2FA code endpoints — the 6-digit fallback code is
// brute-forceable, so allow only a handful of attempts per window.
const twoFALimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many 2FA attempts, please try again later.' }
});
const {
  registerUser,
  loginUser,
  verifyTwoFactor,
  setupTwoFactor,
  confirmTwoFactorSetup,
  regenerateBackupCodes,
  sendTwoFactorEmailCode,
  disableTwoFactor,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-2fa', twoFALimiter, verifyTwoFactor);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// TOTP 2FA Routes
router.post('/2fa/setup', protect, setupTwoFactor);
router.post('/2fa/confirm', protect, confirmTwoFactorSetup);
router.post('/2fa/regenerate-backup-codes', protect, regenerateBackupCodes);
router.post('/2fa/email-code', twoFALimiter, sendTwoFactorEmailCode);
router.post('/2fa/disable', protect, disableTwoFactor);

module.exports = router;
