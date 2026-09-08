import { chromium } from 'playwright';
const BASE = 'https://localhost:4173';
const email = `probe-ev-${Date.now()}@test.parksmart`;
await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Probe EV', email, phone: '9990003333', password: 'Test@1234' }),
}).then((r) => r.json());
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 375, height: 812 }, ignoreHTTPSErrors: true })).newPage();
p.on('response', async (res) => {
  if (res.url().includes('/slots/available')) console.log('UI req:', decodeURIComponent(res.url()).slice(60, 200), '->', res.status());
});
await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
await p.getByPlaceholder('Email address').fill(email);
await p.getByPlaceholder('Password').fill('Test@1234');
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/dashboard', { timeout: 20000 });
await p.goto(BASE + '/book-parking', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('select', { timeout: 30000 });
const evCandidates = await p.evaluate(() =>
  [...document.querySelectorAll('*')].filter((el) => /EV Charging/i.test(el.textContent || '') && el.children.length <= 2)
    .map((el) => `${el.tagName}.${(el.className || '').toString().slice(0, 50)}`)
);
console.log('EV candidates:', JSON.stringify(evCandidates.slice(0, 6), null, 1));
await p.getByText(/EV Charging/i).first().click();
await p.waitForTimeout(3500);
const info = await p.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((x) => /confirm & reserve/i.test(x.textContent));
  return {
    confirmEnabled: btn ? !btn.disabled : null,
    bays: [...document.querySelectorAll('[class*=bay], [class*=slot-card], [class*=grid] > div')].slice(0, 8).map((x) => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 25)),
  };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
