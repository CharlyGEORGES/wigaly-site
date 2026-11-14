# Site wigaly.fr : les sources

La branche `main` contient le site tel que GitHub Pages le sert sur https://wigaly.fr. Cette branche contient ce qui sert à le fabriquer.

## Contenu

| Chemin | Rôle |
| --- | --- |
| `src/index.html`, `src/site.css`, `src/site.js` | Page d'accueil : gabarit, styles, script |
| `src/reply.js` | Les règles de la machine : ce que devient ce que le visiteur pose sur le tapis |
| `src/mentions.html`, `src/404.html`, `src/page.css` | Mentions légales et page 404 |
| `src/fonts/` | Polices réduites aux caractères latins, avec leur licence |
| `src/qr.json` | Code QR affiché dans la démo du boîtier |
| `assets/` | Image de partage et icônes |
| `build.py` | Assemble le site dans `out/` |
| `assets.js` | Régénère l'image de partage et les icônes |
| `deploy.sh` | Construit puis met en ligne sur `main` |
| `tests/` | Vérifications dans un vrai navigateur |

## Construire

    python3 build.py

Python 3 suffit, sans paquet à installer. Le script incorpore les styles et le script dans la page, calcule les empreintes de la politique de sécurité (CSP), mesure le poids affiché en pied de page et écrit `out/`. Il écrit aussi `preview/`, une variante en un seul fichier, polices comprises.

## Vérifier

    node tests/reply.test.js
    python3 -m http.server 8765 --directory out
    npm install playwright
    node tests/inter.js
    node tests/more.js
    node tests/drop.js

`reply.test.js` vérifie les règles de la machine sans navigateur. Les trois autres tournent dans un vrai navigateur : `inter.js` joue les interactions (machine, journal, démos, formulaire), `more.js` couvre les autres largeurs d'écran, le mouvement réduit, les mentions légales et la page 404, `drop.js` pose des éléments sur le tapis et lit les réponses. Tous trois doivent se terminer par `LOGS: []` : aucune erreur de console, aucune ressource bloquée par la CSP.

## Les règles de la machine

`src/reply.js` décide ce que devient un élément posé sur le tapis. Aucune IA, aucun appel réseau : des règles, dans cet ordre.

1. Les sujets qu'on laisse aux humains (deuil, santé, personnes, politique) reçoivent une réponse sobre, jamais une blague.
2. Les formes reconnaissables : calcul, date, heure, montant, adresse, lien, nom de fichier.
3. La conversation et les clins d'œil maison.
4. Les familles de travail (facture, réunion, devis, ticket…), avec une précision reprise du texte quand il y en a une : un nom, un mois, un jour, un numéro.
5. Le quotidien de bureau, les questions, les verbes.
6. À défaut, une tournure invariable construite avec les mots reçus.

Pour ajouter une famille : une ligne dans la table `FAM`, avec au moins une réponse de 23 caractères au plus pour les petits écrans. Le test le vérifie.

## Raccorder le formulaire de contact

Renseigner `ENDPOINT` en tête de `build.py` avec l'adresse qui reçoit les demandes, puis reconstruire. Le formulaire envoie une requête POST en JSON avec les champs `nom`, `email`, `besoin` et `page`. La CSP autorise automatiquement cette adresse.

## Mettre en ligne

    ./deploy.sh "Message de commit"

Le script reconstruit le site, puis pousse sur `main` un commit dont le contenu est exactement celui de `out/`. Avec `--essai` en second argument, il montre ce qui partirait sans rien pousser. GitHub Pages publie en une minute environ.

## Régénérer l'image de partage

Le site construit doit être servi sur le port 8765.

    node assets.js
    python3 build.py
