const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const logs = [];
  const mk = async (w, h, scheme) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme });
    const page = await ctx.newPage();
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(w + ' ' + m.type() + ': ' + m.text()); });
    page.on('pageerror', e => logs.push(w + ' PAGEERROR: ' + e.message));
    page.on('response', r => { if (r.status() >= 400) logs.push('HTTP ' + r.status() + ' ' + r.url()); });
    await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(2600);
    return page;
  };
  // ---- desktop interactions
  let page = await mk(1440, 900, 'dark');
  await page.fill('#drop-in', 'Facture EDF de mars');
  await page.click('#drop button[type=submit]');
  await page.waitForTimeout(600);
  console.log('drop-out (immediate):', await page.textContent('#drop-out'));
  await page.screenshot({ path: 'shots/i-drop1.png', clip: { x: 0, y: 440, width: 1440, height: 440 } });
  let done = false;
  for (let i = 0; i < 30 && !done; i++) { await page.waitForTimeout(500); const t = await page.textContent('#drop-out'); if (/devenu/.test(t)) { done = true; console.log('drop-out (final) after', (i + 1) * 0.5, 's:', t); } }
  await page.screenshot({ path: 'shots/i-drop2.png', clip: { x: 0, y: 440, width: 1440, height: 440 } });
  console.log('cartouche:', await page.textContent('.cartouche'));
  // rules / journal
  await page.evaluate(() => document.getElementById('rules').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(3500);
  console.log('journal:', (await page.textContent('#journal')).replace(/\s+/g, ' '));
  console.log('m-count:', await page.textContent('#m-count'), '| cycle:', await page.textContent('#m-cycle'));
  await page.screenshot({ path: 'shots/i-rules.png' });
  // plan layer
  await page.evaluate(() => document.querySelector('.layer[data-layer="2"]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1200);
  console.log('plan data-on:', await page.getAttribute('#plan', 'data-on'));
  await page.screenshot({ path: 'shots/i-plan2.png' });
  // products
  await page.evaluate(() => document.getElementById('bs').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(600);
  await page.fill('#bs-w', '300');
  await page.click('#bs-go'); await page.waitForTimeout(1500);
  console.log('bs:', await page.textContent('.bs-stock'), '|', await page.textContent('#bs-msg'), '|', await page.textContent('#bs-cost'), '|', await page.textContent('#bs-go'));
  await page.click('#bs-go'); await page.waitForTimeout(1500); await page.click('#bs-go'); await page.waitForTimeout(1500);
  console.log('bs after 3:', await page.textContent('.bs-stock'), '| btn:', await page.textContent('#bs-go'));
  await page.fill('#bs-w', '400'); await page.waitForTimeout(100);
  console.log('bs btn when short:', await page.textContent('#bs-go'));
  await page.click('#hg-t3'); await page.waitForTimeout(400);
  console.log('hg visible panel:', await page.evaluate(() => [...document.querySelectorAll('#hg [role=tabpanel]')].filter(p => !p.hidden).map(p => p.textContent.trim().slice(0, 40))));
  await page.screenshot({ path: 'shots/i-prod1.png' });
  await page.evaluate(() => document.getElementById('jk').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  const order0 = await page.evaluate(() => [...document.querySelectorAll('#jk-list li')].map(l => l.querySelector('b').textContent + ':' + l.querySelector('.jk-v').textContent));
  await page.click('#jk-list li:nth-child(4) button'); await page.waitForTimeout(700);
  await page.click('#jk-list li:nth-child(4) button'); await page.waitForTimeout(700);
  await page.click('#jk-list li:nth-child(4) button'); await page.waitForTimeout(700);
  await page.click('#jk-list li:nth-child(3) button'); await page.waitForTimeout(700);
  const order1 = await page.evaluate(() => [...document.querySelectorAll('#jk-list li')].map(l => l.querySelector('b').textContent + ':' + l.querySelector('.jk-v').textContent + (l.className ? '[' + l.className + ']' : '')));
  console.log('jk before:', order0.join(' / ')); console.log('jk after :', order1.join(' / '));
  await page.click('#bx-next'); await page.waitForTimeout(500); await page.click('#bx-next'); await page.waitForTimeout(500); await page.click('#bx-next'); await page.waitForTimeout(600);
  console.log('bx page:', await page.evaluate(() => [...document.querySelectorAll('#bx-screen [data-page]')].findIndex(p => !p.hidden)));
  await page.screenshot({ path: 'shots/i-prod2.png' });
  // form
  await page.evaluate(() => document.getElementById('contact').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(500);
  await page.click('#contact-form button[type=submit]'); await page.waitForTimeout(300);
  console.log('form errors:', await page.evaluate(() => [...document.querySelectorAll('#contact-form .err')].map(e => e.textContent)), '| focus:', await page.evaluate(() => document.activeElement.id));
  await page.fill('#nom', 'Test'); await page.fill('#email', 'pas-un-mail'); await page.fill('#besoin', 'Un besoin');
  await page.click('#contact-form button[type=submit]'); await page.waitForTimeout(300);
  console.log('form errors 2:', await page.evaluate(() => [...document.querySelectorAll('#contact-form .err')].map(e => e.textContent)));
  await page.fill('#email', 'test@exemple.fr');
  await page.click('#contact-form button[type=submit]'); await page.waitForTimeout(300);
  console.log('form status:', await page.textContent('#form-status'));
  await page.screenshot({ path: 'shots/i-form.png' });
  // prefill
  await page.fill('#besoin', '');
  await page.evaluate(() => document.querySelector('[data-prefill^="Offre PME"]').click()); await page.waitForTimeout(900);
  console.log('prefill:', await page.inputValue('#besoin'));
  // nav current + away
  console.log('nav class:', await page.getAttribute('#nav', 'class'));
  await page.close();
  // ---- mobile sticky plan
  page = await mk(390, 844, 'light');
  await page.screenshot({ path: 'shots/m-hero.png' });
  await page.evaluate(() => document.querySelector('.layer[data-layer="2"]').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'shots/m-plan.png' });
  console.log('mobile plan data-on:', await page.getAttribute('#plan', 'data-on'), '| overflowX:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await page.close();
  // ---- tablet
  page = await mk(1024, 768, 'light');
  await page.screenshot({ path: 'shots/t-hero.png' });
  console.log('tablet overflowX:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await page.close();
  // ---- laptop 1366
  page = await mk(1366, 768, 'dark');
  await page.screenshot({ path: 'shots/l-hero.png' });
  await page.close();
  console.log('LOGS:', JSON.stringify(logs, null, 1));
  await browser.close();
})();
