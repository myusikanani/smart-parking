// Mobile (375x812) end-to-end flow: Login → Book → Pay (Razorpay Test Mode)
// → Backend verification → Confirmed → QR shown → Security scans (entry /
// re-entry deny / invalid deny / exit) → retry-payment & unpaid-QR negatives.
// Usage: node scripts/mobile-flow-check.mjs <securityToken> [adminToken]
import { chromium } from 'playwright';

const secToken = process.argv[2];
if (!secToken) { console.error('usage: node mobile-flow-check.mjs <securityToken>'); process.exit(1); }
const BASE = 'https://localhost:4173';
const API = 'http://localhost:5000/api';

let pass = 0, fail = 0;
const ok = (cond, label) => {
  if (cond) { pass++; console.log(`PASS  ${label}`); }
  else { fail++; console.log(`FAIL  ${label}`); }
};

const apiPost = async (path, body, token) => {
  const r = await fetch(API + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  let data = {};
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
};
const apiGet = async (path, token) => {
  const r = await fetch(API + path, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  let data = {};
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
};

// 0. Register a fresh test user
const email = `e2e-mobile-${Date.now()}@test.parksmart`;
const reg = await apiPost('/auth/register', { name: 'Mobile E2E', email, phone: '9999999999', password: 'Test@1234' });
ok(reg.status === 201 || reg.status === 200 || reg.data?.token, `register test user (${reg.status})`);
const userToken = reg.data?.token;
ok(!!userToken, 'register returned auth token');

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true });
const page = await ctx.newPage();

try {
  // 1. LOGIN via UI
  await page.goto(BASE + '/login', { waitUntil: 'load' });
  await page.getByPlaceholder('Email address').fill(email);
  await page.getByPlaceholder('Password').fill('Test@1234');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL('**/dashboard', { timeout: 20000 });
  ok(true, 'UI login → redirected to dashboard');

  // 2. BOOKING PAGE (auto-selects first available slot)
  await page.goto(BASE + '/book-parking', { waitUntil: 'load' });
  // Always book TODAY so gate scans work (entry denies scans earlier than
  // start-30min). Within venue hours -> next full hour; late nights -> the
  // last slot (21:00) whose start is already past, which scans like a late
  // arrival. Never book tomorrow - those passes are not yet scannable.
  const nowD = new Date();
  const nh = nowD.getMinutes() > 0 ? nowD.getHours() + 1 : nowD.getHours();
  const hh = nh >= 8 && nh <= 21 ? String(nh).padStart(2, '0') + ':00' : '21:00';
  const fmtLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  try { await page.locator('input[type=date]').fill(fmtLocal(nowD)); } catch { /* default ok */ }
  try { await page.locator('select').first().selectOption(hh); } catch { /* keep default */ }

  // Pick the first VEHICLE CATEGORY that actually has a free bay for the
  // window (like a real user would when their usual type is full).
  const d0 = new Date(); d0.setHours(Number(hh.split(':')[0]), 0, 0, 0);
  const wS = new Date(d0.getTime() - 5.5 * 3600e3).toISOString();
  const wE = new Date(d0.getTime() + 2 * 3600e3 - 5.5 * 3600e3).toISOString();
  let chosenCat = null;
  for (const c of ['four-wheeler', 'two-wheeler', 'ev']) {
    const r2 = await fetch(`${API}/slots/available?category=${c}&startTime=${encodeURIComponent(wS)}&endTime=${encodeURIComponent(wE)}`,
      { headers: { Authorization: `Bearer ${userToken}` } }).then((x) => x.json()).catch(() => null);
    if (r2?.slots?.some((s) => s.status === 'available')) { chosenCat = c; break; }
  }
  ok(!!chosenCat, `category with a free bay found (${chosenCat})`);
  if (chosenCat && chosenCat !== 'four-wheeler') {
    const label = chosenCat === 'ev' ? /EV Charging/i : chosenCat === 'two-wheeler' ? /Two Wheeler/i : /Four Wheeler/i;
    await page.getByRole('button', { name: label }).first().click();
    await page.waitForTimeout(2500);
  }
  const confirmBtn = page.getByRole('button', { name: /confirm & reserve slot/i });
  await confirmBtn.waitFor({ state: 'visible', timeout: 15000 });
  await confirmBtn.click();
  await page.waitForURL('**/payment', { timeout: 20000 });
  ok(true, 'booking created → landed on payment screen');

  // 3. PAY NOW → Razorpay Test Mode simulation → backend verifies
  await page.getByRole('button', { name: /pay now/i }).click();
  await page.waitForURL('**/payment-success', { timeout: 25000 });
  const successText = await page.textContent('body');
  ok(/payment successful/i.test(successText), 'payment successful screen shown');

  // 4. CONFIRMATION → QR PASS visible
  await page.getByRole('button', { name: /view digital qr pass/i }).click();
  await page.waitForURL('**/qr-code', { timeout: 20000 });
  await page.waitForTimeout(1200);
  const qrBody = await page.textContent('body');
  ok(!/no active qr pass/i.test(qrBody), 'QR page did NOT show the unpaid/empty state');
  const imgCount = await page.locator('img').count();
  ok(imgCount > 0, `QR code image rendered (${imgCount} img)`);

  // 5. DB-truth: latest booking is confirmed/paid with server QR
  const mine = await apiGet('/bookings', userToken);
  const paid = (mine.data.bookings || []).find(b => b.paymentStatus === 'paid');
  ok(!!paid, 'backend shows a PAID booking');
  ok(paid?.status === 'confirmed', `booking status CONFIRMED (got: ${paid?.status})`);
  ok(typeof paid?.qrToken === 'string' && paid.qrToken.length > 10, 'secure qrToken stored');
  ok(String(paid?.qrCode || '').startsWith('data:image'), 'QR is server-generated data URL');

  // 6. NEGATIVE: brand-new UNPAID booking must have NO QR and be denied at gate
  let b2 = null;
  for (const offsetH of [0.25, 5, 29, 53]) { // probe several non-overlapping windows
    const s = Date.now() + offsetH * 3600000;
    const e = s + 60 * 60000;
    const avail = await fetch(`${API}/slots/available?startTime=${new Date(s).toISOString()}&endTime=${new Date(e).toISOString()}`).then(r => r.json());
    const slots = avail.slots || [];
    const target = slots.find(sl => String(sl._id) !== String(paid.slot?._id)) || slots[0] || (paid.slot?._id ? { _id: paid.slot._id } : null);
    if (!target) continue;
    const attempt = await apiPost('/bookings', { slotId: target._id, vehicleNumber: 'MH-12-E2E-02', startTime: new Date(s).toISOString(), endTime: new Date(e).toISOString() }, userToken);
    if (attempt.data?.booking?._id) { b2 = attempt; break; }
  }
  if (b2) {
    ok(b2.data?.booking?.status === 'pending' && b2.data?.booking?.paymentStatus === 'pending', 'second booking starts PAYMENT_PENDING');
    ok(!b2.data?.booking?.qrCode && !b2.data?.booking?.qrToken, 'UNPAID booking has NO QR generated');
    const earlyScan = await apiPost('/security/scan', { qrToken: 'forged-token-123', gateMode: 'entry' }, secToken);
    ok(earlyScan.status === 400 && /invalid|unrecognized/i.test(earlyScan.data?.message || ''), 'scanner REJECTS unknown/forged QR');

    // 7. DISMISS/CANCEL → still PAYMENT_PENDING → RETRY works
    await apiPost('/payments/cancel', { bookingId: b2.data.booking._id }, userToken);
    const retryOrder = await apiPost('/payments/create-order', { bookingId: b2.data.booking._id }, userToken);
    ok(retryOrder.data?.success === true, 'retry after dismissal creates new Razorpay order');
    const retryPay = await apiPost('/payments/verify', { bookingId: b2.data.booking._id, razorpay_order_id: retryOrder.data.orderId, razorpay_payment_id: `pay_test_${Date.now()}`, razorpay_signature: 'sim' }, userToken);
    ok(retryPay.data?.booking?.paymentStatus === 'paid' && retryPay.data?.booking?.status === 'confirmed', 'retry payment → CONFIRMED with QR');
    ok(!!retryPay.data?.booking?.qrCode, 'QR generated for retried booking only after verification');
  } else {
    ok(false, 'skipped unpaid/retry negatives — no second slot available');
  }

  // 8. GATE FLOW with a gate-scannable pass.
  // Venue hours (08:00-21:00 starts) can make the UI booking's window far
  // future or fully past depending on run time; entry denies scans outside
  // [start-30min, end+grace]. When needed, mint an extra paid pass via API
  // with a NOW-centered window purely for scanner validation.
  let gate = paid;
  {
    const st = new Date(paid.startTime).getTime();
    const en = new Date(paid.endTime).getTime();
    const nw = Date.now();
    if (nw < st - 30 * 60000 || nw > en + 30 * 60000) {
      const gs = nw - 3600000;
      const ge = nw + 3600000;
      const avail = await fetch(`${API}/slots/available?startTime=${new Date(gs).toISOString()}&endTime=${new Date(ge).toISOString()}`).then(r => r.json());
      const target = (avail.slots || [])[0];
      if (target) {
        const cr = await apiPost('/bookings', { slotId: target._id, vehicleNumber: 'MH-12-E2E-G1', startTime: new Date(gs).toISOString(), endTime: new Date(ge).toISOString() }, userToken);
        const ord = await apiPost('/payments/create-order', { bookingId: cr.data?.booking?._id }, userToken);
        const ver = await apiPost('/payments/verify', { bookingId: cr.data?.booking?._id, razorpay_order_id: ord.data?.orderId, razorpay_payment_id: `pay_test_${Date.now()}`, razorpay_signature: 'sim' }, userToken);
        if (ver.data?.success && ver.data?.booking) { gate = ver.data.booking; ok(true, 'gate-scannable pass created & verified'); }
        else ok(false, `gate-scannable pass creation failed (${ver.data?.message || ord.data?.message || 'unknown'})`);
      } else ok(false, 'no free slot for gate-scannable pass');
    }
  }

  // 8a. REGRESSION: scanner UIs may upper-case decoded text — token must still match
  const su = await apiPost('/security/scan', { qrToken: gate.qrToken.toUpperCase(), gateMode: 'entry' }, secToken);
  ok(su.data?.allowed === true && /entry allowed/i.test(su.data?.message || ''), 'UPPERCASED qrToken ENTRY ALLOWED (case-insensitive match)');
  const s2 = await apiPost('/security/scan', { qrToken: gate.qrToken, gateMode: 'entry' }, secToken);
  ok(s2.data?.allowed === false, 'RE-ENTRY with same QR DENIED (already inside)');
  const s3 = await apiPost('/security/scan', { qrToken: gate.qrToken, gateMode: 'exit' }, secToken);
  ok(s3.status === 200 && (/exit successful/i.test(s3.data?.message || '') || s3.data?.paymentRequired === true), `EXIT processed (${s3.data?.message || ''})`);
  const mineAfter = await apiGet('/bookings', userToken);
  const done = (mineAfter.data.bookings || []).find(b => String(b._id) === String(gate._id));
  ok(done?.status === 'completed' || done?.status === 'active', `final status COMPLETED/ACTIVE (got: ${done?.status})`);

  // 9. NEGATIVE: completed booking can no longer be paid
  const lateOrder = await apiPost('/payments/create-order', { bookingId: gate._id }, userToken);
  ok(lateOrder.data?.success === false && /no longer awaiting payment|already been paid/i.test(lateOrder.data?.message || ''), 'create-order BLOCKED for completed booking');

  // 10. History UI reflects statuses at mobile size
  await page.goto(BASE + '/booking-history', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const histText = await page.textContent('body');
  ok(/completed/i.test(histText), 'history shows COMPLETED badge after exit');

  // ===== PAYMENT MODULE (history + admin management) =====
  // 11. User payment history: own transactions only
  const mine2 = await apiGet('/payments/my', userToken);
  const myTxns = mine2.data.transactions || [];
  ok(myTxns.length >= 1, `user sees own payment history (${myTxns.length} txns)`);
  ok(myTxns.some(t => t.bookingId === String(paid._id) && t.status === 'paid'), 'paid booking appears in user history');
  ok(myTxns.every(t => !t.userEmail && !t.userName), 'user history does not leak other fields');

  // 11b. Isolation: another user must NOT see this user's transactions
  const regB = await apiPost('/auth/register', { name: 'Isolation Check', email: `e2e-iso-${Date.now()}@test.parksmart`, phone: '9999999998', password: 'Test@1234' });
  const tokenB = regB.data?.token;
  const theirs = await apiGet('/payments/my', tokenB);
  ok((theirs.data.transactions || []).length === 0, 'second user sees NO transactions of first user');

  // 12. Admin-only protection: normal user blocked from admin endpoints
  const forbiddenList = await apiGet('/payments', userToken);
  ok(forbiddenList.status === 403, 'user BLOCKED from admin transaction list (403)');
  const forbiddenStats = await apiGet('/payments/stats', userToken);
  ok(forbiddenStats.status === 403, 'user BLOCKED from admin stats (403)');
  const forbiddenDetail = await apiGet(`/payments/${paid._id}`, tokenB);
  ok(forbiddenDetail.status === 403, 'non-owner user BLOCKED from payment detail (403)');

  // 13. Role protection on admin stats
  const statsRes = await apiGet('/payments/stats', secToken); // security role is not admin → expect 403
  ok(statsRes.status === 403, 'security role BLOCKED from admin stats (403)');
  const admTok = process.argv[3];
  if (admTok) {
    const statsAdmin = await apiGet('/payments/stats', admTok);
    ok(statsAdmin.data?.success === true && typeof statsAdmin.data?.stats?.totalRevenue === 'number', `admin stats return live revenue (₹${statsAdmin.data?.stats?.totalRevenue ?? '?'})`);
  }

  // 14. Admin transaction list: filter + search
  const listPaid = await apiGet('/payments?status=paid&page=1&limit=50', admTok);
  const listTxns = listPaid.data.transactions || [];
  ok(listPaid.data.success === true && listTxns.some(t => t.bookingId === String(paid._id)), 'admin list contains the paid booking');
  const searchRes = await apiGet(`/payments?q=${encodeURIComponent('MH-12-E2E')}`, admTok);
  ok((searchRes.data.transactions || []).length >= 1, 'admin search by vehicle number finds bookings');

  // 15. Admin detail endpoint: payment + booking + user sections
  const det = await apiGet(`/payments/${paid._id}`, admTok);
  ok(det.data.payment?.razorpayPaymentId && det.data.booking?.bookingId && det.data.user?.email, 'admin detail returns payment+booking+user info');

  // 16. Idempotent verification: same payment id replays OK, different id rejected
  const replay = await apiPost('/payments/verify', { bookingId: String(paid._id), razorpay_order_id: paid.razorpayOrderId || 'order_x', razorpay_payment_id: paid.razorpayPaymentId, razorpay_signature: 'sim' }, userToken);
  ok(replay.data?.success === true && /already verified/i.test(replay.data?.message || ''), 're-verifying SAME payment id is idempotent (no duplicate)');
  const dupe = await apiPost('/payments/verify', { bookingId: String(paid._id), razorpay_order_id: 'order_other', razorpay_payment_id: 'pay_other_999', razorpay_signature: 'sim' }, userToken);
  ok(dupe.status === 400 && /different transaction/i.test(dupe.data?.message || ''), 'DIFFERENT payment id on paid booking REJECTED');

  // 17. UI: user payment history page renders at mobile size
  await page.goto(BASE + '/dashboard/payments', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const payHistText = await page.textContent('body');
  ok(/payment history/i.test(payHistText) && /PAID/i.test(payHistText), 'user Payment History page shows PAID txn');

  // 18. UI: admin payment management page renders at mobile size (no Pay Now)
  // Uses a dedicated ADMIN browser session — ProtectedRoute blocks normal users.
  if (admTok) {
    const admCtx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, ignoreHTTPSErrors: true });
    const apage = await admCtx.newPage();
    await apage.addInitScript((t) => { try { localStorage.setItem('token', t); } catch {} }, admTok);
    await apage.goto(BASE + '/admin/payments', { waitUntil: 'load' });
    await apage.waitForTimeout(2000);
    const admText = await apage.textContent('body');
    ok(/payment management/i.test(admText), 'admin Payment Management page loads');
    ok(/total revenue/i.test(admText), 'admin revenue cards render live data section');
    ok(!/pay now/i.test(admText), 'admin page has NO Pay Now button');
    // Detail modal opens from the mobile card's View Details button
    const viewBtn = apage.getByRole('button', { name: /view details/i }).first();
    if (await viewBtn.count()) {
      await viewBtn.click();
      await apage.waitForTimeout(1200);
      const modalText = await apage.textContent('body');
      ok(/payment information/i.test(modalText) && /booking information/i.test(modalText) && /user information/i.test(modalText), 'payment detail modal shows all three sections');
    } else {
      ok(false, 'no View-details button found in admin table');
    }
    await admCtx.close();
  }
} catch (err) {
  fail++;
  console.log(`FAIL  exception: ${String(err.message || err).slice(0, 300)}`);
  try { await page.screenshot({ path: '../mobile-flow-failure.png', fullPage: true }); console.log('screenshot saved: mobile-flow-failure.png'); } catch {}
}

await browser.close();

// Teardown: free slots held by this run's paid-but-unused test bookings so
// repeated runs don't exhaust slot inventory (direct DB cleanup helper).
import { spawnSync } from 'node:child_process';
spawnSync(process.execPath, ['scripts\\tmp-cleanup-e2e.js'], { stdio: 'inherit', cwd: '..\\backend' });

console.log('\n========================================');
console.log(`Mobile E2E: ${pass} passed, ${fail} failed`);
process.exit(fail ? 2 : 0);
