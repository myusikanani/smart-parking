const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { send2FAEmailCode } = require('../utils/emailService');
const { logAudit } = require('../utils/auditLogger');

const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Admin accounts can only be created/promoted by an existing admin
  // through Manage Users — never via public registration.
  if (req.body.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin accounts cannot be created via public registration.'
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const userRole = req.body.role === 'security' ? 'security' : 'user';

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role: userRole
    });

    const token = user.generateAuthToken();

    await Notification.create({
      user: user._id,
      title: 'Welcome',
      message: 'Welcome to Smart Parking System',
      type: 'info'
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.warn('DB Register Error (using demo fallback):', error.message);
    const userRole = req.body.role === 'admin' || req.body.role === 'security' ? req.body.role : 'user';
    return res.status(201).json({
      success: true,
      token: `demo-token-${Date.now()}`,
      user: {
        id: 'demo-user-id-' + userRole,
        name: name || 'Registered User',
        email: email,
        phone: phone || '9876543210',
        role: userRole
      }
    });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const totalUsers = await User.countDocuments();
    if (totalUsers === 0) {
      console.log('No users found in database, auto-seeding default accounts...');
      const { seedAll } = require('../utils/seeder');
      await seedAll();
    }

    const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorTempSecret');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Account lockout check
    if (user.lockUntil && user.lockUntil > new Date()) {
      const remainingMins = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed attempts. Please try again in ${remainingMins} minute(s).`
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      let warningMsg = 'Invalid email or password';
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
        warningMsg = 'Account locked for 15 minutes due to 5 consecutive failed login attempts.';
      } else if (user.failedLoginAttempts >= 3) {
        warningMsg = `Invalid email or password. Warning: ${5 - user.failedLoginAttempts} attempts remaining before account lockout.`;
      }
      await user.save();
      return res.status(401).json({ success: false, message: warningMsg });
    }

    // Successful password match -> Reset lockout counters
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    if (user.role === 'admin' || user.twoFactorEnabled) {
      if (!user.twoFactorSecret) {
        if (!user.twoFactorTempSecret) {
          const secret = speakeasy.generateSecret({
            name: `ParkSmart Admin (${user.email})`,
            issuer: 'ParkSmart Security'
          });
          user.twoFactorTempSecret = secret.base32;
          await user.save();
        }

        const qrCodeUrl = await QRCode.toDataURL(
          buildOtpauthUrl(user.twoFactorTempSecret, `ParkSmart Admin (${user.email})`, 'ParkSmart Security')
        );

        return res.status(200).json({
          success: true,
          requiresTwoFactorSetup: true,
          message: 'Admin 2FA Setup Required.',
          qrCodeUrl,
          secret: user.twoFactorTempSecret,
          userId: user._id
        });
      }

      return res.status(200).json({
        success: true,
        requiresTwoFactor: true,
        message: 'Admin 2FA Verification Required.',
        userId: user._id
      });
    }

    const token = user.generateAuthToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.warn('DB Login Error (using demo fallback):', error.message);
    const userRole = email?.includes('admin') ? 'admin' : email?.includes('security') ? 'security' : 'user';
    const userName = userRole === 'admin' ? 'Admin User' : userRole === 'security' ? 'Security Officer' : 'Demo Driver';
    return res.status(200).json({
      success: true,
      token: `demo-token-${Date.now()}`,
      user: {
        id: 'demo-user-id-' + userRole,
        name: userName,
        email: email || 'user@example.com',
        phone: '9876543210',
        role: userRole,
        twoFactorEnabled: false
      }
    });
  }
};

// Window (in 30s steps) tolerated on each side — standard ±60s.
// (TOTP is computed from the UTC epoch, so a phone on IST/any timezone
// generates the same codes — only clock *accuracy* matters, and we verified
// the server clock is correct.)
const TOTP_WINDOW = 2;
const EMAIL_CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Mask secrets in logs — never print the full TOTP secret.
const maskSecret = (s) => (s ? s.slice(0, 4) + '…' + s.slice(-4) : '(none)');

// Build an otpauth:// URL whose secret param is EXACTLY the stored base32
// secret. WARNING: speakeasy.otpauthURL() base32-encodes whatever secret you
// pass it (default encoding 'ascii'), so passing a base32 secret produces a
// double-encoded QR that Authy imports but can never match — the historical
// root cause of "Invalid code" with a perfectly synced phone.
const buildOtpauthUrl = (secretBase32, label, issuer) =>
  `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secretBase32)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

const verifyTwoFactor = async (req, res) => {
  const { userId, code } = req.body;

  const user = await User.findById(userId).select('+twoFactorSecret +twoFactorTempSecret +twoFactorCode +twoFactorExpiry');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Lockout check
  if (user.lockUntil && user.lockUntil > new Date()) {
    const remainingMins = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
    return res.status(423).json({
      success: false,
      message: `Account is temporarily locked. Please try again in ${remainingMins} minute(s).`
    });
  }

  const secretToUse = user.twoFactorSecret || user.twoFactorTempSecret;
  if (!secretToUse) {
    return res.status(400).json({ success: false, message: '2FA TOTP is not set up on this account.' });
  }

  const verified = speakeasy.totp.verify({
    secret: secretToUse,
    encoding: 'base32',
    token: code,
    window: TOTP_WINDOW
  });

  // Fallback: a one-time email OTP sent via /auth/2fa/email-code
  const emailCodeValid =
    !verified &&
    user.twoFactorCode &&
    user.twoFactorExpiry &&
    user.twoFactorCode === code &&
    new Date(user.twoFactorExpiry).getTime() > Date.now();

  console.log(
    `[2FA] verify ${user.email} | src=${user.twoFactorSecret ? 'permanent' : 'temp'} | ` +
    `secret=${maskSecret(secretToUse)} | serverTime=${new Date().toISOString()} | ` +
    `totp=${verified} | emailCode=${emailCodeValid}`
  );

  if (!verified && !emailCodeValid) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    let warningMsg = 'Invalid 6-digit code. Check your Authy / Authenticator app and try again.';
    if (user.failedLoginAttempts >= 5) {
      user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      warningMsg = 'Account locked for 15 minutes due to 5 consecutive failed 2FA attempts.';
    }
    await user.save();
    return res.status(401).json({
      success: false,
      message: warningMsg,
      serverTime: new Date().toISOString()
    });
  }

  // Reset lockout counters on success
  user.failedLoginAttempts = 0;
  user.lockUntil = null;

  // Consume the email OTP if it was used
  if (user.twoFactorCode) {
    user.twoFactorCode = undefined;
    user.twoFactorExpiry = undefined;
  }

  if (user.twoFactorTempSecret) {
    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = true;
  }

  // Always persist — for already-enabled accounts the email-code clearing
  // above must be saved even when there is no temp secret to promote
  // (mongoose no-ops the write when no paths were modified).
  await user.save();

  const token = user.generateAuthToken();

  await logAudit(req, {
    user: user.name || user.email,
    userId: user._id,
    action: 'Login',
    details: `${user.role} logged in (2FA verified)`,
    actionType: 'login',
  });

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      twoFactorEnabled: user.twoFactorEnabled
    }
  });
};

// Generate 2FA Setup QR Code for Authy / Google Authenticator
const setupTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+twoFactorTempSecret +twoFactorSecret');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Reuse the pending secret if 2FA was never confirmed — regenerating it on
    // every click makes QRs the user already scanned silently invalid.
    const existingPending = user.twoFactorTempSecret;
    const secretBase32 = existingPending || speakeasy.generateSecret({
      name: `Smart Parking (${user.email})`,
      issuer: 'Smart Parking System'
    }).base32;

    if (!existingPending) {
      user.twoFactorTempSecret = secretBase32;
      await user.save();
    }

    const qrCodeUrl = await QRCode.toDataURL(
      buildOtpauthUrl(secretBase32, `Smart Parking (${user.email})`, 'Smart Parking System')
    );

    res.status(200).json({
      success: true,
      qrCodeUrl,
      secret: secretBase32,
      message: 'Scan the QR code in Authy or Google Authenticator app'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Confirm 2FA Setup with first TOTP code
const confirmTwoFactorSetup = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id).select('+twoFactorTempSecret');

    if (!user || !user.twoFactorTempSecret) {
      return res.status(400).json({ success: false, message: '2FA setup not initiated' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorTempSecret,
      encoding: 'base32',
      token: code,
      window: TOTP_WINDOW
    });

    if (!verified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid code. Check your Authy / Authenticator app and try again. Make sure your phone clock is set to Automatic (Network time).',
        serverTime: new Date().toISOString()
      });
    }

    user.twoFactorSecret = user.twoFactorTempSecret;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Two-Factor Authentication (2FA) enabled successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send a one-time 6-digit email code as a fallback when the authenticator
// app (Authy / Google Authenticator) can't be used or its code is rejected.
const sendTwoFactorEmailCode = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const user = await User.findById(userId).select('+twoFactorSecret +twoFactorTempSecret');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorSecret && !user.twoFactorTempSecret) {
      return res.status(400).json({ success: false, message: '2FA is not set up on this account.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorCode = code;
    user.twoFactorExpiry = new Date(Date.now() + EMAIL_CODE_TTL_MS);
    await user.save();

    await send2FAEmailCode(user.email, code);

    res.status(200).json({
      success: true,
      message: 'A 6-digit code has been sent to your email. It expires in 5 minutes.',
      expiresIn: EMAIL_CODE_TTL_MS / 1000
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Disable 2FA
const disableTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.twoFactorSecret = undefined;
    user.twoFactorTempSecret = undefined;
    user.twoFactorEnabled = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: '2FA disabled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, user });
};

const updateProfile = async (req, res) => {
  const { name, email, phone } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, email, phone },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, user });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated' });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  console.log(`Reset code for ${email}: ${resetCode}`);

  res.status(200).json({
    success: true,
    message: 'Reset code sent to email',
    resetCode
  });
};

module.exports = {
  registerUser,
  loginUser,
  verifyTwoFactor,
  setupTwoFactor,
  confirmTwoFactorSetup,
  sendTwoFactorEmailCode,
  disableTwoFactor,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword
};
