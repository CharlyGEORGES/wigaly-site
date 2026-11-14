// Vérifie les règles de la machine (src/reply.js), sans navigateur : node tests/reply.test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'reply.js'), 'utf8');
const reply = new Function(src + '\nreturn reply;')();
const typo = s => s.replace(/ ([:;?!»])/g, '\u00a0$1').replace(/« /g, '«\u00a0');
let checks = 0;
const is = (input, expected, max) => { checks++; assert.strictEqual(reply(input, max), typo(expected), 'pour « ' + input + ' »'); };

// 1. Des réponses attendues, famille par famille
is('Facture EDF de mars', 'Écriture EDF prête');
is('Facture de mars', 'Écriture de mars prête');
is('Facture de mars', 'Écriture compta prête', 21);           // la précision saute quand la place manque
is('la facture n° 4521', 'Écriture n° 4521 prête');
is('Réunion du lundi', 'Compte rendu du lundi');
is('mail de Paul', 'Réponse à Paul prête');
is('un mail de la DRH', 'Réponse à la DRH prête');
is('devis Durand', 'Devis Durand signé');
is('CV de Julie Martin', 'Profil Julie résumé');               // le nom complet ne tient pas, le prénom reste
is('ticket 48213', 'Ticket n° 48213 assigné');
is('rapport T1', 'Rapport T1 généré');
is('mon chef veut un reporting pour lundi', 'Rapport du lundi généré');
is('note de frais', 'Note de frais contrôlée');
is('final_v12_OK_bis.xlsx', 'Une seule version');
is('client mécontent', 'Réclamation qualifiée');
is('données personnelles', 'Registre RGPD à jour');
is('merci pour le devis', 'Devis relancé, signé');             // la politesse cède la place au sujet
is('est-ce que ça marche avec SAP ?', 'Branché sur votre SI');

// 2. Les formes
is('1+1', 'Résultat : 2');
is('2+2=5', 'Erreur trouvée : = 4');
is('2+2=4', 'Exact, et vérifié');
is('(3+4)*2', '= 14, c’est vérifié');
is('1 000 + 250,5', 'Résultat : 1\u00a0250,5');
is('1/0', 'Division par zéro évitée');
is('12/03', 'Rappel posé le 12/03');
is('14h30', 'Créneau 14h30 bloqué');
is('1250 €', '1250 € : c’est rapproché');
is('jean.dupont@acme.fr', 'Contact « Jean » créé');
is('wigaly.fr', 'Vous y êtes déjà');
is('06 12 34 56 78', 'Appel consigné au CRM');
is('06-12-34-56-78', 'Appel consigné au CRM');                 // un numéro, pas une soustraction
is('42', 'La réponse, justement');
is('???', 'Réponse : ça dépend');
is('\ud83d\udc4d', 'Validation enregistrée');

// 3. La conversation et le quotidien
is('bonjour', 'Bonjour à vous aussi');
is('bonjour, une facture', 'Écriture compta prête');
is("n'importe quoi", 'Quelque chose, enfin');
is('essai', 'Essai transformé');
is('rien', 'Rien à faire. Parfait.');
is('L’IA décide ?', 'Non, elle prépare');
is('lundi', 'Lundi, mais en mieux');
is('gagner du temps', 'Temps gagné, mesuré');
is('mon chat', 'Chat : hors périmètre');
is('un thé', 'Pause méritée, validée');
checks++; assert.ok(/Banana/.test(reply('the banana')), 'l’article anglais n’est pas un thé : ' + reply('the banana'));
is('où est Charlie ?', 'Localisé, puis rangé');
is('<script>alert(1)</script>', 'Balises neutralisées');
is("' OR 1=1 --", 'Injection ? Bien tenté.');
is('{{7*7}}', 'Injection ? Bien tenté.');
is('un script python', 'Le bon outil, bien placé');

// 4. Ce qu'on laisse aux humains : jamais de reprise du mot, jamais de blague
const GARDE = ['À traiter entre humains', 'On ne trie pas les gens', 'Hors périmètre, promis', 'Reformulé poliment', 'Version polie archivée'];
for (const t of ['cancer', 'décès', 'licenciement', 'arrêt maladie', 'suicide', 'ma femme', 'mes enfants', 'les gens', 'moi', 'les arabes', 'nazi@x.fr', 'Macron', 'la religion', 'merde', 'putain de facture']) {
  checks++; assert.ok(GARDE.includes(reply(t)), 'garde-fou attendu pour « ' + t + ' » : ' + reply(t));
}
// … sans avaler les mots voisins
for (const t of ['violon', 'violet', 'licence', 'pique-nique', 'carte mère', 'famille de produits', 'données personnelles', '5 jours-homme', 'achat', 'sprint', 'stress', 'SNCF']) {
  checks++; assert.ok(!GARDE.includes(reply(t)), 'faux positif pour « ' + t + ' » : ' + reply(t));
}
is('SNCF', 'SNCF : sigle décodé');                             // un sigle n'est pas une frappe au hasard, et on n'en dit rien
is('sncf', 'SNCF : sigle décodé');
is('brrr', 'Cri bien enregistré');
is('azerty', 'Azerty : clavier testé');

// 5. N'importe quoi : la réponse reprend les mots reçus
let seed = 7;
const rnd = k => ((seed = (Math.imul(seed, 1103515245) + 12345) >>> 0) >>> 8) % k;
const syl = ['ba', 'lo', 'mi', 'ru', 'ta', 'pe', 'ni', 'co', 'du', 'ga', 'vi', 'so', 'lu', 'ne', 'fa', 'ri', 'jo', 'mo', 'tu', 'la', 'bri', 'cha', 'plo', 'gri'];
const mots = [];
while (mots.length < 300) { let w = ''; for (let i = 2 + rnd(3); i > 0; i--) w += syl[rnd(syl.length)]; if (!mots.includes(w)) mots.push(w); }
const gabarits = new Set();
let repris = 0;
for (const w of mots) {
  const r = reply(w), W = w.charAt(0).toUpperCase() + w.slice(1);
  if (r.includes(W)) { repris++; gabarits.add(r.replace(W, '%')); }
}
checks += 2;
assert.ok(repris >= 285, 'les mots inventés doivent se retrouver dans la réponse : ' + repris + ' sur 300');
assert.ok(gabarits.size >= 12, 'les tournures doivent varier : ' + gabarits.size);

// 6. Propriétés valables pour tout : longueur tenue, réponse stable, aucun trou de gabarit oublié
const corpus = mots.concat([
  '', ' ', 'a', 'le', 'x', 'ok', 'banane', 'BANANE', 'une banane', 'ma voiture', 'le toit de la maison', 'il faut refaire le toit de la maison',
  'la vie est belle', 'anticonstitutionnellement', 'supercalifragilisticexpialidocious', 'Camille', 'Jean Dupont', 'Привет', '你好', 'مرحبا',
  '$& $1 $$', '%', '@', '~', 'a%b', '100 % sûr', 'TOUT EN MAJUSCULES ICI', 'être ou ne pas être', 'manger', 'dormir', 'relancer le client',
  'Bonjour je voudrais un devis pour un site web', 'on a 3 Excel qui se contredisent', 'transmettre le dossier à la compta',
  'un texte vraiment très long que personne ne lira jusqu’au bout mais qui doit tenir', '😀😀😀', 'facture 😀', '...', '1+', '((', '3 millions €',
  'le 1er avril 2027', '25/12/2026', 'https://www.exemple.com/une/page?x=1', '+33612345678', '131 445 165', 'l’ordinateur', "d'accord mais non",
]);
for (const max of [25, 23, 21]) for (const t of corpus) {
  const r = reply(t, max);
  checks++;
  assert.ok(typeof r === 'string' && r.length > 0, 'réponse vide pour « ' + t + ' »');
  assert.ok(r.length <= max, 'trop long (' + r.length + ' > ' + max + ') pour « ' + t + ' » : ' + r);
  assert.strictEqual(r, reply(t, max), 'réponse instable pour « ' + t + ' »');
  assert.ok(!/undefined|null|NaN|\[object/.test(r), 'valeur brute dans « ' + r + ' »');
  if (!/[%@~]/.test(t)) assert.ok(!/[%@~]/.test(r), 'trou de gabarit oublié pour « ' + t + ' » : ' + r);
  assert.notStrictEqual(r, 'Classé, tracé, rangé');
}

// 7. Les tables : aucune variante trop longue pour l'étiquette, et toujours une variante courte pour les petits écrans
const lits = [...src.matchAll(/'((?:[^'\\\n]|\\.)*)'/g)].map(m => m[1].replace(/\\u00a0/g, ' ')).filter(t => /^[A-ZÀ-Ý«=]/.test(t) && / /.test(t) && !/\\b|\(\?:/.test(t));
assert.ok(lits.length > 150, 'tables introuvables');
for (const l of lits) {
  const fixes = l.split('|').filter(v => !/[%@~]/.test(v));
  for (const v of fixes) { checks++; assert.ok(v.length <= 25, 'variante trop longue (' + v.length + ') : ' + v); }
}
const familles = [...src.matchAll(/^\s*\[(?:'[^']*'|\/.*?\/),'([^']*)'(?:,1)?\],?$/gm)].map(m => m[1]);
assert.ok(familles.length > 80, 'familles introuvables : ' + familles.length);
for (const f of familles) {
  const fixes = f.split('|').filter(v => !/[%@]/.test(v));
  checks++; assert.ok(fixes.some(v => v.replace('~', 'Chat').length <= 23), 'aucune variante courte : ' + f);
}

console.log('reply.js : ' + checks + ' vérifications passées, ' + gabarits.size + ' tournures pour 300 mots inventés.');
