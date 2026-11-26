#!/usr/bin/env bash
# Builds the site and packages NMDESIGN-PORTFOLIO-FINAL.zip
#   dist/ (production) + demo/ (launchers) + source/ (tracked project files) + guide + credits
set -euo pipefail
cd "$(dirname "$0")/.."
NAME=NMDESIGN-PORTFOLIO-FINAL
npm run build >/dev/null
TMP="$(mktemp -d)"
trap 'rm -rf -- "$TMP"' EXIT
STAGE="$TMP/$NAME"
mkdir -p "$STAGE/source"
cp -R dist "$STAGE/dist"
cp -R demo "$STAGE/demo"
cp release/LISEZ-MOI.md "$STAGE/LISEZ-MOI.md"
cp CREDITS.md "$STAGE/CREDITS.md"
cp MISE-EN-LIGNE.md "$STAGE/MISE-EN-LIGNE.md"
cp SECURITE.md "$STAGE/SECURITE.md"
# source = files tracked by git, minus build output and release artefacts
git ls-files | grep -v -E '^(dist/|release/|NMDESIGN-PORTFOLIO-FINAL\.zip$)' | while read -r f; do
  mkdir -p "$STAGE/source/$(dirname "$f")"; cp "$f" "$STAGE/source/$f"
done
rm -f "$NAME.zip"
(cd "$(dirname "$STAGE")" && zip -qr -X "$OLDPWD/$NAME.zip" "$NAME")
echo "$NAME.zip  $(du -h "$NAME.zip" | cut -f1)"
