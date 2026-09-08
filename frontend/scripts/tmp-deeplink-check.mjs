import { chromium } from 'playwright';
import { readFileSync } from 'fs';

const BASE = 'https://localhost:4173';
const tokens = JSON.parse(readFileSync(process.env.TEMP + '\\resp-tokens.json', 'utf8'));
const api = async (path, opts = {}, tok = tokens.user) => {
  const r = await fetch(BASE + path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}`, ...(opts.headers || {}) },
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};

let pass = 0, fail = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${m}`); c ? pass++ : fail++; };

// 1. Create a pending booking via API
const start = new Date(Date.now() + 3600e3);
const end = new Date(Date.now() + 3 * 3600e3);
// Use time-window availability so slots held by REAL users' live bookings
// in this window are excluded (physical status alone is not enough).
const avail = await api(`/api/slots/available?startTime=${encodeURIComponent(start.toISOString())}&endTime=${encodeURIComponent(end.toISOString())}`);
const free = avail.data.slots?.find((s) => s.status === 'available');
ok(!!free, `free slot found (${free?.number})`);
const cr = await api('/api/bookings', { method: 'POST', body: JSON.stringify({ slotId: free._id, vehicleNumber: 'DL-8-FIX01', startTime: start.toISOString(), endTime: end.toISOString() }) });
ok(cr.status === 201 && cr.data.booking?._id, `booking created ${cr.data.booking?._id}`);
const bid = cr.data.booking._id;
const expectedAmount = cr.data.booking.amount;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
await page.addInitScript(([t]) => localStorage.setItem('token', t), [tokens.user]);

// 2. Deep-link /payment WITHOUT router state (the ₹0.00 / N/A repro)
await page.goto(`${BASE}/payment?bookingId=${bid}`, { waitUntil: 'domcontentloaded' });
const main = page.locator('main');
await page.waitForSelector('button:has-text("PAY NOW")', { timeout: 45000 });
let body = await main.textContent();
ok(!body.includes('₹0.00'), 'no ₹0.00 anywhere on page');
ok(!/Slot\s*\n?\s*N\/A/.test(body) && !body.includes('N/A'), 'no N/A placeholders');
ok(body.includes(expectedAmount.toFixed(2)) || body.includes(`₹${expectedAmount}`), `correct total ₹${expectedAmount} displayed`);
ok(body.includes(free.number), `slot number ${free.number} displayed`);
ok(body.includes('PAYMENT REQUIRED'), 'badge shows PAYMENT REQUIRED');
ok(!body.toUpperCase().includes('PAYMENT FAILED'), 'no false Payment Failed state');

// 3. Pay Now → simulated verify → success page with details
await page.locator('button:has-text("PAY NOW")').first().click();
try { await page.waitForURL('**/payment-success**', { timeout: 20000 }); } catch {}
await page.waitForTimeout(1200);
ok(page.url().includes('/payment-success'), 'redirected to success page');
const sBody = await page.textContent('body');
ok(sBody.includes('Payment Successful') || sBody.includes('PAYMENT SUCCESSFUL'), 'success banner shown');
ok(/Transaction ID|TRANSACTION ID/i.test(sBody), 'transaction id shown');
ok(/razorpay/i.test(sBody), 'razorpay payment id shown');

// 4. History shows it; admin sees it
await page.goto(`${BASE}/dashboard/payments`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('main', { timeout: 45000 });
await page.waitForTimeout(2000);
const hBody = await page.locator('main').textContent();
ok(hBody.includes(expectedAmount.toFixed(2)), 'txn appears in user history with amount');

const adminCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
const ap = await adminCtx.newPage();
await ap.addInitScript(([t]) => localStorage.setItem('token', t), [tokens.admin]);
await ap.goto(`${BASE}/admin/payments`, { waitUntil: 'domcontentloaded' });
await ap.waitForSelector('table, .glass-card', { timeout: 45000 });
await ap.waitForTimeout(2500);
const aBody = await ap.textContent('body');
const adminList = await api('/api/payments?limit=50', {}, tokens.admin);
ok(adminList.data.transactions?.some((t) => t.bookingId === bid) || aBody.includes('DL-8-FIX01'), 'admin management lists the transaction');

await browser.close();
console.log(`\n========================================\nDeep-link fix check: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

