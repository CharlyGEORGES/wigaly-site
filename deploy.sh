#!/usr/bin/env bash
# Met en ligne : construit le site, puis pousse sur main un commit dont l'arbre est exactement le contenu de out/.
# Usage : ./deploy.sh "Message de commit"   (ajouter --essai pour voir ce qui partirait, sans rien pousser)
set -euo pipefail
cd "$(dirname "$0")"
essai=0; [ "${2:-}" = "--essai" ] && essai=1
msg="${1:?Usage : ./deploy.sh \"Message de commit\" [--essai]}"

python3 build.py
git fetch -q origin main
gitdir=$(git rev-parse --absolute-git-dir)
index=$(mktemp); rm -f "$index"; trap 'rm -f "$index"' EXIT
tree=$(cd out && GIT_DIR="$gitdir" GIT_WORK_TREE="$PWD" GIT_INDEX_FILE="$index" git add -A . \
            && GIT_DIR="$gitdir" GIT_INDEX_FILE="$index" git write-tree)
parent=$(git rev-parse origin/main)

if [ "$(git rev-parse "$parent^{tree}")" = "$tree" ]; then echo "Rien à publier : main contient déjà ce site."; exit 0; fi
echo "Changements par rapport au site en ligne :"
git diff --stat "$parent" "$tree"
[ "$essai" = 1 ] && { echo "Essai : rien n'a été poussé."; exit 0; }

commit=$(printf '%s\n' "$msg" | git commit-tree "$tree" -p "$parent")
git push origin "$commit:refs/heads/main"
echo "En ligne dans une minute environ : https://wigaly.fr"
