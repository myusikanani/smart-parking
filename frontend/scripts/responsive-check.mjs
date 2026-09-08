// Automated multi-viewport overflow check (requirement #12).
// Usage: node scripts/responsive-check.mjs <userToken> <securityToken> <adminToken> [concurrency]
// Requires: backend on :5000 and `vite preview` on :4173.
import { chromium } from 'playwright';

const [userToken, securityToken, adminToken] = process.argv.slice(2);
const CONCURRENCY = Number(process.argv[5] || 4);
const BASE = 'https://localhost:4173';

const VIEWPORTS = [
  { name: '320px', width: 320, height: 700 },
  { name: '375px', width: 375, height: 812 },
  { name: '390px', width: 390, height: 844 },
  { name: '430px', width: 430, height: 932 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '1440px', width: 1440, height: 900 },
];

const ROUTES = [
  { path: '/', role: 'public' },
  { path: '/available-slots', role: 'public' },
  { path: '/login', role: 'public' },
  { path: '/register', role: 'public' },
  { path: '/about', role: 'public' },
  { path: '/contact', role: 'public' },
  { path: '/demo-3d', role: 'public' },

  { path: '/dashboard', role: 'user' },
  { path: '/dashboard/book-parking', role: 'user' },
  { path: '/dashboard/live-map', role: 'user' },
  { path: '/available-parking', role: 'user' },
  { path: '/booking-history', role: 'user' },
  { path: '/qr-code', role: 'user' },
  { path: '/waiting-list', role: 'user' },
  { path: '/notifications', role: 'user' },
  { path: '/profile', role: 'user' },

  { path: '/security', role: 'security' },
  { path: '/security/qr-scanner', role: 'security' },
  { path: '/security/vehicle-entry', role: 'security' },
  { path: '/security/vehicle-exit', role: 'security' },
  { path: '/security/logs', role: 'security' },
  { path: '/security/manual-plate', role: 'security' },

  { path: '/admin', role: 'admin' },
  { path: '/admin/users', role: 'admin' },
  { path: '/admin/slots', role: 'admin' },
  { path: '/admin/bookings', role: 'admin' },
  { path: '/admin/revenue', role: 'admin' },
  { path: '/admin/reports', role: 'admin' },
  { path: '/admin/analytics', role: 'admin' },
  { path: '/admin/no-show', role: 'admin' },
  { path: '/admin/overstay', role: 'admin' },
  { path: '/admin/waiting-list', role: 'admin' },
  { path: '/admin/pricing', role: 'admin' },
  { path: '/admin/settings', role: 'admin' },
  { path: '/admin/audit-logs', role: 'admin' },
  { path: '/admin/layout-designer', role: 'admin' },
  { path: '/admin/ai-analytics', role: 'admin' },
];

const tokenFor = (role) =>
  role === 'user' ? userToken : role === 'security' ? securityToken : role === 'admin' ? adminToken : '';

// Build the full matrix.
const jobs = [];
for (const route of ROUTES) {
  for (const vp of VIEWPORTS) jobs.push({ route, vp });
}

const browser = await chromium.launch();
let cursor = 0;
let checked = 0;
const fails = [];

async function worker() {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    const { route, vp } = job;
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, ignoreHTTPSErrors: true });
    const page = await ctx.newPage();
    const token = tokenFor(route.role);
    if (token) await page.addInitScript((t) => localStorage.setItem('token', t), token);
    let outcome = 'OK';
    let offenders = '';
    try {
      await page.goto(BASE + route.path, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(1500).catch(() => {});
      const res = await page.evaluate(() => {
        const de = document.documentElement;
        const overflowX = Math.max(de.scrollWidth, document.body.scrollWidth) - window.innerWidth;
        if (overflowX <= 1) return { overflowX: 0 };
        const bad = [];
        const isContained = (el) => {
          let p = el.parentElement;
          while (p && p !== document.body) {
            const o = getComputedStyle(p).overflowX;
            // hidden/clip clip outright; auto/scroll contain via internal scroll
            if (o === 'hidden' || o === 'clip' || o === 'auto' || o === 'scroll') return true;
            p = p.parentElement;
          }
          return false;
        };
        document.querySelectorAll('body *').forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > window.innerWidth + 1 && !el.children.length && !isContained(el)) {
            const cls = typeof el.className === 'string' ? el.className.slice(0, 60) : el.tagName;
            bad.push(`${el.tagName.toLowerCase()}[${cls}]@+${Math.round(r.right - window.innerWidth)}px`);
          }
        });
        return { overflowX, bad: bad.slice(0, 3) };
      });
      if (res.overflowX > 1) {
        // Re-measure after settling — ignore render-timing transients
        await page.waitForTimeout(900).catch(() => {});
        const re = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
        if (re <= 1) outcome = 'OK';
        else {
          outcome = `OVERFLOW +${re}px`;
          offenders = (res.bad || []).join(' | ');
        }
      }
    } catch (err) {
      outcome = `ERROR ${String(err.message || err).slice(0, 50)}`;
    }
    checked++;
    console.log(`[${outcome}] ${vp.name} ${route.path}${offenders ? '  <- ' + offenders : ''}`);
    if (outcome !== 'OK') fails.push({ route: route.path, vp: vp.name, outcome, offenders });
    await ctx.close().catch(() => {});
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
await browser.close();

console.log('\n========================================');
console.log(`Checked ${checked} route x viewport combinations`);
console.log(`Failures: ${fails.length}`);
fails.forEach((f) => console.log(`  ${f.vp} ${f.route}: ${f.outcome} ${f.offenders}`));
process.exit(fails.length ? 2 : 0);
