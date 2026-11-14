// usage: node shot.js <name> <width> <height> <scheme> [fullpage] [waitMs] [reduce]
const { chromium } = require('playwright');
(async () => {
  const [name, w, h, scheme, full, wait, red] = process.argv.slice(2);
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, colorScheme: scheme || 'light', reducedMotion: red === 'reduce' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
  page.on('requestfailed', r => logs.push('REQFAIL: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) logs.push('HTTP ' + r.status() + ' ' + r.url()); });
  await page.goto(process.env.URL || 'http://127.0.0.1:8765/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(+(wait || 4500));
  await page.screenshot({ path: 'shots/' + name + '.png', fullPage: full === 'full' });
  console.log(name, 'logs:', JSON.stringify(logs));
  await browser.close();
})();
