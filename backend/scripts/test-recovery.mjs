/**
 * Comprehensive Recovery Test Suite for ParkSmart
 * Tests:
 * 1. Password & Account Recovery (forgot-password, OTP verification, reset-password, login with new password)
 * 2. 2FA Backup Recovery Codes (generation, authentication via backup code, single-use check, regeneration)
 * 3. Self-Healing Slot & Booking Recovery (orphan slot recovery, stale hold expiration, diagnostics)
 * 4. Database Backup Export & Integrity Verification
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import speakeasy from 'speakeasy';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.TEST_PORT || 5005;
const BASE_URL = `http://localhost:${PORT}/api`;
const MONGO_URI = 'mongodb://localhost:27017/parking-system';

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function waitForHealth(proc, tries = 30) {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 600));
    try {
      const r = await fetch(`http://localhost:${PORT}/api/health`);
      if (r.ok) return true;
    } catch {}
    if (proc.exitCode !== null) throw new Error('Server process exited early');
  }
  return false;
}

async function runRecoverySuite() {
  console.log('🚀 [RECOVERY SUITE] Starting comprehensive test verification...\n');

  // Spawn backend server
  console.log('⏳ Spawning backend server...');
  const serverProc = spawn(process.execPath, ['src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, PORT: String(PORT) }
  });

  serverProc.stdout.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('Error') || msg.includes('warn')) console.log('[SERVER STDOUT]', msg.trim());
  });
  serverProc.stderr.on('data', (d) => console.error('[SERVER STDERR]', d.toString().trim()));

  const healthy = await waitForHealth(serverProc);
  if (!healthy) {
    serverProc.kill();
    throw new Error('Server failed to start on port ' + PORT);
  }
  console.log('✅ Server is healthy and listening on port ' + PORT + '\n');

  try {
    await mongoose.connect(MONGO_URI);
    const User = (await import('../src/models/User.js')).default;
    const ParkingSlot = (await import('../src/models/ParkingSlot.js')).default;
    const Booking = (await import('../src/models/Booking.js')).default;

    const testEmail = `recovery-test-${Date.now()}@test.parksmart.com`;
    const initialPassword = 'Password123!';
    const updatedPassword = 'NewSecretPassword456!';

    // 1. Setup test user
    console.log('--- Test Group 1: User Registration & Password Recovery ---');
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Recovery Test User',
        email: testEmail,
        phone: '9876543210',
        password: initialPassword
      })
    });
    assert(regRes.status === 201 && regRes.data.success, 'Test user registered successfully');
    const userToken = regRes.data.token;

    // Forgot password request
    const forgotRes = await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail })
    });
    assert(forgotRes.status === 200 && forgotRes.data.success, 'Forgot password request succeeds');
    const resetCode = forgotRes.data.resetCode;
    const rawToken = forgotRes.data.rawToken;
    assert(Boolean(resetCode && resetCode.length === 6), '6-digit numeric reset code was generated');
    assert(Boolean(rawToken && rawToken.length >= 24), 'Crypto reset link token was generated');

    // Attempt reset with invalid code
    const badResetRes = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        code: '000000',
        newPassword: updatedPassword
      })
    });
    assert(badResetRes.status === 400, 'Reset password rejected invalid verification code (400)');

    // Reset with valid code
    const goodResetRes = await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        code: resetCode,
        newPassword: updatedPassword
      })
    });
    assert(goodResetRes.status === 200 && goodResetRes.data.success, 'Reset password accepted valid code and updated password');

    // Verify old password fails
    const oldLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: initialPassword })
    });
    assert(oldLoginRes.status === 401, 'Old password no longer works (401)');

    // Verify new password succeeds
    const newLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: updatedPassword })
    });
    assert(newLoginRes.status === 200 && newLoginRes.data.success, 'Login with new password succeeds (200)');
    const loggedInToken = newLoginRes.data.token;

    // 2. 2FA Backup Recovery Codes System
    console.log('\n--- Test Group 2: 2FA Backup Recovery Codes System ---');
    const setup2FARes = await request('/auth/2fa/setup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${loggedInToken}` }
    });
    assert(setup2FARes.status === 200 && setup2FARes.data.secret, '2FA setup initiated and TOTP secret generated');
    const totpSecret = setup2FARes.data.secret;

    const validTotpCode = speakeasy.totp({ secret: totpSecret, encoding: 'base32' });
    const confirm2FARes = await request('/auth/2fa/confirm', {
      method: 'POST',
      headers: { Authorization: `Bearer ${loggedInToken}` },
      body: JSON.stringify({ code: validTotpCode })
    });
    assert(confirm2FARes.status === 200 && Array.isArray(confirm2FARes.data.backupCodes), '2FA confirmed and 8 emergency backup recovery codes returned');
    const backupCodes = confirm2FARes.data.backupCodes;
    assert(backupCodes && backupCodes.length === 8, 'Exactly 8 backup recovery codes generated');
    const testBackupCode = backupCodes[0];

    // Attempt login with 2FA requirement
    const login2FAReq = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: updatedPassword })
    });
    assert(login2FAReq.status === 200 && login2FAReq.data.requiresTwoFactor, 'Login flags 2FA verification required');
    const userId = login2FAReq.data.userId;

    // Login using a backup recovery code
    const backupLoginRes = await request('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ userId, code: testBackupCode })
    });
    assert(backupLoginRes.status === 200 && backupLoginRes.data.backupCodeUsed === true, 'Successfully signed in using 2FA Backup Recovery Code');

    // Attempt reusing the SAME backup code (should fail because it is single-use)
    const reuseLoginRes = await request('/auth/verify-2fa', {
      method: 'POST',
      body: JSON.stringify({ userId, code: testBackupCode })
    });
    assert(reuseLoginRes.status === 401, 'Re-using already consumed backup recovery code is rejected (401)');

    // Regenerate backup codes
    const regenRes = await request('/auth/2fa/regenerate-backup-codes', {
      method: 'POST',
      headers: { Authorization: `Bearer ${backupLoginRes.data.token}` }
    });
    assert(regenRes.status === 200 && regenRes.data.backupCodes.length === 8, 'Regenerated fresh pool of 8 backup recovery codes');

    // 3. Slot & Booking Auto-Recovery Engine
    console.log('\n--- Test Group 3: Slot & Booking Auto-Recovery Engine ---');

    // Login as admin
    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'admin@parksmart.com', password: 'password123' })
    });
    let adminToken = adminLogin.data.token;
    if (adminLogin.data.requiresTwoFactor) {
      const adminUser = await User.findById(adminLogin.data.userId).select('+twoFactorSecret');
      const adminCode = speakeasy.totp({ secret: adminUser.twoFactorSecret, encoding: 'base32' });
      const adminVerify = await request('/auth/verify-2fa', {
        method: 'POST',
        body: JSON.stringify({ userId: adminLogin.data.userId, code: adminCode })
      });
      adminToken = adminVerify.data.token;
    }

    // Create an artificial orphaned slot
    const testSlotNumber = `REC-ORPH-${Date.now() % 10000}`;
    const orphanedSlot = await ParkingSlot.create({
      number: testSlotNumber,
      floor: 1,
      category: 'four-wheeler',
      status: 'occupied', // artificially marked occupied without any booking
      pricePerHour: 50,
      pricePerDay: 300,
      pricePerMonth: 3000
    });

    // Create an artificial expired pending hold
    const stalePendingBooking = await Booking.create({
      user: userId,
      slot: orphanedSlot._id,
      vehicleNumber: 'MH01AB9999',
      startTime: new Date(Date.now() - 3600000),
      endTime: new Date(Date.now() + 3600000),
      amount: 100,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      reservationExpiresAt: new Date(Date.now() - 5 * 60 * 1000)
    });

    // Query diagnostics before recovery
    const diagBefore = await request('/admin/recovery/diagnostics', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(diagBefore.status === 200 && diagBefore.data.diagnostics.stalePendingHolds >= 1, 'Diagnostics detected stale pending hold before sweep');

    // Trigger manual recovery sweep
    const sweepRes = await request('/admin/recovery/sweep', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (sweepRes.status !== 200 || !sweepRes.data?.success) {
      console.error('Sweep response debug:', JSON.stringify(sweepRes));
    }
    assert(sweepRes.status === 200 && sweepRes.data.success, 'Recovery sweep executed successfully');
    assert(sweepRes.data.recoveredPending >= 1, 'Stale pending hold was auto-expired and recovered');

    // Verify the booking in DB
    const updatedBooking = await Booking.findById(stalePendingBooking._id);
    assert(updatedBooking.status === 'expired', 'Stale booking transitioned to status: expired');

    // Verify the slot was restored to available
    const updatedSlot = await ParkingSlot.findById(orphanedSlot._id);
    assert(updatedSlot.status === 'available', 'Orphaned slot lock was restored to status: available');

    // Clean up test slot and test user
    await ParkingSlot.findByIdAndDelete(orphanedSlot._id);
    await Booking.findByIdAndDelete(stalePendingBooking._id);
    await User.findByIdAndDelete(userId);

    // 4. Database Backup Export Verification
    console.log('\n--- Test Group 4: Database Backup & Snapshot Export ---');
    const backupRes = await request('/admin/backup/export', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(backupRes.status === 200, 'Database backup export endpoint responded with 200');
    assert(backupRes.data.system === 'ParkSmart', 'Backup JSON contains valid ParkSmart system signature');
    assert(backupRes.data.metadata && typeof backupRes.data.metadata.slotsCount === 'number', 'Backup metadata contains collection counts');
    assert(Array.isArray(backupRes.data.data?.slots), 'Backup archive contains slots collection array');

    await mongoose.disconnect();

    console.log('\n========================================');
    console.log(`🏁 SUITE SUMMARY: ${passedTests}/${totalTests} CHECKS PASSED`);
    console.log('========================================');
  } finally {
    serverProc.kill();
  }

  if (passedTests === totalTests) {
    console.log('🎉 ALL RECOVERY SYSTEMS ARE 100% OPERATIONAL!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED!\n');
    process.exit(1);
  }
}

runRecoverySuite().catch((err) => {
  console.error('FATAL SUITE ERROR:', err);
  process.exit(1);
});
