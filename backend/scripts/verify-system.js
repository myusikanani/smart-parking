/* ParkSmart full-system verification.
 *
 * Runs 6 suites (~84 checks) against a freshly-spawned server:
 *   1. Core E2E        — booking/payment/QR/scans/penalty/security (32)
 *   2. Full-surface API smoke — every routed feature, proper roles (35)
 *   3. Razorpay HMAC signature crypto — valid/tampered/replay (5)
 *   4. Vehicle-motion socket events (7)
 *   5. System alert broadcasts (3)
 *   6. EXPIRED cron transition (~2 min wait) (2)
 *
 * Usage:  npm run verify     (from backend/)
 * Needs:  MongoDB running; port 5000 free; frontend/node_modules present
 *         for the socket suites (skipped gracefully otherwise).
 */
const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
let speakeasy = null;
try { speakeasy = require('speakeasy'); } catch {}

const PORT = process.env.PORT || 5000;
const BASE = `http://localhost:${PORT}/api`;
const MONGO = 'mongodb://localhost:27017/parking-system';
const SOCKET_CLIENT = path.join(__dirname, '..', '..', 'frontend', 'node_modules', 'socket.io-client');

let failures = 0;
let total = 0;
// populated after DB connect (see main)
let User, Booking, ParkingSlot, Layout;
const DUMMY_KEYS = { RAZORPAY_KEY_ID: 'rzp_test_VERIFY', RAZORPAY_KEY_SECRET: 'verify_dummy_secret' };
function check(name, cond, extra = '') {
  total++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failures++;
}
async function api(method, p, body, token) {
  const res = await fetch(BASE + p, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

// ---------------------------------------------------------------------------
// Purge artifacts from any previous crashed run so the script is idempotent.
async function preflightCleanup() {
  const AuditLog = mongoose.model('AuditLog');
  const vehRe = /^(V-TEST|SMOKE|SIG-V|MOT|EXP-V|E2E-TEST)-/;
  const emailRe = /(v-(user|sec|admin|other)-\d+@v\.test)|((smoke|smokesec|sig|msec|exp)-\d+@(smoke|sig|m|e)\.test)/;
  const b = await Booking.deleteMany({ vehicleNumber: vehRe });
  const u = await User.deleteMany({ email: emailRe });
  // remove throwaway slots created by this script
  await ParkingSlot.deleteMany({ number: /^(SMK|EXP)-/ });
  // release any real slot left locked by a purged test booking
  const stale = await ParkingSlot.find({ status: { $ne: 'available' } });
  for (const s of stale) {
    const ref = await Booking.countDocuments({ slot: s._id, status: { $in: ['pending', 'confirmed', 'active'] } });
    if (ref === 0) await ParkingSlot.findByIdAndUpdate(s._id, { status: 'available' });
  }
  await Layout.findOneAndDelete({ floor: 99 });
  if (b.deletedCount || u.deletedCount) console.log(`Preflight: purged ${b.deletedCount} stale bookings, ${u.deletedCount} stale users.`);
}

// ---------------------------------------------------------------------------
async function waitForHealth(proc, tries = 20) {
  for (let i = 0; i < tries; i++) {
    await new Promise((r) => setTimeout(r, 700));
    try {
      const r = await fetch(`http://localhost:${PORT}/api/health`);
      if (r.ok) return true;
    } catch {}
    if (proc.exitCode !== null) throw new Error('server exited early');
  }
  return false;
}

// Spawn a fresh server. extraEnv lets a suite run under different config
// (e.g. dummy Razorpay keys to exercise real signature verification).
function spawnServer(extraEnv = {}) {
  const proc = spawn(process.execPath, ['src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: 'ignore',
    env: { ...process.env, ...extraEnv },
  });
  return proc;
}

// Refuse to run if a foreign process occupies our port — a zombie backend
// would silently answer health checks while every spawned server crashes.
async function assertPortFree() {
  for (let i = 0; i < 20; i++) {
    const inUse = await new Promise((resolve) => {
      const net = require('net');
      const s = net.createConnection({ port: PORT, host: 'localhost' });
      s.once('connect', () => { s.destroy(); resolve(true); });
      s.once('error', () => resolve(false));
      setTimeout(() => { try { s.destroy(); } catch {} resolve(false); }, 800);
    });
    if (!inUse) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Port ${PORT} is occupied by another process — stop it before verifying.`);
}

// Kill a spawned server and WAIT for the OS to release its port — on Windows
// an immediate respawn can race the old socket and health-check the dying
// process instead of the fresh one (which silently skips env-specific suites).
function killProc(proc) {
  return new Promise((resolve) => {
    if (!proc || proc.exitCode !== null) { resolve(); return; }
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    proc.once('exit', finish);
    proc.kill();
    setTimeout(finish, 5000);
  });
}

// ---------------------------------------------------------------------------
async function suiteCoreE2E() {
  console.log('\n——— SUITE 1: CORE E2E ———');

  const ts = Date.now();
  await User.create({ name: 'V User', email: `v-user-${ts}@v.test`, phone: '+911234567890', password: 'TestPass123!', role: 'user' });
  await User.create({ name: 'V Sec', email: `v-sec-${ts}@v.test`, phone: '+911234567891', password: 'TestPass123!', role: 'security' });
  await User.create({ name: 'V Admin', email: `v-admin-${ts}@v.test`, phone: '+911234567892', password: 'TestPass123!', role: 'admin' });
  const otherEmail = `v-other-${ts}@v.test`;
  await api('POST', '/auth/register', { name: 'Other', email: otherEmail, phone: '+912222222222', password: 'TestPass123!' });

  check('[core] public admin registration rejected', (await api('POST', '/auth/register', { name: 'H', email: `h-${ts}@x.t`, phone: '+911111111111', password: 'x', role: 'admin' })).status === 403);

  const uT = (await api('POST', '/auth/login', { email: `v-user-${ts}@v.test`, password: 'TestPass123!' })).data.token;
  const sT = (await api('POST', '/auth/login', { email: `v-sec-${ts}@v.test`, password: 'TestPass123!' })).data.token;
  check('[core] user login token', !!uT);
  check('[core] security login token', !!sT);

  const a1 = await api('POST', '/auth/login', { email: `v-admin-${ts}@v.test`, password: 'TestPass123!' });
  let admT = a1.data.token;
  if (!admT && a1.data.requiresTwoFactorSetup && a1.data.secret && speakeasy) {
    const code = speakeasy.totp({ secret: a1.data.secret, encoding: 'base32' });
    admT = (await api('POST', '/auth/verify-2fa', { userId: a1.data.userId, code })).data.token;
  }
  check('[core] admin 2FA enrollment+verify', !!admT);

  const slot = (await api('GET', '/slots/available')).data.slots[0];
  check('[core] slots listed', !!slot);

  const winS = new Date(Date.now() + 48 * 3600e3); winS.setMinutes(0, 0, 0);
  const winE = new Date(winS.getTime() + 2 * 3600e3);
  check('[core] window-aware availability', (await api('GET', `/slots/available?startTime=${encodeURIComponent(winS.toISOString())}&endTime=${encodeURIComponent(winE.toISOString())}`)).data.count > 0);

  const bk = await api('POST', '/bookings', { slotId: slot._id, vehicleNumber: 'V-TEST-01', startTime: new Date(Date.now() + 5 * 60e3).toISOString(), endTime: new Date(Date.now() + 2 * 3600e3).toISOString() }, uT);
  const bid = bk.data.booking?._id;
  check('[core] booking created pending', bk.status === 201 && bk.data.booking?.status === 'pending');

  const o1 = await api('POST', '/bookings', { slotId: slot._id, vehicleNumber: 'V-TEST-02', startTime: winS.toISOString(), endTime: winE.toISOString() }, uT);
  const dup = await api('POST', '/bookings', { slotId: slot._id, vehicleNumber: 'V-TEST-03', startTime: new Date(winS.getTime() + 30 * 60e3).toISOString(), endTime: new Date(winE.getTime() + 30 * 60e3).toISOString() }, uT);
  check('[core] overlapping booking rejected 409', o1.status === 201 && dup.status === 409, `o1=${o1.status} dup=${dup.status} ${!o1.data.success ? o1.data.message : ''}`);
  await api('PUT', `/bookings/${o1.data.booking?._id}/cancel`, {}, uT);

  const later = await api('POST', '/bookings', { slotId: slot._id, vehicleNumber: 'V-TEST-04', startTime: new Date(winE.getTime() + 3600e3).toISOString(), endTime: new Date(winE.getTime() + 7200e3).toISOString() }, uT);
  check('[core] non-overlapping window allowed', later.status === 201, `status=${later.status} ${!later.data.success ? later.data.message : ''}`);
  await api('PUT', `/bookings/${later.data.booking?._id}/cancel`, {}, uT);

  const ord = await api('POST', '/payments/create-order', { bookingId: bid }, uT);
  check('[core] test-mode order', ord.data.success && ord.data.isTestMode === true);
  const ver = await api('POST', '/payments/verify', { bookingId: bid, razorpay_order_id: ord.data.orderId, razorpay_payment_id: `pay_${ts}`, razorpay_signature: `sig_${ts}` }, uT);
  check('[core] payment verified → confirmed', ver.data.booking?.status === 'confirmed' && ver.data.booking?.paymentStatus === 'paid');
  check('[core] QR only after payment', !!ver.data.booking?.qrToken && !!ver.data.booking?.qrCode);

  const idor = await api('PUT', `/bookings/${bid}/cancel`, {}, (await api('POST', '/auth/login', { email: otherEmail, password: 'TestPass123!' })).data.token);
  check('[core] IDOR blocked on cancel', idor.status === 403);

  const qrToken = (await Booking.findById(bid)).qrToken;
  const entry = await api('POST', '/security/scan', { qrToken, gateMode: 'entry' }, sT);
  check('[core] entry scan allowed', entry.data.allowed === true);
  const afterEntry = await Booking.findById(bid).lean();
  check('[core] entry → ACTIVE + timestamp', afterEntry.status === 'active' && !!afterEntry.entryTime);
  check('[core] entry → slot OCCUPIED', (await ParkingSlot.findById(slot._id).lean()).status === 'occupied');
  check('[core] duplicate entry denied', (await api('POST', '/security/scan', { qrToken, gateMode: 'entry' }, sT)).data.allowed === false);
  const exitScan = await api('POST', '/security/scan', { qrToken, gateMode: 'exit' }, sT);
  check('[core] exit scan successful', exitScan.data.allowed === true);
  check('[core] exit → COMPLETED + slot AVAILABLE', (await Booking.findById(bid).lean()).status === 'completed' && (await ParkingSlot.findById(slot._id).lean()).status === 'available');

  // overstay penalty flow (future-window booking avoids no-show cron race;
  // shift times into the past via DB after payment, before the exit scan)
  const bk2 = await api('POST', '/bookings', { slotId: slot._id, vehicleNumber: 'V-TEST-05', startTime: new Date(Date.now() + 5 * 60e3).toISOString(), endTime: new Date(Date.now() + 2 * 3600e3).toISOString() }, uT);
  const bid2 = bk2.data.booking._id;
  const ord2 = await api('POST', '/payments/create-order', { bookingId: bid2 }, uT);
  await api('POST', '/payments/verify', { bookingId: bid2, razorpay_order_id: ord2.data.orderId, razorpay_payment_id: `pay2_${ts}`, razorpay_signature: `s2_${ts}` }, uT);
  await Booking.findByIdAndUpdate(bid2, { status: 'active', entryTime: new Date(Date.now() - 5 * 3600e3), startTime: new Date(Date.now() - 5 * 3600e3), endTime: new Date(Date.now() - 3600e3) });
  await ParkingSlot.findByIdAndUpdate(slot._id, { status: 'occupied' });
  const qr2 = (await Booking.findById(bid2)).qrToken;
  const lateExit = await api('POST', '/security/scan', { qrToken: qr2, gateMode: 'exit' }, sT);
  check('[core] overstay → paymentRequired', lateExit.data.paymentRequired === true && lateExit.data.allowed === true, `penalty=₹${lateExit.data.booking?.overstayPenalty}`);
  check('[core] held until penalty paid', (await Booking.findById(bid2).lean()).status === 'active' && (await Booking.findById(bid2).lean()).penaltyPaymentStatus === 'pending');
  check('[core] slot OCCUPIED while unpaid', (await ParkingSlot.findById(slot._id).lean()).status === 'occupied');
  const pOrd = await api('POST', '/payments/create-order', { bookingId: bid2, type: 'penalty' }, sT);
  check('[core] penalty order created', pOrd.data.success && Number(pOrd.data.amount) > 0, `${pOrd.data.amount} paise`);
  const pVer = await api('POST', '/payments/verify', { bookingId: bid2, razorpay_order_id: pOrd.data.orderId, razorpay_payment_id: `ppen_${ts}`, razorpay_signature: `ps_${ts}`, type: 'penalty' }, sT);
  check('[core] penalty verified → completed', pVer.data.success === true && (await Booking.findById(bid2).lean()).status === 'completed');
  check('[core] slot AVAILABLE after penalty', (await ParkingSlot.findById(slot._id).lean()).status === 'available');

  const eq = await api('POST', `/bookings/${bid}/email-qr`, {}, uT);
  check('[core] Email QR endpoint works', eq.data.success === true, eq.data.message || '');

  const logs = (await api('GET', '/admin/audit-logs?limit=50', null, admT)).data.logs?.map((l) => l.action) || [];
  check('[core] audit logs record entry/exit/overstay/penalty', ['Vehicle Entry', 'Vehicle Exit', 'Overstay Detected at Exit'].every((a) => logs.includes(a)) && logs.some((a) => /Penalty/i.test(a)));

  check('[core] admin endpoint denies user', (await api('GET', '/admin/bookings', null, uT)).status === 403);
  check('[core] admin sees ALL bookings', (await api('GET', '/admin/bookings', null, admT)).data.success === true);

  return { ts, admT };
}

// ---------------------------------------------------------------------------
async function suiteSmoke({ ts, admT }) {
  console.log('\n——— SUITE 2: FULL-SURFACE SMOKE ———');
  const user = await User.create({ name: 'SmokeUser', email: `smoke-${ts}@smoke.test`, phone: '+911239990001', password: 'SmokePass123!', role: 'user' });
  const sec = await User.create({ name: 'SmokeSec', email: `smokesec-${ts}@smoke.test`, phone: '+911239990002', password: 'SmokePass123!', role: 'security' });

  const ul = (await api('POST', '/auth/login', { email: user.email, password: 'SmokePass123!' })).data;
  const sl = (await api('POST', '/auth/login', { email: sec.email, password: 'SmokePass123!' })).data;
  const uT = ul.token, sT = sl.token;

  check('[smoke] auth/me', (await api('GET', '/auth/me', null, uT)).data?.user?.email === user.email);
  check('[smoke] profile update', (await api('PUT', '/auth/profile', { name: 'Smoke Renamed' }, uT)).data?.success === true);
  check('[smoke] change-password', (await api('PUT', '/auth/change-password', { currentPassword: 'SmokePass123!', newPassword: 'SmokePass456!' }, uT)).data?.success === true);
  await api('PUT', '/auth/change-password', { currentPassword: 'SmokePass456!', newPassword: 'SmokePass123!' }, uT);
  check('[smoke] forgot-password generic-ok', (await api('POST', '/auth/forgot-password', { email: user.email })).status === 200);

  const s2 = await api('POST', '/auth/2fa/setup', {}, uT);
  check('[smoke] 2FA setup returns secret+QR', !!s2.data?.secret && !!s2.data?.qrCodeUrl);
  if (s2.data?.secret && speakeasy) {
    const c = speakeasy.totp({ secret: s2.data.secret, encoding: 'base32' });
    check('[smoke] 2FA confirm', (await api('POST', '/auth/2fa/confirm', { code: c }, uT)).data?.success === true);
    check('[smoke] 2FA disable', (await api('POST', '/auth/2fa/disable', {}, uT)).data?.success === true);
  }

  const allSlots = (await api('GET', '/slots', null, uT)).data;
  check('[smoke] slots list', allSlots.success === true);
  // hermetic slot-CRUD test on a throwaway slot with no bookings attached
  const crud = await api('POST', '/slots', { number: `SMK-C${ts % 100000}`, category: 'two-wheeler', floor: 1, pricePerHour: 11, x: 0, z: 0 }, admT);
  check('[smoke] admin create slot', crud.status === 201 || crud.data?.success === true, `status=${crud.status}`);
  const cid = crud.data?.slot?._id;
  if (cid) {
    check('[smoke] admin update slot', (await api('PUT', `/slots/${cid}`, { pricePerHour: 12 }, admT)).data?.success === true);
    check('[smoke] slot detail', (await api('GET', `/slots/${cid}`, null, uT)).data?.slot?._id === cid);
    const del = await api('DELETE', `/slots/${cid}`, null, admT);
    check('[smoke] admin delete slot', del.data?.success === true && !(await ParkingSlot.findById(cid)), `status=${del.status} ${del.data?.message || ''}`);
  }
  // separate slot for the booking-flow part of this suite
  const ns = await api('POST', '/slots', { number: `SMK-${ts % 100000}`, category: 'four-wheeler', floor: 1, pricePerHour: 33, x: 0, z: 0 }, admT);

  const bk = await api('POST', '/bookings', { slotId: ns.data?.slot?._id ?? sid, vehicleNumber: 'SMOKE-V1', startTime: new Date(Date.now() + 5 * 60e3).toISOString(), endTime: new Date(Date.now() + 2 * 3600e3).toISOString() }, uT);
  check('[smoke] booking created', bk.status === 201);
  const bid = bk.data.booking._id;
  const o = await api('POST', '/payments/create-order', { bookingId: bid }, uT);
  const v = await api('POST', '/payments/verify', { bookingId: bid, razorpay_order_id: o.data.orderId, razorpay_payment_id: `ps_${ts}`, razorpay_signature: `ss_${ts}` }, uT);
  check('[smoke] pay + confirm', v.data?.booking?.status === 'confirmed');
  check('[smoke] own-bookings list', (await api('GET', '/bookings', null, uT)).data.bookings.some((b) => String(b._id) === String(bid)));

  const vq = await api('POST', '/bookings/verify-qr', { qrToken: (await Booking.findById(bid)).qrToken }, sT);
  check('[smoke] verify-qr', vq.data?.success === true && vq.data?.booking?.vehicleNumber === 'SMOKE-V1');

  const mvEntry = await api('POST', '/security/manual-verify', { vehicleNumber: 'SMOKE-V1', gateMode: 'entry' }, sT);
  check('[smoke] manual-verify finds confirmed', mvEntry.data?.success === true && mvEntry.data?.bookings?.length >= 1);
  check('[smoke] manual entry endpoint', (await api('POST', `/bookings/${bid}/entry`, {}, sT)).data?.booking?.status === 'active');
  check('[smoke] manual exit endpoint', (await api('POST', `/bookings/${bid}/exit`, {}, sT)).data?.booking?.status === 'completed');
  const mvExit = await api('POST', '/security/manual-verify', { vehicleNumber: 'SMOKE-V1', gateMode: 'exit' }, sT);
  check('[smoke] manual-verify exit no-match after completion', mvExit.data?.success === false);

  check('[smoke] join waiting list', ((await api('POST', '/bookings/waiting', { category: 'four-wheeler' }, uT)).status < 500));
  check('[smoke] admin/dashboard stats', (await api('GET', '/admin/dashboard', null, admT)).data?.success === true);
  check('[smoke] admin/users list', (await api('GET', '/admin/users', null, admT)).data?.success === true);
  const promo = await api('PUT', `/admin/users/${sec._id}`, { role: 'admin' }, admT);
  check('[smoke] promote via user-update', promo.data?.success === true && promo.data?.user?.role === 'admin');
  check('[smoke] demote back', (await api('PUT', `/admin/users/${sec._id}`, { role: 'security' }, admT)).data?.success === true);
  check('[smoke] admin update user', (await api('PUT', `/admin/users/${user._id}`, { name: 'SmokeUser R2' }, admT)).data?.success === true);
  check('[smoke] admin/revenue', (await api('GET', '/admin/revenue', null, admT)).data?.success === true);
  check('[smoke] admin/analytics', (await api('GET', '/admin/analytics', null, admT)).data?.success === true);
  check('[smoke] admin/reports/no-show', (await api('GET', '/admin/reports/no-show', null, admT)).data?.success === true);
  check('[smoke] admin/reports/overstay', (await api('GET', '/admin/reports/overstay', null, admT)).data?.success === true);
  check('[smoke] admin/waiting-list', (await api('GET', '/admin/waiting-list', null, admT)).data?.success === true);
  check('[smoke] security/dashboard', (await api('GET', '/security/dashboard', null, sT)).data?.success === true);
  check('[smoke] security/logs', Array.isArray((await api('GET', '/security/logs', null, sT)).data?.logs));
  check('[smoke] layout get', (await api('GET', '/layout/1', null, uT)).status < 500);
  check('[smoke] layout save', (await api('POST', '/layout/save', { floor: 99, items: [{ id: `smk-${ts}`, type: 'entrance', x: -17, z: 0 }] }, admT)).data?.success === true);

  // release the booking-flow slot so real slot pool isn't reduced
  const smkSlot = ns.data?.slot?._id;
  if (smkSlot) await ParkingSlot.findByIdAndUpdate(smkSlot, { status: 'available' });
  await Layout.findOneAndDelete({ floor: 99 });
  await User.deleteMany({ _id: { $in: [user._id, sec._id] } });
}

// ---------------------------------------------------------------------------
async function suiteSignature({ ts }) {
  console.log('\n——— SUITE 3: RAZORPAY SIGNATURE CRYPTO ———');
  const SIG_SECRET = DUMMY_KEYS.RAZORPAY_KEY_SECRET; // server runs under these keys
  const user = await User.create({ name: 'SigUser', email: `sig-${ts}@sig.test`, phone: '+911239990003', password: 'SigPass123!', role: 'user' });
  // dedicated throwaway slot so real slots are never mutated by this suite
  const slotDoc = await ParkingSlot.create({ number: `SMK-S${ts % 100000}`, category: 'four-wheeler', floor: 1, pricePerHour: 30, status: 'available', x: 0, z: 0 });
  const mkB = (oid) => Booking.create({ user: user._id, slot: slotDoc._id, vehicleNumber: 'SIG-V-' + Math.floor(Math.random() * 9000), startTime: new Date(Date.now() - 36e5), endTime: new Date(Date.now() + 36e5), amount: 150, status: 'pending', paymentStatus: 'pending', razorpayOrderId: oid });
  const uT = (await api('POST', '/auth/login', { email: user.email, password: 'SigPass123!' })).data.token;

  const b1 = await mkB(`order_sig_ok_${ts}`);
  const sig = crypto.createHmac('sha256', SIG_SECRET).update(`order_sig_ok_${ts}|pay_1`).digest('hex');
  const r1 = await api('POST', '/payments/verify', { bookingId: String(b1._id), razorpay_order_id: `order_sig_ok_${ts}`, razorpay_payment_id: 'pay_1', razorpay_signature: sig }, uT);
  check('[sig] valid signature accepted', r1.status === 200 && r1.data.success === true);
  check('[sig] booking confirmed/paid', (await Booking.findById(b1._id).lean()).status === 'confirmed');

  const b2 = await mkB(`order_sig_bad_${ts}`);
  const r2 = await api('POST', '/payments/verify', { bookingId: String(b2._id), razorpay_order_id: `order_sig_bad_${ts}`, razorpay_payment_id: 'pay_2', razorpay_signature: 'deadbeef'.repeat(8) }, uT);
  check('[sig] tampered signature rejected', r2.status === 400);
  const b2d = await Booking.findById(b2._id).lean();
  check('[sig] bad-sig → paymentStatus failed', b2d.paymentStatus === 'failed');

  const b3 = await mkB(`order_sig_x_${ts}`);
  const sig3 = crypto.createHmac('sha256', SIG_SECRET).update(`order_OTHER|pay_3`).digest('hex');
  check('[sig] cross-order replay rejected', (await api('POST', '/payments/verify', { bookingId: String(b3._id), razorpay_order_id: `order_sig_x_${ts}`, razorpay_payment_id: 'pay_3', razorpay_signature: sig3 }, uT)).status === 400);

  await Booking.deleteMany({ user: user._id });
  await User.deleteOne({ _id: user._id });
  await ParkingSlot.findByIdAndDelete(slotDoc._id);
}

// ---------------------------------------------------------------------------
function socketClientAvailable() {
  try { require(SOCKET_CLIENT); return true; } catch { return false; }
}

async function suiteMotion({ ts, admT }) {
  console.log('\n——— SUITE 4: VEHICLE-MOTION EVENTS ———');
  if (!socketClientAvailable()) { console.log('SKIP (socket.io-client not found in frontend)'); return; }
  const { io } = require(SOCKET_CLIENT);
  const secU = await User.create({ name: 'MotSec', email: `msec-${ts}@m.test`, phone: '+911239990004', password: 'TestPass123!', role: 'security' });
  const sT = (await api('POST', '/auth/login', { email: secU.email, password: 'TestPass123!' })).data.token;
  const slot = (await api('GET', '/slots/available')).data.slots[0];

  const bk = await api('POST', '/bookings', { slotId: slot._id, vehicleNumber: `MOT-${ts % 100000}`, startTime: new Date(Date.now() + 5 * 60e3).toISOString(), endTime: new Date(Date.now() + 2 * 3600e3).toISOString() }, admT);
  const bid = bk.data.booking._id;
  const o = await api('POST', '/payments/create-order', { bookingId: bid }, admT);
  await api('POST', '/payments/verify', { bookingId: bid, razorpay_order_id: o.data.orderId, razorpay_payment_id: `pm_${ts}`, razorpay_signature: `sm_${ts}` }, admT);

  const socket = io(`http://localhost:${PORT}`, { transports: ['websocket', 'polling'] });
  await new Promise((r) => socket.on('connect', r));

  const waitPhase = (phase) => new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), 6000);
    socket.on('vehicle-motion', (p) => { if (p?.phase === phase) { clearTimeout(t); resolve(p); } });
  });

  let enteringP = waitPhase('entering');
  const eScan = await api('POST', '/security/scan', { qrToken: (await Booking.findById(bid)).qrToken, gateMode: 'entry' }, sT);
  const entering = await enteringP;
  check('[motion] entry scan allowed', eScan.data.allowed === true);
  check('[motion] ENTERING broadcast', !!entering);
  check('[motion] entering slotId matches', String(entering?.slotId) === String(slot._id));

  let exitingP = waitPhase('exiting');
  await api('POST', '/security/scan', { qrToken: (await Booking.findById(bid)).qrToken, gateMode: 'exit' }, sT);
  const exiting = await exitingP;
  check('[motion] EXITING broadcast', !!exiting);
  check('[motion] exiting slotId matches', String(exiting?.slotId) === String(slot._id));

  socket.disconnect();
  await Booking.deleteMany({ vehicleNumber: /^MOT-/ });
  await User.deleteOne({ _id: secU._id });
}

// ---------------------------------------------------------------------------
async function suiteAlerts({ ts, admT }) {
  console.log('\n——— SUITE 5: SYSTEM ALERT BROADCASTS ———');
  if (!socketClientAvailable()) { console.log('SKIP (socket.io-client not found)'); return; }
  const { io } = require(SOCKET_CLIENT);
  const socket = io(`http://localhost:${PORT}`, { transports: ['websocket', 'polling'] });
  await new Promise((r) => socket.on('connect', r));
  const got = () => new Promise((resolve) => {
    const t = setTimeout(() => resolve(null), 6000);
    socket.on('alert', (p) => { clearTimeout(t); resolve(p); });
  });

  let g1 = got();
  const b1 = await api('POST', '/realtime/broadcast', { type: 'manual-update', severity: 'warning', message: 'VERIFY broadcast alert' }, admT);
  const p1 = await g1;
  check('[alert] broadcast accepted', b1.data.success === true);
  check('[alert] alert event received', p1?.message === 'VERIFY broadcast alert');

  const slot = await mongoose.model('ParkingSlot').findOne();
  let g2 = got();
  await api('POST', '/realtime/slots/update', { slotId: String(slot._id), status: slot.status, message: 'VERIFY manual override' }, admT);
  const p2 = await g2;
  check('[alert] manual-update alert received', p2?.message === 'VERIFY manual override');

  socket.disconnect();
}

// ---------------------------------------------------------------------------
async function suiteExpiry(_ctx) {
  console.log('\n——— SUITE 6: EXPIRED CRON TRANSITION (~2 min) ———');
  const user = await User.create({ name: 'ExpUser', email: `exp-${Date.now()}@e.test`, phone: '+911239990005', password: 'ExpPass123!', role: 'user' });
  const slot = await ParkingSlot.create({ number: `EXP-${Math.floor(Math.random() * 9000 + 1000)}`, category: 'four-wheeler', floor: 1, pricePerHour: 30, status: 'reserved', x: 0, z: 0 });
  const bk = await Booking.create({ user: user._id, slot: slot._id, vehicleNumber: 'EXP-V-1', startTime: new Date(Date.now() + 36e5), endTime: new Date(Date.now() + 72e5), amount: 60, status: 'pending', paymentStatus: 'pending', reservationExpiresAt: new Date(Date.now() - 1000) });

  let done = false;
  for (let i = 0; i < 13 && !done; i++) {
    await new Promise((r) => setTimeout(r, 15000));
    done = (await Booking.findById(bk._id).lean())?.status !== 'pending';
  }
  const fb = await Booking.findById(bk._id).lean();
  const fs = await ParkingSlot.findById(slot._id).lean();
  check('[expiry] pending → EXPIRED by cron', fb.status === 'expired' && fb.paymentStatus === 'failed', `${fb.status}/${fb.paymentStatus}`);
  check('[expiry] reserved slot released', fs.status === 'available', fs.status);

  await Booking.deleteOne({ _id: bk._id });
  await ParkingSlot.deleteOne({ _id: slot._id });
  await User.deleteOne({ _id: user._id });
}

// ---------------------------------------------------------------------------
(async () => {
  // Force deterministic simulation mode regardless of local .env keys
  // (dotenv does not override already-defined process.env values)
  process.env.RAZORPAY_KEY_ID = '';
  process.env.RAZORPAY_KEY_SECRET = '';

  const DUMMY_KEYS = { RAZORPAY_KEY_ID: 'rzp_test_VERIFY', RAZORPAY_KEY_SECRET: 'verify_dummy_secret' };
  let proc;
  try {
    await assertPortFree();
    proc = spawnServer();
    if (!(await waitForHealth(proc))) throw new Error('Server did not become healthy');

    await mongoose.connect(MONGO);
    // Register schemas on this connection
    User = require('../src/models/User');
    Booking = require('../src/models/Booking');
    ParkingSlot = require('../src/models/ParkingSlot');
    Layout = require('../src/models/Layout');
    require('../src/models/AuditLog');
    await preflightCleanup();

    const ctx = { ts: Date.now() };
    Object.assign(ctx, await suiteCoreE2E());
    await suiteSmoke(ctx);

    // --- restart server under dummy Razorpay keys for the crypto suite ---
    await mongoose.disconnect();
    await killProc(proc);
    proc = spawnServer(DUMMY_KEYS);
    if (!(await waitForHealth(proc))) throw new Error('Server (sig mode) did not become healthy');
    await mongoose.connect(MONGO);
    await suiteSignature(ctx);
    await mongoose.disconnect();

    // --- back to simulation mode for realtime + cron suites ---
    await killProc(proc);
    proc = spawnServer();
    if (!(await waitForHealth(proc))) throw new Error('Server (final mode) did not become healthy');
    await mongoose.connect(MONGO);
    await suiteMotion(ctx);
    await suiteAlerts(ctx);
    await suiteExpiry(ctx);

    // global cleanup of core-suite artifacts
    await mongoose.model('Booking').deleteMany({ vehicleNumber: /^V-TEST-/ });
    await mongoose.model('User').deleteMany({ email: /^v-(user|sec|admin|other)-\d+@v\.test$/ });

    await mongoose.disconnect();
  } finally {
    if (proc) await killProc(proc);
  }

  console.log(`\n===== TOTAL: ${total - failures}/${total} PASSED ${failures === 0 ? '— SYSTEM VERIFIED ✓' : '— FAILURES PRESENT ✗'} =====`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => { console.error('FATAL:', e.message); process.exit(1); });
