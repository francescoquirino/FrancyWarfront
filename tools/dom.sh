#!/bin/bash
R="$(cd "$(dirname "$0")/.." && pwd)"
timeout 240 google-chrome --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --no-sandbox --window-size=1280,720 --virtual-time-budget=${2:-20000} \
  --user-data-dir=${TMPDIR:-/tmp}/fw-dom-$$ --dump-dom "file://$R/FrancyWarfront.html?demo=1&$1" 2>/dev/null | grep -o '<pre id="err"[^<]*</pre>\|<pre id="state"[^<]*</pre>'
rm -rf ${TMPDIR:-/tmp}/fw-dom-$$
