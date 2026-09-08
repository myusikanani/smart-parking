import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 320, height: 700 } });
await page.goto('http://localhost:4173/login', { waitUntil: 'load' });
await page.waitForTimeout(2000);
const measure = () => page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
console.log('baseline', await measure());
for (const [label, css] of [
  ['hide intro', '.intro-ad-stage{display:none!important}'],
  ['hide cursorglow', 'body > div:last-of-type{display:none!important}'],
  ['hide chat fab', '.fixed.bottom-6.right-6{display:none!important}'],
]) {
  await page.addStyleTag({ content: css }).catch(()=>{});
  console.log(label, await measure());
}
// inspect direct children widths of body/#root/root-div
const tree = await page.evaluate(() => {
  const out = [];
  const dump = (el, label) => {
    for (const c of el.children) {
      const r = c.getBoundingClientRect();
      out.push(label + ' <' + c.tagName.toLowerCase() + (c.id ? '#'+c.id : '') + ' cls="' + String(c.className).slice(0,50) + '" rect=' + Math.round(r.left) + '..' + Math.round(r.right));
    }
  };
  dump(document.body, 'body>');
  const rootDiv = document.getElementById('root')?.firstElementChild;
  if (rootDiv) dump(rootDiv, 'approot>');
  return out;
});
console.log(tree.join('\n'));
await browser.close();
