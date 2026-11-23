#!/bin/bash
# Double-click to open the portfolio in your browser (macOS).
cd "$(dirname "$0")"
DIST="../dist"
[ -d "$DIST" ] || DIST="./dist"
if command -v node >/dev/null 2>&1; then
  node serve.mjs "$DIST"
elif command -v python3 >/dev/null 2>&1; then
  echo "Node.js not found — using Python. Open http://localhost:4173/"
  (sleep 1; open "http://localhost:4173/") &
  python3 -m http.server 4173 --directory "$DIST"
else
  echo "Install Node.js (https://nodejs.org) or Python 3, then double-click again."
  read -r -p "Press Enter to close."
fi
