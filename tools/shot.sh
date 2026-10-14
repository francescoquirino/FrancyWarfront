#!/bin/bash
# uso: shot.sh <uscita.png> "<query>" [budget_ms]
R="$(cd "$(dirname "$0")/.." && pwd)"
timeout 240 google-chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --no-sandbox --hide-scrollbars \
  --window-size=1280,720 --virtual-time-budget=${3:-20000} --run-all-compositor-stages-before-draw \
  --user-data-dir=${TMPDIR:-/tmp}/fw-chrome-$$ --screenshot="$1" "file://$R/FrancyWarfront.html?demo=1&$2" 2>&1 | grep -v -i "dbus\|fontconfig\|gcm\|Fontconfig" | tail -5
rm -rf ${TMPDIR:-/tmp}/fw-chrome-$$
