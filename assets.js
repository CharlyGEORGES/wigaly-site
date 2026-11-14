// Produit assets/og.png (1200x630), assets/apple-touch-icon.png (180) et assets/favicon-{16,32,48}.png
// à partir du site construit (out/), servi sur le port 8765.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  fs.mkdirSync('assets', { recursive: true });
  const browser = await chromium.launch();
  // ---- image de partage : le haut de page réel, recadré
  let ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light', bypassCSP: true });
  let page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'load' });
  await page.addStyleTag({ content: `
    .nav,.skip,.cur,.loader,.hero-sub,.band-ui{display:none!important}
    html,body{height:630px;overflow:hidden}
    .hero{height:630px}
    .hero-top{display:block;max-width:none;padding:${process.env.OG_TOP || 42}px 64px 0}
    .og-logo{display:flex;align-items:center;gap:13px;font:700 30px/1 var(--display);letter-spacing:-.02em;margin-bottom:${process.env.OG_GAP || 26}px}
    .og-logo i{width:16px;height:16px;border-radius:3px;background:var(--signal);transform:rotate(45deg)}
    .hero h1{font-size:${process.env.OG_FS || 54}px;line-height:1.07}
    .band{position:absolute;left:0;right:0;bottom:0;height:${process.env.OG_BAND || 362}px;opacity:1}
    #mach{position:absolute;inset:0;height:100%}
  ` });
  await page.evaluate(() => {
    const l = document.createElement('div'); l.className = 'og-logo'; l.innerHTML = '<i></i>wigaly';
    const top = document.querySelector('.hero-top'); top.insertBefore(l, top.firstChild);
  });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(3200);
  // l'instant retenu : le bras amène une sortie jaune au-dessus du tapis, une entrée blanche attend sous la presse levée
  await page.waitForFunction(() => {
    const m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(document.getElementById('wrist').getAttribute('transform') || '');
    const slot = [...document.querySelectorAll('#chipsIn .chip')].some(g => /translate\(320\.0 /.test(g.getAttribute('transform') || ''));
    return m && +m[1] > 557 && +m[2] > 176 && +m[2] < 186 && +document.getElementById('head').getAttribute('y') < 290.5 && slot;
  }, null, { polling: 16, timeout: 30000 });
  await page.screenshot({ path: 'assets/og.png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('og chips:', await page.evaluate(() => [...document.querySelectorAll('#mach .chip text')].map(t => t.textContent).join(' | ')));
  await ctx.close();
  // ---- icônes
  const mark = '<rect x="20" y="20" width="24" height="24" rx="4" fill="#FFD166" transform="rotate(45 32 32)"/>';
  const icon = async (size, body, file, opaque) => {
    const c = await browser.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    const p = await c.newPage();
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block}</style><svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">${body}</svg>`);
    await p.screenshot({ path: 'assets/' + file, omitBackground: !opaque });
    await c.close();
  };
  await icon(180, '<rect width="64" height="64" fill="#1634D0"/>' + mark, 'apple-touch-icon.png', true);
  for (const s of [16, 32, 48]) await icon(s, '<rect width="64" height="64" rx="14" fill="#1634D0"/>' + mark, 'favicon-' + s + '.png', false);
  await browser.close();
  console.log(fs.readdirSync('assets').map(f => f + ':' + fs.statSync('assets/' + f).size).join('  '));
})();
