import { chromium } from 'playwright';
const BASE = 'https://localhost:4173';
const email = `probe-def-${Date.now()}@test.parksmart`;
const reg = await fetch('http://localhost:5000/api/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Probe Def', email, phone: '9990002222', password: 'Test@1234' }),
}).then((r) => r.json());
console.log('register:', reg?.success);
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 375, height: 812 }, ignoreHTTPSErrors: true })).newPage();
await p.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
await p.getByPlaceholder('Email address').fill(email);
await p.getByPlaceholder('Password').fill('Test@1234');
await p.getByRole('button', { name: /sign in/i }).click();
await p.waitForURL('**/dashboard', { timeout: 20000 });
await p.goto(BASE + '/book-parking', { waitUntil: 'domcontentloaded' });
await p.waitForSelector('select', { timeout: 30000 });
await p.waitForTimeout(2500);
const info = await p.evaluate(() => {
  const btn = [...document.querySelectorAll('button')].find((x) => /confirm & reserve/i.test(x.textContent));
  return {
    confirmEnabled: btn ? !btn.disabled : null,
    timeValue: document.querySelector('select')?.value,
    dateValue: document.querySelector('input[type=date]')?.value,
  };
});
console.log(JSON.stringify(info));
const nowH = new Date().getHours();
let pass = info.confirmEnabled === true;
if (!pass) console.log('FAIL  Confirm not enabled by default');
else if (info.timeValue && Number(info.timeValue.split(':')[0]) <= nowH && info.dateValue === new Date().toISOString().slice(0, 10)) {
  // same-hour start is only acceptable if the hour just began
  const m = new Date().getMinutes();
  if (m > 5) { pass = false; console.log('FAIL  default time is in the past'); }
}
if (pass) console.log(`PASS  defaults valid (date=${info.dateValue} time=${info.timeValue}) and Confirm enabled`);
await b.close();
process.exit(pass ? 0 : 1);
