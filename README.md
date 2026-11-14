# Site wigaly.fr : les sources

La branche `main` contient le site tel que GitHub Pages le sert sur https://wigaly.fr. Cette branche contient ce qui sert à le fabriquer.

## Contenu

| Chemin | Rôle |
| --- | --- |
| `src/index.html`, `src/site.css`, `src/site.js` | Page d'accueil : gabarit, styles, script |
| `src/mentions.html`, `src/404.html`, `src/page.css` | Mentions légales et page 404 |
| `src/fonts/` | Polices réduites aux caractères latins, avec leur licence |
| `src/qr.json` | Code QR affiché dans la démo du boîtier |
| `assets/` | Image de partage et icônes |
| `build.py` | Assemble le site dans `out/` |
| `assets.js` | Régénère l'image de partage et les icônes |
| `tests/` | Vérifications dans un vrai navigateur |

## Construire

    python3 build.py

Python 3 suffit, sans paquet à installer. Le script incorpore les styles et le script dans la page, calcule les empreintes de la politique de sécurité (CSP), mesure le poids affiché en pied de page et écrit `out/`. Il écrit aussi `preview/`, une variante en un seul fichier, polices comprises.

## Vérifier

    python3 -m http.server 8765 --directory out
    npm install playwright
    node tests/inter.js
    node tests/more.js

`inter.js` joue les interactions (machine, journal, démos, formulaire). `more.js` couvre les autres largeurs d'écran, le mouvement réduit, les mentions légales et la page 404. Les deux doivent se terminer par `LOGS: []` : aucune erreur de console, aucune ressource bloquée par la CSP.

## Raccorder le formulaire de contact

Renseigner `ENDPOINT` en tête de `build.py` avec l'adresse qui reçoit les demandes, puis reconstruire. Le formulaire envoie une requête POST en JSON avec les champs `nom`, `email`, `besoin` et `page`. La CSP autorise automatiquement cette adresse.

## Mettre en ligne

Copier le contenu de `out/` à la racine de la branche `main`, valider, pousser. GitHub Pages publie en une minute environ.

## Régénérer l'image de partage

Le site construit doit être servi sur le port 8765.

    node assets.js
    python3 build.py
