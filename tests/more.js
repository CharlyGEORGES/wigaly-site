const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const logs = [];
  const mk = async (w, h, scheme, url, opts) => {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: w, height: h }, colorScheme: scheme }, opts || {}));
    const page = await ctx.newPage();
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(w + ' ' + m.type() + ': ' + m.text()); });
    page.on('pageerror', e => logs.push(w + ' PAGEERROR: ' + e.message));
    page.on('requestfailed', r => logs.push('REQFAIL: ' + r.url()));
    page.on('response', r => { if (r.status() >= 400) logs.push('HTTP ' + r.status() + ' ' + r.url()); });
    await page.goto('http://127.0.0.1:8765/' + (url || 'index.html'), { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    return page;
  };
  const ox = p => p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  let page = await mk(1920, 1080, 'light');
  await page.screenshot({ path: 'shots/x-1920.png' });
  console.log('1920 overflowX', await ox(page)); await page.close();

  page = await mk(360, 640, 'light');
  await page.screenshot({ path: 'shots/x-360.png' });
  console.log('360 overflowX', await ox(page));
  await page.evaluate(() => document.getElementById('drop').scrollIntoView({ block: 'end' })); await page.waitForTimeout(500);
  await page.screenshot({ path: 'shots/x-360-band.png' }); await page.close();

  page = await mk(1440, 900, 'light', 'index.html', { reducedMotion: 'reduce' });
  await page.screenshot({ path: 'shots/x-reduce.png' });
  await page.click('[data-try="Facture de mars"]'); await page.waitForTimeout(300);
  console.log('reduce drop-out:', await page.textContent('#drop-out'));
  console.log('reduce h1 spans:', await page.evaluate(() => document.querySelectorAll('.hero h1 .w').length), 'loader display:', await page.evaluate(() => getComputedStyle(document.querySelector('.loader')).display));
  await page.close();

  // curseur : anneau au survol
  page = await mk(1440, 900, 'light');
  await page.mouse.move(700, 300); await page.waitForTimeout(200);
  const cta = await page.locator('.hero .cta .btn-signal').boundingBox();
  await page.mouse.move(cta.x + cta.width / 2, cta.y + cta.height / 2, { steps: 12 }); await page.waitForTimeout(700);
  await page.screenshot({ path: 'shots/x-cursor.png', clip: { x: cta.x - 80, y: cta.y - 60, width: 560, height: 170 } });
  console.log('cursor class:', await page.getAttribute('.cur', 'class'));
  // règles en 4 colonnes étroites, après quelques cycles
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.evaluate(() => document.getElementById('rules').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(700);
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
  await page.fill('#drop-in', 'Contrat de 80 pages signé');
  await page.click('#drop button[type=submit]');
  await page.evaluate(() => document.getElementById('rules').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(13000);
  await page.screenshot({ path: 'shots/x-rules-1200.png' });
  console.log('journal 1200:', (await page.textContent('#journal')).replace(/\s+/g, ' '));
  console.log('inst heights:', await page.evaluate(() => [...document.querySelectorAll('.inst')].map(i => Math.round(i.getBoundingClientRect().height))));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => document.getElementById('rules').scrollIntoView({ block: 'center' })); await page.waitForTimeout(800);
  await page.screenshot({ path: 'shots/x-rules-1440.png' });
  await page.close();

  page = await mk(1440, 900, 'light', 'mentions-legales.html');
  await page.screenshot({ path: 'shots/x-mentions.png', fullPage: true }); await page.close();
  page = await mk(390, 844, 'dark', 'mentions-legales.html');
  await page.screenshot({ path: 'shots/x-mentions-m.png' });
  console.log('mentions mobile overflowX', await ox(page)); await page.close();
  page = await mk(1440, 900, 'light', '404.html');
  await page.screenshot({ path: 'shots/x-404.png' }); await page.close();
  console.log('LOGS:', JSON.stringify(logs, null, 1));
  await browser.close();
})();
