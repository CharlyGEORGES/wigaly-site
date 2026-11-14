// La machine répond-elle en rapport avec ce qu'on pose ? Dans un vrai navigateur : node tests/drop.js
// Le site construit doit être servi sur le port 8765.
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const logs = [];
  let fails = 0;
  const open = async (w, h, opts) => {
    const ctx = await browser.newContext(Object.assign({ viewport: { width: w, height: h } }, opts || {}));
    const page = await ctx.newPage();
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text()); });
    page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message));
    await page.goto('http://127.0.0.1:8765/index.html', { waitUntil: 'load' });
    await page.waitForTimeout(1200);
    return page;
  };
  const expect = (label, got, want) => { const ok = got === want.replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0'); if (!ok) fails++; console.log((ok ? 'ok   ' : 'ÉCHEC') + ' ' + label + ' → ' + got + (ok ? '' : '   (attendu : ' + want + ')')); };

  // 1. Mouvement réduit : la réponse s'affiche tout de suite, on enchaîne les cas
  let page = await open(1440, 900, { reducedMotion: 'reduce' });
  const cases = [
    ['Facture EDF de mars', '« Facture EDF de mars » devient « Écriture EDF prête ».'],
    ['banane', /^« banane » devient « .*Banane.* »\.$/],
    ['1+1', '« 1+1 » devient « Résultat : 2 ».'],
    ["n'importe quoi", "« n'importe quoi » devient « Quelque chose, enfin »."],
    ['rien', '« rien » devient « Rien à faire. Parfait. »'],
    ['ma femme', '« ma femme » devient « On ne trie pas les gens ».'],
    ['mon chef veut un reporting pour lundi', '« mon chef veut un report… » devient « Rapport du lundi généré ».'],
    ['<b>gras</b> & "guillemets"', '« <b>gras</b> & "guilleme… » devient « Balises neutralisées ».'],
  ];
  for (const [input, want] of cases) {
    await page.fill('#drop-in', input);
    await page.click('#drop button[type=submit]');
    await page.waitForTimeout(80);
    const got = await page.textContent('#drop-out');
    if (want instanceof RegExp) { const ok = want.test(got.replace(/\u00a0/g, ' ')); if (!ok) fails++; console.log((ok ? 'ok   ' : 'ÉCHEC') + ' ' + input + ' → ' + got); } else expect(input, got, want);
  }
  for (const b of ['Facture de mars', 'Réunion du lundi', 'Excel à 47 onglets']) {
    await page.click('[data-try="' + b + '"]'); await page.waitForTimeout(80);
    console.log('     bouton « ' + b + ' » → ' + await page.textContent('#drop-out'));
  }
  expect('aucune balise injectée', String(await page.evaluate(() => document.querySelectorAll('#drop-out b, #mach b').length)), '0');
  expect('longueur maximale du champ', await page.getAttribute('#drop-in', 'maxlength'), '80');
  await page.close();

  // 2. Avec le mouvement : l'élément passe sous la presse, puis l'annonce et le journal donnent la réponse
  page = await open(1440, 900);
  await page.fill('#drop-in', 'un éléphant rose');
  await page.click('#drop button[type=submit]');
  expect('annonce immédiate', await page.textContent('#drop-out'), '« un éléphant rose » est sur le tapis, la presse arrive.');
  let fin = null;
  for (let i = 0; i < 40 && !fin; i++) { await page.waitForTimeout(500); const t = await page.textContent('#drop-out'); if (/devenu/.test(t)) fin = t; }
  expect('annonce finale reprend les mots', String(/^« un éléphant rose » est devenu « .*Éléphant rose.* »\.$/.test((fin || '').replace(/\u00a0/g, ' '))), 'true');
  const dit = (/devenu « (.*) »/.exec((fin || '').replace(/\u00a0/g, ' ')) || [])[1] || '';
  await page.screenshot({ path: 'shots/d-desktop.png', clip: { x: 0, y: 440, width: 1440, height: 440 } });
  await page.evaluate(() => document.getElementById('rules').scrollIntoView({ block: 'center' })); await page.waitForTimeout(600);
  expect('journal', dit && (await page.textContent('#journal')).replace(/\u00a0/g, ' ').includes(dit) ? 'présent' : 'absent', 'présent');
  await page.close();

  // 3. Petit écran : la réponse tient dans 23 caractères
  page = await open(390, 844, { isMobile: true, hasTouch: true });
  await page.evaluate(() => document.getElementById('drop').scrollIntoView({ block: 'end' })); await page.waitForTimeout(400);
  await page.fill('#drop-in', 'Réunion de 2 h');
  await page.click('#drop button[type=submit]');
  fin = null;
  for (let i = 0; i < 40 && !fin; i++) { await page.waitForTimeout(500); const t = await page.textContent('#drop-out'); if (/devenu/.test(t)) fin = t; }
  const out = (/devenu «\u00a0(.*)\u00a0»/.exec(fin || '') || [])[1] || '';
  expect('petit écran, longueur ≤ 23', String(out.length <= 23 && out.length > 0), 'true');
  console.log('     petit écran : ' + fin);
  await page.evaluate(() => document.getElementById('mach').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
  await page.screenshot({ path: 'shots/d-mobile.png' });
  await page.close();

  console.log('LOGS: ' + JSON.stringify(logs));
  await browser.close();
  if (fails || logs.length) { console.log(fails + ' échec(s)'); process.exit(1); }
})();
